import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname.startsWith(path));
}

export default auth((req: NextRequest & { auth: unknown }) => {
  const { pathname } = req.nextUrl;

  const isApiPath = pathname.startsWith("/api/");
  const isAuthPath = pathname.startsWith("/api/auth/");

  // Allow NextAuth internal routes
  if (isAuthPath) return NextResponse.next();

  // For API routes, return 401 JSON instead of redirecting
  if (isApiPath && !req.auth) {
    return Response.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 }
    );
  }

  // Redirect authenticated users away from auth pages
  if (req.auth && isPublicPath(pathname)) {
    return NextResponse.redirect(new URL("/tasks", req.url));
  }

  // Redirect unauthenticated users to login
  if (!req.auth && !isPublicPath(pathname) && !isApiPath) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
