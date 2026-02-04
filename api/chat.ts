import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  console.log("🔥 API HIT");

  if (req.method !== "POST") {
    console.log("❌ Wrong method:", req.method);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, history } = req.body;

    console.log("📩 Incoming message:", message);
    console.log(" Attach history:", history?.length);

    if (!message) {
      throw new Error("No message received");
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.API_KEY,
    });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...(history || []).map((h: any) => ({
          role: h.role,
          parts: [{ text: h.content }],
        })),
        { role: "user", parts: [{ text: message }] },
      ],
    });

    console.log("🧠 Gemini raw response:", response);

    const text =
      response.text ||
      response.candidates?.[0]?.content?.parts?.[0]?.text;

    console.log("✅ Final text:", text);

    if (!text) {
      throw new Error("No text returned from Gemini");
    }

    return res.status(200).json({ reply: text });
  } catch (error: any) {
    console.error("🚨 Gemini error:", error.message);
    return res.status(500).json({
      reply: "The kitchen is busy 🍲 Please try again.",
    });
  }
}
