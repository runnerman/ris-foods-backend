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
        const { full_name, email, mobile, message } = req.body;

        /* ---------- Validation ---------- */
        if (!full_name || !email || !mobile || !message) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "Invalid email address" });
        }

        if (!/^\d{10}$/.test(mobile)) {
            return res.status(400).json({ error: "Invalid mobile number" });
        }

        if (message.length < 10) {
            return res.status(400).json({ error: "Message must be at least 10 characters" });
        }

        /* ---------- Insert into Supabase ---------- */
        const { error } = await supabase.from("general_enquiries").insert([
            {
                full_name: full_name.trim(),
                email: email.trim().toLowerCase(),
                mobile,
                message: message.trim(),
            },
        ]);

        if (error) {
            console.error("Supabase insert error:", error);
            return res.status(500).json({ error: "Database insert failed" });
        }

        return res.status(200).json({
            success: true,
            message: "Enquiry submitted successfully",
        });

    } catch (err) {
        console.error("General enquiry error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
}

