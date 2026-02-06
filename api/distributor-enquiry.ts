import type { VercelRequest, VercelResponse } from "@vercel/node";

/* ---------------- CORS SETUP ---------------- */

const ALLOWED_ORIGINS = [
  "https://ris-foods.vercel.app",
  "https://www.ris-foods.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173",
];

const PREVIEW_ORIGIN_REGEX = /^https:\/\/ris-foods(?:-[\w-]+)*\.vercel\.app$/;

const getOrigin = (originHeader: string | string[] | undefined): string => {
  if (Array.isArray(originHeader)) return originHeader[0] ?? "";
  return originHeader ?? "";
};

const isAllowedOrigin = (origin: string): boolean => {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (PREVIEW_ORIGIN_REGEX.test(origin)) return true;
  return false;
};

/* ---------------- RATE LIMIT ---------------- */

const rateLimit = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 5;

/* ---------------- HANDLER ---------------- */

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const origin = getOrigin(req.headers.origin);
  const clientIp =
    (req.headers["x-forwarded-for"] as string) ||
    req.socket.remoteAddress ||
    "unknown";

  /* ----- CORS HEADERS ----- */
  if (isAllowedOrigin(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Origin, Authorization"
  );
  res.setHeader("Access-Control-Max-Age", "86400");
  res.setHeader("Vary", "Origin");

  /* ----- PRE-FLIGHT ----- */
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    /* ----- RATE LIMIT ----- */
    const now = Date.now();
    const data = rateLimit.get(clientIp) || { count: 0, timestamp: now };

    if (now - data.timestamp > RATE_LIMIT_WINDOW) {
      data.count = 1;
      data.timestamp = now;
    } else {
      data.count++;
    }

    rateLimit.set(clientIp, data);

    if (data.count > RATE_LIMIT_MAX) {
      return res.status(429).json({
        error: "Too many requests. Please try again later.",
      });
    }

    /* ----- BODY PARSE ----- */
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
      comments,
    } = req.body;

    /* ----- REQUIRED VALIDATION ----- */
    if (!name || !firm_name || !address || !mobile || !email || !type) {
      return res.status(400).json({
        error: "Missing required fields",
      });
    }

    /* ----- FORMAT VALIDATION ----- */
    const errors: Record<string, string> = {};

    if (name.trim().length < 2) errors.name = "Name too short";
    if (firm_name.trim().length < 2) errors.firm_name = "Firm name required";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) errors.email = "Invalid email";

    const mobileRegex = /^\d{10}$/;
    if (!mobileRegex.test(mobile.replace(/\D/g, ""))) {
      errors.mobile = "Invalid mobile number";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors,
      });
    }

    /* ----- SANITIZE ----- */
    const enquiry = {
      name: name.trim(),
      firm_name: firm_name.trim(),
      address: address.trim(),
      telephone: telephone?.trim() || null,
      mobile: mobile.replace(/\D/g, ""),
      email: email.trim().toLowerCase(),
      type,
      year_of_establishment: year_of_establishment || null,
      turnover: turnover || null,
      warehouse_area: warehouse_area || null,
      comments: comments?.trim() || null,
      ip: clientIp,
      created_at: new Date().toISOString(),
    };

    console.log("Distributor enquiry received:", enquiry);

    /* ----- SUCCESS ----- */
    return res.status(200).json({
      success: true,
      message: "Distributor enquiry submitted successfully!",
      data: {
        id: `DIST-${Date.now()}`,
      },
    });
  } catch (err) {
    console.error("Distributor enquiry error:", err);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
}
