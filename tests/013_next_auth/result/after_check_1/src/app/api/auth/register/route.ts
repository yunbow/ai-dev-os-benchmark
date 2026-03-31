import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { RegisterSchema } from "@/lib/auth/schemas";
import { createUser, findUserByEmail } from "@/lib/auth/users";
import { signJWT } from "@/lib/jwt";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const { success } = await checkRateLimit(`auth:register:${ip}`, {
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
  const parsed = RegisterSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;

  if (findUserByEmail(email)) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = createUser(email, passwordHash);
  const token = await signJWT({ sub: user.id, email: user.email });

  const res = NextResponse.json({ userId: user.id }, { status: 201 });
  res.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  return res;
}
