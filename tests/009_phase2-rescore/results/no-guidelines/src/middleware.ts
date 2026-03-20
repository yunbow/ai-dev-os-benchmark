import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const isAuth = !!req.auth;
  const isAuthPage = ["/login", "/register", "/forgot-password", "/reset-password"].some(
    (p) => pathname.startsWith(p),
  );
  const isPublicPage = isAuthPage || pathname.startsWith("/invite") || pathname.startsWith("/api");

  if (!isAuth && !isPublicPage) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuth && isAuthPage) {
    return NextResponse.redirect(new URL("/tasks", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
