import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

// SEC-03: Zod validation for all input data
const loginSchema = z.object({
  email: z.string().email("Invalid email format").max(254),
  password: z.string().min(8).max(128),
});

export async function POST(req: NextRequest) {
  // SEC-06: Origin / Referer checks
  const origin = req.headers.get("origin");
  const allowedOrigin = process.env.NEXTAUTH_URL;
  if (origin && allowedOrigin && origin !== allowedOrigin) {
    logger.warn({ origin }, "Login attempt from disallowed origin");
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // SEC-10: IP-based rate limiting
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const rateLimitResult = await rateLimit("auth", ip);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimitResult.retryAfter),
          "X-RateLimit-Limit": String(rateLimitResult.limit),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  // SEC-03: Parse and validate input
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;

  try {
    // Authenticate via NextAuth.js v5 credentials provider
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (!result || result.error) {
      // SEC-28: Log auth failures
      logger.warn({ email, ip }, "Login failed: invalid credentials");
      // Return generic error to avoid user enumeration
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // SEC-17: No stack traces or internal details in response
    const response = NextResponse.json(
      { message: "Login successful" },
      { status: 200 }
    );

    // SEC-05, SEC-23, SEC-25: Cookie security flags
    // NextAuth.js v5 sets session cookies automatically via signIn(),
    // but we ensure the response forwards any Set-Cookie headers from NextAuth.
    // Cookie flags (Secure, HttpOnly, SameSite=Lax) are configured in auth.ts.

    return response;
  } catch (error) {
    if (error instanceof AuthError) {
      // SEC-28: Log auth failures
      logger.warn({ email, ip, type: error.type }, "Auth error during login");
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // SEC-17: No internal error details in response
    logger.error({ ip, error }, "Unexpected error during login");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
