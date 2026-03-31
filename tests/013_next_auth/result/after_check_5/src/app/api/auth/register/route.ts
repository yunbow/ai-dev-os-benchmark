import bcrypt from "bcryptjs";
import { registerSchema } from "@/features/auth/schema";

// In-memory store — replace with Prisma in a real project
const users = new Map<string, { id: string; email: string; passwordHash: string }>();

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const result = registerSchema.safeParse(body);

  if (!result.success) {
    return Response.json(
      { error: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { email, password } = result.data;

  if (users.has(email)) {
    return Response.json({ error: "Email already registered" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const id = crypto.randomUUID();
  users.set(email, { id, email, passwordHash });

  return Response.json({ message: "Registered" }, { status: 201 });
}
