import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // ✅ CORS headers
  res.setHeader("Access-Control-Allow-Origin", "https://ris-foods.vercel.app");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ Handle preflight request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { full_name, email, mobile, message } = req.body;

    if (!full_name || !email || !mobile || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // TODO: send email / save to DB (later)
    console.log("General enquiry received:", {
      full_name,
      email,
      mobile,
      message,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
