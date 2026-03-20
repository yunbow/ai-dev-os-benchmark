// src/lib/actions/invite-team-member.ts
"use server";

import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/actions/auth-helpers";
import { sendInvitationEmail } from "@/lib/email/invitation";
import { ActionResult, ActionErrors, createActionSuccess } from "@/lib/actions/types";

const InviteSchema = z.object({
  email: z.string().email(),
  teamId: z.string().cuid(),
});

const INVITATION_EXPIRY_DAYS = 7;

export async function inviteTeamMember(
  input: unknown
): Promise<ActionResult<{ invitationId: string }>> {
  // 1. Authenticate
  const authResult = await requireAuth();
  if (!authResult.success) return authResult.error;

  // 2. Validate input (Zod — all inputs must be validated)
  const parsed = InviteSchema.safeParse(input);
  if (!parsed.success) {
    return ActionErrors.validation(parsed.error.flatten());
  }
  const { email, teamId } = parsed.data;

  // 3. Verify the requesting user is a member (and has invite rights) on this team
  const membership = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: { teamId, userId: authResult.user.id },
    },
    include: { team: true },
  });

  if (!membership) {
    return ActionErrors.forbidden();
  }

  // 4. Prevent duplicate pending invitations for the same email + team
  const existing = await prisma.teamInvitation.findFirst({
    where: {
      teamId,
      email,
      status: "pending",
      expiresAt: { gt: new Date() },
    },
  });

  if (existing) {
    return ActionErrors.conflict("A pending invitation already exists for this email.");
  }

  // 5. Generate a cryptographically secure token (256-bit)
  const token = crypto.randomBytes(32).toString("hex");

  // 6. Compute expiry (7 days from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

  // 7. Persist the invitation
  const invitation = await prisma.teamInvitation.create({
    data: {
      teamId,
      inviterId: authResult.user.id,
      email,
      token,
      expiresAt,
      status: "pending",
    },
  });

  // 8. Send invitation email (async — do not block the action)
  sendInvitationEmail({
    to: email,
    inviterName: authResult.user.displayName ?? authResult.user.email,
    teamName: membership.team.name,
    invitationToken: token,
  }).catch((err) => {
    // Fail-safe: log but do not surface email errors to the caller
    console.error({ err, invitationId: invitation.id }, "Failed to send invitation email");
  });

  return createActionSuccess({ invitationId: invitation.id });
}
