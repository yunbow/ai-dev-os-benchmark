import { NextRequest, NextResponse } from "next/server";
import { signToken } from "@/lib/jwt";

// Must match the store in register/route.ts — use a shared DB in production
const users: { id: string; email: string; password: string }[] = [];

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }

  const token = await signToken({ userId: user.id, email: user.email });

  const response = NextResponse.json({ message: "Logged in successfully" });
  response.cookies.set("token", token, { httpOnly: true, path: "/" });
  return response;
}
