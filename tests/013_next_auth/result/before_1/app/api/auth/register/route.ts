import { NextRequest, NextResponse } from "next/server";
import { signToken } from "@/lib/jwt";
import { randomUUID } from "crypto";

// In-memory store (replace with a real DB in production)
const users: { id: string; email: string; password: string }[] = [];

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
      { error: "email already registered" },
      { status: 409 }
    );
  }

  const user = { id: randomUUID(), email, password };
  users.push(user);

  const token = await signToken({ userId: user.id, email: user.email });

  const response = NextResponse.json({ message: "registered" }, { status: 201 });
  response.cookies.set("token", token, { httpOnly: true, path: "/" });
  return response;
}
