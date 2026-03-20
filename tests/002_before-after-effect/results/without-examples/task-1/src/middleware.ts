import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminIpAllowed } from "@/lib/security/admin-ip-restriction";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/security/rate-limiter";

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Maintenance mode check
  if (
    process.env.MAINTENANCE_MODE === "true" &&
    !pathname.startsWith("/maintenance") &&
    !pathname.startsWith("/api/health")
  ) {
    return NextResponse.redirect(new URL("/maintenance", req.url));
  }

  // Generate CSP nonce
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  // Content Security Policy
  const cspDirectives = [
    `default-src 'self'`,
    `script-src 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'unsafe-inline'`, // unsafe-inline needed for Tailwind
    `img-src 'self' data: blob: https:`,
    `font-src 'self'`,
    `connect-src 'self'`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `object-src 'none'`,
  ].join("; ");

  // Admin IP restriction
  if (pathname.startsWith("/admin")) {
    const clientIp = getClientIp(req);
    if (!isAdminIpAllowed(clientIp)) {
      return new NextResponse("Forbidden", {
        status: 403,
        headers: {
          "Content-Type": "text/plain",
          "Content-Security-Policy": cspDirectives,
        },
      });
    }
  }

  // Rate limiting
  const clientIp = getClientIp(req);
  let rateLimitResult;

  if (pathname.startsWith("/api/v1/auth") || pathname.startsWith("/auth/") || pathname.startsWith("/api/auth/")) {
    rateLimitResult = checkRateLimit(`auth:${clientIp}`, "auth");
  } else if (
    req.method === "POST" ||
    req.method === "PUT" ||
    req.method === "PATCH" ||
    req.method === "DELETE"
  ) {
    rateLimitResult = checkRateLimit(`write:${clientIp}`, "write");
  } else if (pathname.startsWith("/api/")) {
    rateLimitResult = checkRateLimit(`read:${clientIp}`, "read");
  }

  if (rateLimitResult && !rateLimitResult.success) {
    const headers = getRateLimitHeaders(rateLimitResult);
    return new NextResponse(
      JSON.stringify({
        error: {
          code: "RATE_LIMITED",
          message: "Too many requests. Please try again later.",
          details: [],
        },
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      },
    );
  }

  // Auth protection for dashboard routes
  const session = await auth();
  const isAuthenticated = !!session?.user;

  const protectedPaths = ["/dashboard", "/tasks", "/categories", "/teams", "/admin"];
  const isProtectedPath = protectedPaths.some((p) => pathname.startsWith(p));
  const isAuthPath =
    pathname.startsWith("/auth/") ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/reset-password";

  if (isProtectedPath && !isAuthenticated) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPath && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Build response with security headers
  const response = NextResponse.next({
    request: {
      headers: new Headers({
        ...Object.fromEntries(req.headers.entries()),
        "x-nonce": nonce,
      }),
    },
  });

  // Set CSP header
  response.headers.set("Content-Security-Policy", cspDirectives);
  response.headers.set("X-Nonce", nonce);

  // Add rate limit headers if applicable
  if (rateLimitResult) {
    const headers = getRateLimitHeaders(rateLimitResult);
    for (const [key, value] of Object.entries(headers)) {
      response.headers.set(key, value);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
