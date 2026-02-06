import type { VercelRequest, VercelResponse } from "@vercel/node";

const ALLOWED_ORIGINS = [
  "https://ris-foods.vercel.app",
  "https://www.ris-foods.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173",
];

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const origin = req.headers.origin || "";

  /* ---------- CORS ---------- */
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGINS[0]);
  }

  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Origin"
  );
  res.setHeader("Access-Control-Max-Age", "86400");

  // ✅ Preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only POST allowed
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, email, mobile, feedback, rating } = req.body;

    /* ---------- Validation ---------- */
    if (!name || !email || !mobile || !feedback || !rating) {
      return res.status(400).json({
        error: "Missing required fields",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const mobileRegex = /^\d{10}$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email address" });
    }

    if (!mobileRegex.test(mobile)) {
      return res.status(400).json({ error: "Invalid mobile number" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    /* ---------- Process ---------- */
    const feedbackData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      mobile,
      feedback: feedback.trim(),
      rating,
      submittedAt: new Date().toISOString(),
    };

    // For now: log (later DB / email)
    console.log("Customer feedback received:", feedbackData);

    return res.status(200).json({
      success: true,
      message: "Thank you for your feedback!",
    });

  } catch (error) {
    console.error("Customer feedback error:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
}
