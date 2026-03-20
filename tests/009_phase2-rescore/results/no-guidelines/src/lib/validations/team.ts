import { z } from "zod";
import { TeamRole } from "@prisma/client";

export const createTeamSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be at most 100 characters"),
  description: z.string().max(500).optional(),
});

export const updateTeamSchema = createTeamSchema.partial();

export const inviteMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.nativeEnum(TeamRole).default(TeamRole.MEMBER),
});

export const updateMemberRoleSchema = z.object({
  role: z.nativeEnum(TeamRole),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
