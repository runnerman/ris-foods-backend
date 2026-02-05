import type { VercelRequest, VercelResponse } from "@vercel/node";

const ALLOWED_ORIGINS = [
  "https://ris-foods.vercel.app",
  "https://www.ris-foods.vercel.app",
  // Add localhost for development
  "http://localhost:3000",
  "http://localhost:5173", // Vite dev server
];

const PREVIEW_ORIGIN_REGEX = /^https:\/\/ris-foods(?:-[\w-]+)*\.vercel\.app$/;

const getOrigin = (originHeader: string | string[] | undefined): string => {
  if (Array.isArray(originHeader)) {
    return originHeader[0] ?? "";
  }
  return originHeader ?? "";
};

const isAllowedOrigin = (origin: string): boolean => {
  if (!origin) {
    return false;
  }

  if (ALLOWED_ORIGINS.includes(origin)) {
    return true;
  }

  if (PREVIEW_ORIGIN_REGEX.test(origin)) {
    return true;
  }

  const envOrigins =
    process.env.ALLOWED_ORIGINS
      ?.split(",")
      .map((item) => item.trim())
      .filter(Boolean) ?? [];
  return envOrigins.includes(origin);
};

// Rate limiting setup (simple in-memory cache)
const rateLimit = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 5; // 5 requests per minute

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const origin = getOrigin(req.headers.origin);
  const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  // 1. Set CORS headers
  if (isAllowedOrigin(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  // Add these additional CORS headers
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS, GET");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Origin, Authorization"
  );
  res.setHeader("Access-Control-Max-Age", "86400");
  res.setHeader("Vary", "Origin"); // Important for caching

  // ✅ Preflight request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 2. Simple rate limiting
    if (clientIp) {
      const now = Date.now();
      const clientData = rateLimit.get(clientIp) || { count: 0, timestamp: now };

      if (now - clientData.timestamp > RATE_LIMIT_WINDOW) {
        // Reset counter if window has passed
        clientData.count = 1;
        clientData.timestamp = now;
      } else {
        clientData.count++;
      }

      rateLimit.set(clientIp, clientData);

      if (clientData.count > RATE_LIMIT_MAX) {
        return res.status(429).json({
          error: "Too many requests. Please try again later.",
        });
      }
    }

    // 3. Parse and validate request body
    const { full_name, email, mobile, message } = req.body;

    // Validate all required fields exist
    if (!full_name || !email || !mobile || !message) {
      return res.status(400).json({
        error: "Missing required fields",
        details: {
          full_name: !full_name ? "Full name is required" : undefined,
          email: !email ? "Email is required" : undefined,
          mobile: !mobile ? "Mobile number is required" : undefined,
          message: !message ? "Message is required" : undefined,
        },
      });
    }

    // 4. Validate field formats
    const validationErrors: Record<string, string> = {};

    // Name validation (at least 2 characters)
    if (full_name.trim().length < 2) {
      validationErrors.full_name = "Full name must be at least 2 characters";
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      validationErrors.email = "Please enter a valid email address";
    }

    // Mobile validation (10 digits for India)
    const mobileRegex = /^\d{10}$/;
    if (!mobileRegex.test(mobile.trim().replace(/\D/g, ""))) {
      validationErrors.mobile = "Please enter a valid 10-digit mobile number";
    }

    // Message validation
    if (message.trim().length < 10) {
      validationErrors.message = "Message must be at least 10 characters";
    }
    if (message.trim().length > 1000) {
      validationErrors.message = "Message cannot exceed 1000 characters";
    }

    // If there are validation errors, return them
    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        details: validationErrors,
      });
    }

    // 5. Sanitize inputs
    const sanitizedData = {
      full_name: full_name.trim(),
      email: email.trim().toLowerCase(),
      mobile: mobile.trim().replace(/\D/g, ""),
      message: message.trim(),
      timestamp: new Date().toISOString(),
      ip: clientIp,
    };

    // 6. Log the enquiry (in production, you'd save to database)
    console.log("General enquiry received:", sanitizedData);

    // 7. Here you would typically:
    // - Save to database
    // - Send email notification
    // - Trigger workflow
    // For now, just return success

    return res.status(200).json({
      success: true,
      message: "Enquiry submitted successfully!",
      data: {
        id: `ENQ-${Date.now()}`,
        received_at: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("General enquiry error:", error);

    // Different error types
    if (error.name === "SyntaxError") {
      return res.status(400).json({
        error: "Invalid JSON format",
      });
    }

    return res.status(500).json({
      error: "Internal server error",
      message: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

// Clean up rate limit map periodically (optional)
if (process.env.NODE_ENV !== "production") {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of rateLimit.entries()) {
      if (now - data.timestamp > RATE_LIMIT_WINDOW * 10) {
        rateLimit.delete(ip);
      }
    }
  }, RATE_LIMIT_WINDOW * 10);
}
