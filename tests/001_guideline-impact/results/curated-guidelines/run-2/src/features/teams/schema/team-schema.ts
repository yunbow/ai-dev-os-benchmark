import { z } from "zod";
import { TeamMemberRole } from "@prisma/client";

export const CreateTeamSchema = z.object({
  name: z.string().min(2, "Team name must be at least 2 characters").max(100, "Team name too long"),
});

export const UpdateTeamSchema = z.object({
  name: z.string().min(2, "Team name must be at least 2 characters").max(100, "Team name too long").optional(),
});

export const InviteMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.nativeEnum(TeamMemberRole).default("MEMBER"),
});

export const UpdateMemberRoleSchema = z.object({
  role: z.nativeEnum(TeamMemberRole),
});

export type CreateTeamInput = z.infer<typeof CreateTeamSchema>;
export type UpdateTeamInput = z.infer<typeof UpdateTeamSchema>;
export type InviteMemberInput = z.infer<typeof InviteMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof UpdateMemberRoleSchema>;
