import { z } from "zod";
import { TeamRole } from "@prisma/client";

export const CreateTeamSchema = z.object({
  name: z.string().min(1, "Team name is required").max(100, "Name must be 100 characters or fewer"),
});

export const InviteMemberSchema = z.object({
  teamId: z.string().cuid(),
  email: z.string().email("Invalid email format"),
  role: z.nativeEnum(TeamRole).default(TeamRole.MEMBER),
});

export const AcceptInvitationSchema = z.object({
  token: z.string().min(1, "Invitation token is required"),
});

export const UpdateMemberRoleSchema = z.object({
  teamId: z.string().cuid(),
  userId: z.string().cuid(),
  role: z.nativeEnum(TeamRole),
});

export const RemoveMemberSchema = z.object({
  teamId: z.string().cuid(),
  userId: z.string().cuid(),
});

export const DeleteTeamSchema = z.object({
  teamId: z.string().cuid(),
});

export type CreateTeamInput = z.infer<typeof CreateTeamSchema>;
export type InviteMemberInput = z.infer<typeof InviteMemberSchema>;
export type AcceptInvitationInput = z.infer<typeof AcceptInvitationSchema>;
export type UpdateMemberRoleInput = z.infer<typeof UpdateMemberRoleSchema>;
export type RemoveMemberInput = z.infer<typeof RemoveMemberSchema>;
export type DeleteTeamInput = z.infer<typeof DeleteTeamSchema>;
