// src/lib/actions/invite.ts
"use server";

import crypto from "crypto";
import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendTeamInvitationEmail } from "@/lib/email";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const InviteSchema = z.object({
  email: z.string().email(),
  teamId: z.string().cuid(),
});

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function inviteTeamMember(
  formData: FormData,
): Promise<ActionResult> {
  // Rate limiting: 10 invitations per minute per IP (auth preset)
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") ?? "unknown";
  const { success: rateLimitOk } = await checkRateLimit(
    `invite:${ip}`,
    { maxRequests: 10, windowMs: 60_000 },
  );
  if (!rateLimitOk) {
    return { success: false, error: "Too many requests. Please try again later." };
  }

  // Authentication check
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  // Input validation
  const parsed = InviteSchema.safeParse({
    email: formData.get("email"),
    teamId: formData.get("teamId"),
  });
  if (!parsed.success) {
    return { success: false, error: "Invalid input." };
  }

  const { email, teamId } = parsed.data;

  // Authorization: verify caller is a member of the team (IDOR prevention)
  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: session.user.id } },
    include: { team: true },
  });

  if (!membership) {
    return { success: false, error: "Forbidden" };
  }

  // Check for existing pending invitation for this email + team
  const existing = await prisma.teamInvitation.findFirst({
    where: {
      email,
      teamId,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (existing) {
    return { success: false, error: "An active invitation already exists for this email." };
  }

  // Generate a cryptographically secure token (256-bit)
  const token = crypto.randomBytes(32).toString("hex");

  const invitation = await prisma.teamInvitation.create({
    data: {
      email,
      teamId,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      invitedById: session.user.id,
    },
  });

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invitations/accept?token=${invitation.token}`;

  // Send email — non-blocking: do not let email failure block the response
  sendTeamInvitationEmail(
    email,
    membership.team.name,
    session.user.name ?? session.user.email ?? "A team member",
    inviteUrl,
  ).catch((err) => {
    console.error("[inviteTeamMember] Failed to send invitation email", err);
  });

  return { success: true, data: undefined };
}
