import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, history } = req.body;

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY, // ✅ FIXED
    });

    const systemInstruction = `
You are Chef Malabar, a Kerala expert chef and RIS Foods AI assistant.
Suggest authentic Kerala breakfast dishes, side dishes, and RIS Foods products.
Keep responses warm, short, and friendly.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...(history || []).map((h: any) => ({
          role: h.role,
          parts: [{ text: h.content }],
        })),
        { role: "user", parts: [{ text: message }] }, // ✅ FIXED
      ],
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.status(200).json({
      reply: response.text,
    });
  } catch (error) {
    console.error("Gemini error:", error);
    res.status(500).json({
      reply: "The kitchen is busy 🍲 Please try again.",
    });
  }
}
