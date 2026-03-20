import { z } from "zod";
import { TeamRole } from "@prisma/client";

export const createTeamSchema = z.object({
  name: z.string().min(1, "Team name is required").max(100, "Team name must be at most 100 characters"),
});

export const updateTeamSchema = createTeamSchema.partial();

export const inviteMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum([TeamRole.MEMBER, TeamRole.VIEWER]).default(TeamRole.MEMBER),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum([TeamRole.MEMBER, TeamRole.VIEWER, TeamRole.OWNER]),
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
