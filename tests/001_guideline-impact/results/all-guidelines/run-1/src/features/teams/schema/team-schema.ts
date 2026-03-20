import { z } from "zod";

export const createTeamSchema = z.object({
  name: z
    .string()
    .min(1, "Team name is required")
    .max(100, "Team name must be 100 characters or less"),
});

export const inviteMemberSchema = z.object({
  email: z.string().email("Invalid email format"),
  role: z.enum(["MEMBER", "VIEWER"]).default("MEMBER"),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(["MEMBER", "VIEWER"]),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
