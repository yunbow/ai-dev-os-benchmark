import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { LoginSchema } from "@/lib/auth/schemas";
import { findUserByEmail } from "@/lib/auth/users";
import { signJWT } from "@/lib/jwt";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const { success } = await checkRateLimit(`auth:login:${ip}`, {
    maxRequests: 10,
    windowMs: 60_000,
  });
  if (!success) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429 }
    );
  }

  const body = await req.json();
  const parsed = LoginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;
  const user = findUserByEmail(email);

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await signJWT({ sub: user.id, email: user.email });

  const res = NextResponse.json({ userId: user.id }, { status: 200 });
  res.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  return res;
}
