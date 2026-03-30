import { NextRequest, NextResponse } from "next/server";
import { createUser, findUserByEmail, hashPassword } from "@/lib/users";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "email and password are required" }, { status: 400 });
  }

  if (await findUserByEmail(email)) {
    return NextResponse.json({ error: "email already registered" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await createUser(email, passwordHash);
  const token = await signToken({ sub: user.id, email: user.email });

  return NextResponse.json({ token }, { status: 201 });
}
