import { NextRequest, NextResponse } from "next/server";
import { verifyJWT } from "@/lib/jwt";

const PROTECTED_PATHS = ["/dashboard"];

function isProtected(pathname: string): boolean {
  return PROTECTED_PATHS.some((p) => pathname.startsWith(p));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!isProtected(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/api/auth/login", req.url));
  }

  try {
    await verifyJWT(token);
    return NextResponse.next();
  } catch {
    const res = NextResponse.redirect(new URL("/api/auth/login", req.url));
    res.cookies.delete("token");
    return res;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
