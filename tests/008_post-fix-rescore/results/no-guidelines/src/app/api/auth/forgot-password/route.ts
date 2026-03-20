import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { generateSecureToken } from "@/lib/utils";
import { sendEmail, getPasswordResetEmailHtml } from "@/lib/email";
import {
  apiSuccess,
  apiBadRequest,
  apiInternalError,
} from "@/lib/api-response";
import {
  authRateLimiter,
  getIdentifier,
  rateLimitResponse,
} from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // Rate limiting
  const identifier = getIdentifier(request, "forgot-password");
  const rateLimitResult = authRateLimiter.check(identifier);
  if (!rateLimitResult.success) {
    return rateLimitResponse(rateLimitResult.resetTime);
  }

  try {
    const body = await request.json();

    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return apiBadRequest("Invalid email address");
    }

    const { email } = parsed.data;

    // Always return success to prevent email enumeration
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true },
    });

    if (user) {
      // Invalidate existing reset tokens
      await db.passwordReset.updateMany({
        where: { userId: user.id, used: false },
        data: { used: true },
      });

      const token = generateSecureToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await db.passwordReset.create({
        data: {
          userId: user.id,
          token,
          expiresAt,
        },
      });

      const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

      // Send email (don't await to prevent timing attacks)
      sendEmail({
        to: user.email,
        subject: "Reset your TaskFlow password",
        html: getPasswordResetEmailHtml(resetUrl),
      }).catch((err) => console.error("Failed to send reset email:", err));
    }

    // Always return the same response
    return apiSuccess({
      message:
        "If an account with that email exists, a reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return apiInternalError();
  }
}
