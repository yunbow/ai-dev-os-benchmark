import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { resetPasswordSchema } from "@/lib/validations/auth";
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  apiInternalError,
} from "@/lib/api-response";
import {
  authRateLimiter,
  getIdentifier,
  rateLimitResponse,
} from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // Rate limiting
  const identifier = getIdentifier(request, "reset-password");
  const rateLimitResult = authRateLimiter.check(identifier);
  if (!rateLimitResult.success) {
    return rateLimitResponse(rateLimitResult.resetTime);
  }

  try {
    const body = await request.json();

    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      const details = parsed.error.errors.map(
        (e) => `${e.path.join(".")}: ${e.message}`
      );
      return apiBadRequest("Validation failed", details);
    }

    const { token, password } = parsed.data;

    // Find valid reset token
    const resetRecord = await db.passwordReset.findUnique({
      where: { token },
      include: { user: { select: { id: true, email: true } } },
    });

    if (!resetRecord) {
      return apiNotFound("Reset token");
    }

    if (resetRecord.used) {
      return apiBadRequest("This reset link has already been used");
    }

    if (new Date() > resetRecord.expiresAt) {
      return apiBadRequest("This reset link has expired. Please request a new one.");
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 12);

    // Update password and mark token as used in a transaction
    await db.$transaction([
      db.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash },
      }),
      db.passwordReset.update({
        where: { id: resetRecord.id },
        data: { used: true },
      }),
      // Invalidate all sessions for security
      db.session.deleteMany({
        where: { userId: resetRecord.userId },
      }),
    ]);

    return apiSuccess({
      message: "Password has been reset successfully. Please sign in.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return apiInternalError();
  }
}
