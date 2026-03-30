import { NextRequest, NextResponse } from "next/server";

// In-memory user store (replace with a real DB in production)
const users: { email: string; passwordHash: string }[] = [];

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

  if (users.find((u) => u.email === email)) {
    return NextResponse.json(
      { error: "user already exists" },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);
  users.push({ email, passwordHash });

  return NextResponse.json({ message: "registered" }, { status: 201 });
}
