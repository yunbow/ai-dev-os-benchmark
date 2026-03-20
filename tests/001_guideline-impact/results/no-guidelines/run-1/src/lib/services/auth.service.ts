import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import type { RegisterInput } from "@/lib/validations/auth";

export async function registerUser(data: RegisterInput) {
  const existing = await db.user.findUnique({ where: { email: data.email } });
  if (existing) throw new Error("EMAIL_IN_USE");

  const hashedPassword = await bcrypt.hash(data.password, 12);

  const user = await db.user.create({
    data: {
      email: data.email,
      name: data.name,
      hashedPassword,
    },
    select: { id: true, email: true, name: true },
  });

  return user;
}

export async function requestPasswordReset(email: string): Promise<void> {
  const user = await db.user.findUnique({ where: { email } });
  // Don't reveal whether the email exists
  if (!user) return;

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.user.update({
    where: { id: user.id },
    data: { resetToken: token, resetTokenExpiry: expiresAt },
  });

  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
  await sendPasswordResetEmail(email, resetUrl);
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const user = await db.user.findUnique({ where: { resetToken: token } });

  if (!user || !user.resetTokenExpiry) throw new Error("INVALID_TOKEN");
  if (user.resetTokenExpiry < new Date()) throw new Error("TOKEN_EXPIRED");

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await db.user.update({
    where: { id: user.id },
    data: {
      hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });
}
