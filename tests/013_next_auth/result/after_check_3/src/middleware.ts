import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";

const PROTECTED_PREFIXES = ["/dashboard"];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtected(pathname)) {
    return NextResponse.next();
  }

  // Cookie → Authorization ヘッダーの順にトークンを取得
  const cookieToken = request.cookies.get("auth-token")?.value;
  const headerToken = request.headers.get("authorization")?.replace(/^Bearer\s+/, "");
  const token = cookieToken ?? headerToken;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 検証済みユーザー情報をリクエストヘッダーに付与（Server Components で参照可能）
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", payload.sub);
  requestHeaders.set("x-user-email", payload.email);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
