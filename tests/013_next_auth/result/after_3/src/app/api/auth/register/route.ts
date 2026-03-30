import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { registerSchema } from "@/features/auth/schema";
import { signToken } from "@/lib/auth/jwt";

// TODO: Replace with Prisma + DB in production
const users = new Map<string, { id: string; name: string; email: string; passwordHash: string }>();

export async function POST(request: Request) {
  // Rate limit: 10 req/min per IP (implement with Vercel KV in production)
  const body = await request.json().catch(() => null);

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { email, password, name } = parsed.data;

  if (users.has(email)) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const id = crypto.randomUUID();
  users.set(email, { id, name, email, passwordHash });

  const token = await signToken({ sub: id, email, name });

  return NextResponse.json({ token }, { status: 201 });
}
