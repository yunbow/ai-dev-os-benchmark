import { NextRequest, NextResponse } from "next/server";
import { signToken } from "@/lib/jwt";

// Shared in-memory store (same module-level array as register in a real app
// would come from a database)
const users: { id: string; email: string; password: string }[] = [];

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "email and password are required" },
      { status: 400 }
    );
  }

  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) {
    return NextResponse.json(
      { error: "invalid credentials" },
      { status: 401 }
    );
  }

  const token = await signToken({ userId: user.id, email: user.email });

  const response = NextResponse.json({ message: "logged in" });
  response.cookies.set("token", token, { httpOnly: true, path: "/" });
  return response;
}
