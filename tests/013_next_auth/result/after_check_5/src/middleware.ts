import { NextResponse, type NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";

function getToken(req: NextRequest): string | null {
  const cookie = req.cookies.get("token")?.value;
  if (cookie) return cookie;

  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);

  return null;
}

export async function middleware(req: NextRequest) {
  const token = getToken(req);
  const payload = token ? await verifyToken(token) : null;

  if (!payload) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
