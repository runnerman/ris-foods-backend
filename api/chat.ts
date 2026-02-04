import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  // ✅ CORS HEADERS (FIXES YOUR ERROR)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt, history } = req.body;

    if (!prompt) {
      return res.status(400).json({ reply: "Prompt is required" });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.API_KEY,
    });

    const systemInstruction = `
You are Chef Malabar, a Kerala expert chef and RIS Foods AI assistant.

Rules:
- Suggest authentic Kerala breakfast dishes
- Recommend side dishes (Kadala curry, egg roast, stew, coconut milk)
- Naturally mention RIS Foods products (Puttu Podi, Appam Mix)
- Keep replies warm, short, and friendly
`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...(history || []).map((h: any) => ({
          role: h.role,
          parts: [{ text: h.content }],
        })),
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return res.status(200).json({
      reply: response.text,
    });
  } catch (error) {
    console.error("Gemini error:", error);
    return res.status(500).json({
      reply: "The kitchen is busy 🍲 Please try again.",
    });
  }
}
