import { z } from "zod";
import { TeamRole } from "@prisma/client";

export const CreateTeamSchema = z.object({
  name: z.string().min(1, "Team name is required").max(100),
});

export const UpdateTeamSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(100),
});

export const InviteMemberSchema = z.object({
  teamId: z.string().cuid(),
  email: z.string().email("Invalid email address"),
  role: z.nativeEnum(TeamRole).default("MEMBER"),
});

export const UpdateMemberRoleSchema = z.object({
  teamId: z.string().cuid(),
  userId: z.string().cuid(),
  role: z.nativeEnum(TeamRole),
});

export type CreateTeamInput = z.infer<typeof CreateTeamSchema>;
export type InviteMemberInput = z.infer<typeof InviteMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof UpdateMemberRoleSchema>;
