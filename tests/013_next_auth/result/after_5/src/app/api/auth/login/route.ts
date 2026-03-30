import bcrypt from "bcryptjs";
import { loginSchema } from "@/features/auth/schema";
import { signToken } from "@/lib/auth/jwt";

// Shared in-memory store — replace with Prisma in a real project
// This Map must be the same instance as in register/route.ts.
// In a real project, both routes would import from the Prisma client.
const users = new Map<string, { id: string; email: string; passwordHash: string }>();

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const result = loginSchema.safeParse(body);

  if (!result.success) {
    return Response.json(
      { error: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { email, password } = result.data;
  const user = users.get(email);

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await signToken({ sub: user.id, email: user.email });

  return new Response(JSON.stringify({ token }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": `token=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 60 * 60}`,
    },
  });
}
