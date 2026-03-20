import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { authLimiter, writeLimiter, readLimiter } from "@/lib/rate-limit";

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isAuthRoute(pathname: string): boolean {
  return (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password")
  );
}

function isWriteRoute(request: NextRequest): boolean {
  const method = request.method;
  return ["POST", "PUT", "PATCH", "DELETE"].includes(method);
}

function isDashboardRoute(pathname: string): boolean {
  return (
    pathname.startsWith("/tasks") ||
    pathname.startsWith("/categories") ||
    pathname.startsWith("/teams") ||
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard")
  );
}

export default auth(function middleware(request) {
  const { nextUrl } = request;
  const pathname = nextUrl.pathname;
  const ip = getClientIp(request as NextRequest);

  // Apply rate limiting based on route type
  let rateLimitResult: { success: boolean; remaining: number };

  if (isAuthRoute(pathname)) {
    rateLimitResult = authLimiter(ip);
  } else if (isWriteRoute(request as NextRequest)) {
    rateLimitResult = writeLimiter(ip);
  } else {
    rateLimitResult = readLimiter(ip);
  }

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests. Please try again later.",
          details: [],
        },
      },
      {
        status: 429,
        headers: {
          "Retry-After": "60",
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  // Protect dashboard routes - require authentication
  if (isDashboardRoute(pathname)) {
    const session = (request as NextRequest & { auth?: { user?: { id?: string } } }).auth;

    if (!session?.user?.id) {
      const loginUrl = new URL("/login", nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", pathname);

      // For API routes, return 401
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          {
            error: {
              code: "UNAUTHORIZED",
              message: "Authentication required.",
              details: [],
            },
          },
          { status: 401 }
        );
      }

      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next();
  response.headers.set(
    "X-RateLimit-Remaining",
    rateLimitResult.remaining.toString()
  );

  return response;
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
