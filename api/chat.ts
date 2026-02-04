import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ reply: "No message received" });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.API_KEY,
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
        { role: "user", parts: [{ text: message }] },
      ],
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return res.status(200).json({
      reply: response.text || "Chef Malabar is thinking… 🍳",
    });
  } catch (error) {
    console.error("Gemini error:", error);
    return res.status(500).json({
      reply: "The kitchen is busy 🍲 Please try again.",
    });
  }
}
