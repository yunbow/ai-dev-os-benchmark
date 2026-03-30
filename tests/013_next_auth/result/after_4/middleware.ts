import { NextResponse, type NextRequest } from "next/server";
import { verifyJwt, COOKIE_NAME } from "@/lib/auth/jwt";

const PROTECTED_PREFIXES = ["/dashboard"];
const AUTH_ROUTES = ["/login", "/register"];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => pathname.startsWith(route));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const payload = token ? await verifyJwt(token) : null;
  const isAuthenticated = payload !== null;

  // 未認証で保護ルートにアクセス → /login へリダイレクト
  if (isProtected(pathname) && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 認証済みで /login や /register にアクセス → /dashboard へリダイレクト
  if (isAuthRoute(pathname) && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // /api/* と Next.js 内部ルートは除外
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
