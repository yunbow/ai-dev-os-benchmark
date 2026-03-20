import { auth } from "@/lib/auth/auth";
import { NextResponse } from "next/server";

const PROTECTED_PATHS = ["/dashboard", "/tasks", "/categories", "/teams"];
const PUBLIC_AUTH_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

// NextAuth v5 wraps the middleware with the auth handler
// req is augmented with `.auth` property by NextAuth
export default auth((req) => {
  const { pathname } = req.nextUrl;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = (req as any).auth as { user?: { id?: string } } | null;
  const isAuthenticated = !!session?.user?.id;

  // Redirect authenticated users away from auth pages
  if (
    isAuthenticated &&
    PUBLIC_AUTH_PATHS.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Redirect unauthenticated users to login
  if (
    !isAuthenticated &&
    PROTECTED_PATHS.some((p) => pathname.startsWith(p))
  ) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
