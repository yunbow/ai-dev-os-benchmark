import { NextRequest, NextResponse } from "next/server";

// --- Admin IP Restriction ---

const ADMIN_ALLOWED_IPS = process.env.ADMIN_ALLOWED_IPS ?? "";

function ipToNumber(ip: string): number {
  return ip
    .split(".")
    .reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

function isIpInCidr(ip: string, cidr: string): boolean {
  const [base, prefixLen] = cidr.split("/");
  if (!prefixLen) return ip === base;
  const mask = ~((1 << (32 - parseInt(prefixLen, 10))) - 1) >>> 0;
  return (ipToNumber(ip) & mask) === (ipToNumber(base) & mask);
}

function normalizeIp(ip: string): string {
  // Normalize IPv6 loopback to IPv4
  if (ip === "::1" || ip === "::ffff:127.0.0.1") return "127.0.0.1";
  // Strip IPv6-mapped IPv4 prefix
  if (ip.startsWith("::ffff:")) return ip.slice(7);
  return ip;
}

function isAdminIpAllowed(clientIp: string | null): boolean {
  if (!ADMIN_ALLOWED_IPS) return true; // No restriction configured

  if (!clientIp) return false; // Cannot determine IP → block

  const normalized = normalizeIp(clientIp);
  const allowed = ADMIN_ALLOWED_IPS.split(",").map((s) => s.trim()).filter(Boolean);

  return allowed.some((entry) =>
    entry.includes("/") ? isIpInCidr(normalized, entry) : normalized === entry
  );
}

// --- CSP Nonce Generation ---

function generateNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString("base64");
}

function buildCsp(nonce: string): string {
  const directives: Record<string, string> = {
    "default-src": "'self'",
    "script-src": `'nonce-${nonce}' 'strict-dynamic'`,
    "style-src": "'self' 'unsafe-inline'", // Tailwind/CSS-in-JS often needs this
    "img-src": "'self' data: https:",
    "font-src": "'self'",
    "connect-src": "'self'",
    "frame-ancestors": "'none'",
    "form-action": "'self'",
    "base-uri": "'self'",
    "object-src": "'none'",
    "upgrade-insecure-requests": "",
  };

  return Object.entries(directives)
    .map(([key, value]) => (value ? `${key} ${value}` : key))
    .join("; ");
}

// --- Security Headers ---

function applySecurityHeaders(response: NextResponse, nonce: string): void {
  const csp = buildCsp(nonce);

  response.headers.set("Content-Security-Policy", csp);
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
  response.headers.set("x-nonce", nonce);
}

// --- CSRF Protection for API Routes ---

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "DELETE", "PATCH"]);

function isCsrfSafe(req: NextRequest): boolean {
  const method = req.method.toUpperCase();

  // Safe methods don't need CSRF protection
  if (SAFE_METHODS.has(method)) return true;

  // Only POST/PUT/DELETE/PATCH are state-changing
  if (!STATE_CHANGING_METHODS.has(method)) return false;

  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const host = req.headers.get("host");

  // Require Origin or Referer header for state-changing requests
  const sourceHeader = origin ?? referer;
  if (!sourceHeader) return false;

  try {
    const sourceUrl = new URL(sourceHeader);
    // Must match the request host
    return sourceUrl.host === host;
  } catch {
    return false;
  }
}

// --- Maintenance Mode ---

const MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === "true";

// --- Middleware ---

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const nonce = generateNonce();

  // Resolve client IP
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;

  // --- Maintenance mode redirect ---
  if (
    MAINTENANCE_MODE &&
    pathname !== "/maintenance" &&
    !isAdminIpAllowed(clientIp)
  ) {
    return NextResponse.redirect(new URL("/maintenance", req.url));
  }

  // --- Admin path IP restriction ---
  if (pathname.startsWith("/admin")) {
    if (!isAdminIpAllowed(clientIp)) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  // --- CSRF protection for API routes ---
  if (pathname.startsWith("/api/")) {
    if (!isCsrfSafe(req)) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  // --- Pass request through with security headers ---
  const response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  applySecurityHeaders(response, nonce);

  // Propagate nonce as a request header so layout/pages can read it
  response.headers.set("x-nonce", nonce);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static  (static files)
     * - _next/image   (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon\\.ico).*)",
  ],
};
