import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { loginSchema } from "@/features/auth/schema";
import { signToken } from "@/lib/auth/jwt";

// TODO: Replace with Prisma + DB in production
const users = new Map<string, { id: string; name: string; email: string; passwordHash: string }>();

export async function POST(request: Request) {
  // Rate limit: 10 req/min per IP (implement with Vercel KV in production)
  const body = await request.json().catch(() => null);

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;
  const user = users.get(email);

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await signToken({ sub: user.id, email: user.email, name: user.name });

  const response = NextResponse.json({ token }, { status: 200 });
  response.cookies.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60, // 1h
  });

  return response;
}
