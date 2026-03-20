import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { rateLimit } from "@/lib/rate-limit";
import { detectSuspiciousLogin } from "@/lib/security/suspicious-login-detector";
import { logger } from "@/lib/logger";

// --- Input Validation Schema ---
const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// --- CSRF: Origin / Referer check ---
function validateOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const host = req.headers.get("host");

  if (!host) return false;

  const allowedOrigins = [
    `https://${host}`,
    process.env.NEXTAUTH_URL,
  ].filter(Boolean);

  if (origin) {
    return allowedOrigins.some((allowed) => origin === allowed);
  }

  if (referer) {
    return allowedOrigins.some((allowed) => referer.startsWith(allowed!));
  }

  // No origin/referer: reject (browser always sends these for cross-origin requests)
  return false;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // --- CSRF: allow only POST (enforced by router), plus Origin check ---
  if (!validateOrigin(req)) {
    logger.warn({ url: req.url }, "Login rejected: invalid origin");
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  // --- Rate Limiting (auth preset: 10/min) ---
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const rateLimitResult = await rateLimit("auth", ip);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(rateLimitResult.limit),
          "X-RateLimit-Remaining": "0",
          "Retry-After": String(rateLimitResult.retryAfter),
        },
      }
    );
  }

  // --- Input Validation (Zod) ---
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    logger.warn({ issues: parsed.error.issues }, "Login validation failed");
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { email, password } = parsed.data;

  // --- Authentication via NextAuth.js v5 ---
  let userId: string;
  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    // NextAuth v5 signIn with redirect:false returns the session or throws
    if (!result || result.error) {
      logger.warn({ email }, "Login failed: invalid credentials");
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    userId = result.userId as string;
  } catch (err) {
    if (err instanceof AuthError) {
      // Do NOT leak internal error details (Section 3.7)
      logger.warn({ email, type: err.type }, "Login AuthError");
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }
    // Unexpected error — log but do not expose
    logger.error({ err }, "Unexpected error during login");
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }

  // --- Suspicious Login Detection (async, fail-safe, non-blocking) ---
  const currentCountry =
    req.headers.get("x-user-country") ??
    req.headers.get("x-vercel-ip-country") ??
    req.headers.get("cf-ipcountry") ??
    null;

  // Fire-and-forget: must not block the login response
  detectSuspiciousLogin({ userId, currentCountry }).catch((err) => {
    logger.error({ err, userId }, "Suspicious login detection failed (non-blocking)");
  });

  // --- Build response with session cookie ---
  // NextAuth.js v5 sets the session cookie via its internal handlers.
  // We return a minimal success payload; the cookie is already set by signIn().
  const response = NextResponse.json(
    { success: true },
    { status: 200 }
  );

  // Ensure security headers are present on this response (belt-and-suspenders)
  // The actual session cookie is managed by NextAuth; here we add HTTP security headers.
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Content-Security-Policy", "frame-ancestors 'none'");

  return response;
}
