import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { isAdminIpAllowed } from "@/lib/security/admin-ip-restriction";

function getClientIp(req: NextRequest): string | null {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const clientIp = getClientIp(req);

  // Maintenance mode: redirect all non-admin traffic to /maintenance
  if (
    process.env.MAINTENANCE_MODE === "true" &&
    pathname !== "/maintenance" &&
    !isAdminIpAllowed(clientIp)
  ) {
    return NextResponse.redirect(new URL("/maintenance", req.url));
  }

  // Admin panel: IP restriction
  if (pathname.startsWith("/admin")) {
    if (!isAdminIpAllowed(clientIp)) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  // Generate a per-request CSP nonce for inline script control
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = [
    `default-src 'self'`,
    `script-src 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data:`,
    `font-src 'self'`,
    `connect-src 'self'`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
  ].join("; ");

  const response = NextResponse.next();

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("x-nonce", nonce);
  // Additional clickjacking prevention
  response.headers.set("X-Frame-Options", "DENY");

  // Protected app routes: require authentication
  if (pathname.startsWith("/(app)") || isProtectedPath(pathname)) {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });
    if (!token) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

function isProtectedPath(pathname: string): boolean {
  const protectedPrefixes = ["/dashboard", "/tasks", "/teams"];
  return protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth).*)",
  ],
};
