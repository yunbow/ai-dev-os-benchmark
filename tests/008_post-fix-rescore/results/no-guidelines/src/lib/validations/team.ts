import { z } from "zod";
import { TeamRole } from "@prisma/client";

export const teamRoleSchema = z.nativeEnum(TeamRole);

export const createTeamSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional()
    .nullable(),
});

export const updateTeamSchema = createTeamSchema.partial();

export const inviteMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: teamRoleSchema.exclude(["OWNER"]).default(TeamRole.MEMBER),
});

export const updateMemberRoleSchema = z.object({
  role: teamRoleSchema.exclude(["OWNER"]),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
