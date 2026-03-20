// src/lib/actions/invite-team-member.ts
"use server";

import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/actions/auth-helpers";
import { sendInvitationEmail } from "@/lib/email/send-invitation-email";
import { logger } from "@/lib/logger";

// SEC-03: Zod validation for all input data
const InviteTeamMemberSchema = z.object({
  teamId: z.string().cuid(),
  inviteeEmail: z.string().email().max(254),
});

export type InviteTeamMemberInput = z.infer<typeof InviteTeamMemberSchema>;

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

const INVITATION_EXPIRY_DAYS = 7;
const TOKEN_BYTES = 32; // 256-bit token

export async function inviteTeamMember(
  input: InviteTeamMemberInput
): Promise<ActionResult<{ invitationId: string }>> {
  // SEC-03: Validate all inputs with Zod
  const parsed = InviteTeamMemberSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }
  const { teamId, inviteeEmail } = parsed.data;

  // Require authenticated session
  const authResult = await requireAuth();
  if (!authResult.success) {
    return { success: false, error: "Unauthorized" };
  }
  const { user: inviter } = authResult;

  // SEC-09: IDOR prevention — verify the inviter is a member (owner/admin) of the team
  const membership = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: { teamId, userId: inviter.id },
    },
    select: { role: true },
  });

  if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
    logger.warn(
      { userId: inviter.id, teamId },
      "IDOR attempt: user tried to invite to a team they do not administrate"
    );
    return { success: false, error: "Forbidden" };
  }

  // Generate a cryptographically secure token (SEC-04: no secrets in code)
  const token = randomBytes(TOKEN_BYTES).toString("hex");

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

  // Persist the invitation
  let invitation: { id: string };
  try {
    invitation = await prisma.teamInvitation.create({
      data: {
        teamId,
        inviterId: inviter.id,
        inviteeEmail,
        token,
        expiresAt,
        status: "PENDING",
      },
      select: { id: true },
    });
  } catch (err) {
    // SEC-17: Never expose stack traces
    logger.error({ err, teamId, inviteeEmail }, "Failed to create team invitation");
    return { success: false, error: "Failed to create invitation" };
  }

  // Send the HTML invitation email
  try {
    await sendInvitationEmail({
      to: inviteeEmail,
      inviterDisplayName: inviter.name ?? inviter.email,
      invitationToken: token,
    });
  } catch (err) {
    // SEC-17: Log but do not surface internal details
    logger.error({ err, invitationId: invitation.id }, "Failed to send invitation email");
    // Invitation is created; caller can retry sending separately
  }

  return { success: true, data: { invitationId: invitation.id } };
}
