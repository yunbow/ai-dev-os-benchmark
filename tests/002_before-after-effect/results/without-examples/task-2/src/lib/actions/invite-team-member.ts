// src/lib/actions/invite-team-member.ts
"use server";

import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/actions/auth-helpers";
import { sendTeamInvitationEmail } from "@/lib/email";

// Validate all inputs (Security §1 — Zod required for all input data)
const InviteSchema = z.object({
  teamId: z.string().cuid(),
  email: z.string().email().max(254),
});

export type InviteTeamMemberResult =
  | { success: true }
  | { success: false; error: string };

export async function inviteTeamMember(
  input: unknown
): Promise<InviteTeamMemberResult> {
  // 1. Authenticate caller
  const authResult = await requireAuth();
  if (!authResult.success) {
    return { success: false, error: "Unauthorized" };
  }

  // 2. Validate input
  const parsed = InviteSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }
  const { teamId, email } = parsed.data;

  // 3. Authorization: verify the caller is a member of the team (IDOR prevention — Security §3.1)
  const membership = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId: authResult.user.id,
      },
    },
    include: { team: true },
  });

  if (!membership) {
    return { success: false, error: "Forbidden" };
  }

  // 4. Prevent duplicate pending invitations
  const existing = await prisma.teamInvitation.findFirst({
    where: {
      teamId,
      email,
      expiresAt: { gt: new Date() },
      acceptedAt: null,
    },
  });

  if (existing) {
    return { success: false, error: "An active invitation already exists for this email" };
  }

  // 5. Create invitation — cryptographically random token
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await prisma.teamInvitation.create({
    data: {
      teamId,
      invitedById: authResult.user.id,
      email,
      token,
      expiresAt,
    },
  });

  // 6. Send invitation email — fail-safe: do not block the action on email errors
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://example.com";
  const acceptUrl = `${appUrl}/invitations/accept?token=${token}`;

  try {
    await sendTeamInvitationEmail({
      to: email,
      teamName: membership.team.name,
      inviterName: authResult.user.name ?? authResult.user.email,
      acceptUrl,
    });
  } catch (err) {
    // Log but do not surface internal details to the caller (Security §3.7)
    console.error("[inviteTeamMember] Failed to send invitation email", err);
    // Invitation record is already created; the user can resend later
  }

  return { success: true };
}
