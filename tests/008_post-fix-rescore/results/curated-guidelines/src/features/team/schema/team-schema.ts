import { z } from "zod";
import { TeamRole } from "@prisma/client";

export const CreateTeamSchema = z.object({
  name: z
    .string()
    .min(1, "Team name is required")
    .max(100, "Team name must be at most 100 characters"),
});

export type CreateTeamInput = z.infer<typeof CreateTeamSchema>;

export const UpdateTeamSchema = CreateTeamSchema.partial();

export type UpdateTeamInput = z.infer<typeof UpdateTeamSchema>;

export const InviteMemberSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  role: z.nativeEnum(TeamRole).default(TeamRole.MEMBER),
});

export type InviteMemberInput = z.infer<typeof InviteMemberSchema>;

export const UpdateMemberRoleSchema = z.object({
  memberId: z.string().cuid(),
  role: z.nativeEnum(TeamRole),
});

export type UpdateMemberRoleInput = z.infer<typeof UpdateMemberRoleSchema>;

export const AcceptInviteSchema = z.object({
  token: z.string().min(1, "Invite token is required"),
});

export type AcceptInviteInput = z.infer<typeof AcceptInviteSchema>;
