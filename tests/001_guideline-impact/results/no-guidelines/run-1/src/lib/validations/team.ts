import { z } from "zod";
import { TeamRole } from "@prisma/client";

export const CreateTeamSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be 100 characters or less"),
});

export const UpdateTeamSchema = CreateTeamSchema.partial();

export const InviteMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.nativeEnum(TeamRole).default("MEMBER"),
});

export const UpdateMemberRoleSchema = z.object({
  role: z.nativeEnum(TeamRole),
});

export type CreateTeamInput = z.infer<typeof CreateTeamSchema>;
export type UpdateTeamInput = z.infer<typeof UpdateTeamSchema>;
export type InviteMemberInput = z.infer<typeof InviteMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof UpdateMemberRoleSchema>;
