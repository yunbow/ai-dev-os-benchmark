import { NextRequest, NextResponse } from "next/server";
import { users } from "@/lib/users";
import { signToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  if (users.find((u) => u.email === email)) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const user = { id: crypto.randomUUID(), email, password };
  users.push(user);

  const token = await signToken({ userId: user.id, email: user.email });

  const res = NextResponse.json({ ok: true }, { status: 201 });
  res.cookies.set("token", token, { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 });
  return res;
}
