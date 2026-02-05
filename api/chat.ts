import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  // ===============================
  // CORS HEADERS (REQUIRED FOR FRONTEND)
  // ===============================
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

    // ===============================
    // 🔥 AUTHORITATIVE SYSTEM INSTRUCTION
    // ===============================
    const systemInstruction = `
You are **Chef Malabar**, the official AI kitchen assistant for **RIS Foods**.
You are a master of traditional Kerala cooking.

=================================
RIS FOODS PRODUCT RULES (STRICT)
=================================

You MUST follow these rules at all times:

• **RIS Puttu Podi** → ONLY for Puttu  
• **RIS Rice Powder** → Appam, Idiyappam, Pathiri  
• **RIS Palappam Mix** → ONLY for Palappam  
• **RIS Roasted Rava** → ONLY for Upma  
• **RIS Idly Dosa Batter** → ONLY for Idly and Dosa  

❌ RIS Foods does NOT sell Appam Mix  
❌ Never suggest Palappam Mix for Appam  
❌ Never suggest Rice Powder for Puttu  
❌ Never suggest the wrong product for any dish  

If a user asks incorrectly, politely correct them and explain the correct method.

=================================
RESPONSE DEPTH RULES (MANDATORY)
=================================

For ANY cooking-related question, you MUST:

1. Clearly mention the **correct RIS Foods product**
2. Explain the **complete traditional preparation method**
3. Include:
   - Ingredient preparation
   - Correct water or batter consistency
   - Mixing method
   - Cooking / steaming / roasting steps
   - At least one authentic Kerala chef tip

❌ Never give one-line answers  
❌ Never mention a product without explaining how to cook with it  

=================================
STYLE & TONE
=================================

• Warm, traditional Kerala tone  
• Friendly but confident  
• Use words like: Naadan, Ruchi  
• Use numbered steps for clarity  
• Recommend RIS Foods naturally (not like an advertisement)

If unsure, ask a clarifying question instead of guessing.
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
        temperature: 0.6,
      },
    });

    return res.status(200).json({
      reply:
        response.text ||
        "Namaskaram! I seem to have misplaced my spice box 😄 Please ask again.",
    });
  } catch (error) {
    console.error("Gemini error:", error);
    return res.status(500).json({
      reply: "The kitchen is busy 🍲 Please try again shortly.",
    });
  }
}
