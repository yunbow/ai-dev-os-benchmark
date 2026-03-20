import { NextRequest, NextResponse } from "next/server";

// Admin IP restriction helper
function isAdminIpAllowed(clientIp: string | null): boolean {
  const allowedIps = process.env.ADMIN_ALLOWED_IPS;

  // If undefined, no restriction is applied
  if (!allowedIps) return true;

  // Block access if IP cannot be determined
  if (!clientIp) return false;

  // Normalize IPv6 loopback to IPv4
  const normalizedIp = clientIp === "::1" ? "127.0.0.1" : clientIp;

  const allowedList = allowedIps.split(",").map((ip) => ip.trim());

  for (const allowed of allowedList) {
    if (allowed.includes("/")) {
      // CIDR notation support
      if (isIpInCidr(normalizedIp, allowed)) return true;
    } else {
      if (normalizedIp === allowed) return true;
    }
  }

  return false;
}

function isIpInCidr(ip: string, cidr: string): boolean {
  const [range, bits] = cidr.split("/");
  const mask = ~((1 << (32 - parseInt(bits))) - 1);

  const ipNum = ipToNum(ip);
  const rangeNum = ipToNum(range);

  if (ipNum === null || rangeNum === null) return false;

  return (ipNum & mask) === (rangeNum & mask);
}

function ipToNum(ip: string): number | null {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return null;
  }
  return (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3];
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Get client IP from various headers (Vercel, Cloudflare, etc.)
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;

  // Maintenance mode
  if (
    process.env.MAINTENANCE_MODE === "true" &&
    pathname !== "/maintenance" &&
    !isAdminIpAllowed(clientIp)
  ) {
    return NextResponse.redirect(new URL("/maintenance", req.url));
  }

  // Admin path IP restriction
  if (pathname.startsWith("/admin") && !isAdminIpAllowed(clientIp)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // CSRF protection for state-changing API routes
  if (pathname.startsWith("/api/")) {
    const method = req.method.toUpperCase();
    if (["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
      const origin = req.headers.get("origin");
      const referer = req.headers.get("referer");
      const host = req.headers.get("host");

      const requestUrl = req.url;
      const expectedOrigin = new URL(requestUrl).origin;

      const originOk = origin ? origin === expectedOrigin : false;
      const refererOk = referer
        ? referer.startsWith(expectedOrigin + "/")
        : false;

      if (!originOk && !refererOk) {
        return new NextResponse("Forbidden: CSRF check failed", {
          status: 403,
        });
      }
    }
  }

  // Generate CSP nonce per request
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  const csp = [
    `default-src 'self'`,
    `script-src 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'nonce-${nonce}'`,
    `img-src 'self' data: blob: https:`,
    `font-src 'self'`,
    `connect-src 'self'`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `object-src 'none'`,
  ].join("; ");

  const response = NextResponse.next();

  // Security headers
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("x-nonce", nonce);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
