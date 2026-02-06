import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../lib/supabase";
import { sendEmail, createDistributorEnquiryEmail } from "../lib/email";

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
        // Frontend sends these field names
        const {
            name,
            firm_name,
            address,
            telephone,
            mobile,
            email,
            type,
            year_of_establishment,
            turnover,
            warehouse_area,
            comments
        } = req.body;

        /* ---------- Validation ---------- */
        if (!name || !firm_name || !address || !mobile || !email) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "Invalid email address" });
        }

        if (!/^\d{10}$/.test(mobile)) {
            return res.status(400).json({ error: "Invalid mobile number" });
        }

        /* ---------- Insert into Supabase ---------- */
        const { error } = await supabase.from("distributor_enquiries").insert([
            {
                full_name: name.trim(),
                company_name: firm_name.trim(),
                business_address: address.trim(),
                telephone: telephone?.trim() || null,
                mobile,
                email: email.trim().toLowerCase(),
                firm_type: type?.trim() || null,
                year_of_establishment: year_of_establishment?.trim() || null,
                turnover_last_fy: turnover?.trim() || null,
                warehouse_area_sqft: warehouse_area?.trim() || null,
                comments: comments?.trim() || null,
            },
        ]);

        if (error) {
            console.error("Supabase insert error:", error);
            return res.status(500).json({ error: "Database insert failed" });
        }

        /* ---------- Send Email Notification ---------- */
        const emailContent = createDistributorEnquiryEmail({
            name: name.trim(),
            firm_name: firm_name.trim(),
            address: address.trim(),
            telephone: telephone?.trim(),
            mobile,
            email: email.trim().toLowerCase(),
            type: type?.trim(),
            year_of_establishment: year_of_establishment?.trim(),
            turnover: turnover?.trim(),
            warehouse_area: warehouse_area?.trim(),
            comments: comments?.trim(),
        });

        await sendEmail(emailContent);
        // Note: We don't fail the request if email fails, just log it

        return res.status(200).json({
            success: true,
            message: "Distributor enquiry submitted successfully",
        });

    } catch (err) {
        console.error("Distributor enquiry error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
}

