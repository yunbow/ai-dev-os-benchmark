import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";

// Must match the store in register/route.ts — use a shared DB in production
const users: { email: string; passwordHash: string }[] = [];

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "change-this-secret-in-production"
);

async function hashPassword(password: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(password)
  );
  return Buffer.from(buf).toString("hex");
}

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "email and password are required" },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(password);
  const user = users.find(
    (u) => u.email === email && u.passwordHash === passwordHash
  );

  if (!user) {
    return NextResponse.json(
      { error: "invalid credentials" },
      { status: 401 }
    );
  }

  const token = await new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1h")
    .sign(JWT_SECRET);

  const response = NextResponse.json({ message: "logged in" });
  response.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60, // 1 hour
    path: "/",
  });

  return response;
}
