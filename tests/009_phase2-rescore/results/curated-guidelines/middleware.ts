import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;

  const publicPaths = ["/login", "/register", "/forgot-password", "/reset-password"];
  const isPublicPath = publicPaths.some((p) => pathname.startsWith(p));

  if (!isAuthenticated && !isPublicPath && !pathname.startsWith("/api/auth")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isAuthenticated && isPublicPath) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
