import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../lib/supabase";

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

  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, email, mobile, feedback, rating } = req.body;

    /* ---------- Validation ---------- */
    if (!name || !email || !mobile || !feedback || !rating) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email address" });
    }

    if (!/^\d{10}$/.test(mobile)) {
      return res.status(400).json({ error: "Invalid mobile number" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    /* ---------- Insert into Supabase ---------- */
    const { error } = await supabase.from("customer_feedback").insert([
      {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        mobile,
        rating,
        feedback: feedback.trim(),  // ✅ Changed from "message" to "feedback"
      },
    ]);

    if (error) {
      console.error("Supabase insert error:", error);
      return res.status(500).json({ error: "Database insert failed" });
    }

    return res.status(200).json({
      success: true,
      message: "Thank you for your feedback!",
    });

  } catch (err) {
    console.error("Customer feedback error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}