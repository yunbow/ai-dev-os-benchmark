import { NextRequest, NextResponse } from "next/server";
import { signToken } from "@/lib/jwt";

// In-memory user store (replace with a real DB in production)
const users: { id: string; email: string; password: string }[] = [];

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  if (users.find((u) => u.email === email)) {
    return NextResponse.json(
      { error: "Email already registered" },
      { status: 409 }
    );
  }

  const user = { id: crypto.randomUUID(), email, password };
  users.push(user);

  const token = await signToken({ userId: user.id, email: user.email });

  const response = NextResponse.json({ message: "Registered successfully" }, { status: 201 });
  response.cookies.set("token", token, { httpOnly: true, path: "/" });
  return response;
}
