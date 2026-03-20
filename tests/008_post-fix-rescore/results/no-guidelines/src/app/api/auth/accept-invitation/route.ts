import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import {
  apiSuccess,
  apiBadRequest,
  apiUnauthorized,
  apiNotFound,
  apiError,
  apiInternalError,
} from "@/lib/api-response";
import {
  writeRateLimiter,
  getIdentifier,
  rateLimitResponse,
} from "@/lib/rate-limit";

const acceptInvitationSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export async function POST(request: NextRequest) {
  const identifier = getIdentifier(request, "accept-invitation");
  const rateLimitResult = writeRateLimiter.check(identifier);
  if (!rateLimitResult.success) return rateLimitResponse(rateLimitResult.resetTime);

  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  try {
    const body = await request.json();
    const parsed = acceptInvitationSchema.safeParse(body);
    if (!parsed.success) return apiBadRequest("Invalid token");

    const { token } = parsed.data;

    const invitation = await db.teamInvitation.findUnique({
      where: { token },
    });

    if (!invitation) return apiNotFound("Invitation");
    if (invitation.used) return apiBadRequest("Invitation has already been used");
    if (new Date() > invitation.expiresAt) return apiBadRequest("Invitation has expired");

    // Check if already a member
    const existingMember = await db.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: invitation.teamId,
          userId: session.user.id,
        },
      },
    });

    if (existingMember) {
      return apiError("ALREADY_MEMBER", "You are already a member of this team", 409);
    }

    // Add member and mark invitation as used in a transaction
    await db.$transaction([
      db.teamMember.create({
        data: {
          teamId: invitation.teamId,
          userId: session.user.id,
          role: invitation.role,
        },
      }),
      db.teamInvitation.update({
        where: { id: invitation.id },
        data: { used: true },
      }),
    ]);

    return apiSuccess({
      message: "Invitation accepted successfully",
      teamId: invitation.teamId,
    });
  } catch (error) {
    console.error("Accept invitation error:", error);
    return apiInternalError();
  }
}
