import { z } from "zod";
import { TeamRole } from "@prisma/client";

export const TeamSchema = z.object({
  name: z
    .string()
    .min(1, "Team name is required")
    .max(100, "Team name must be at most 100 characters")
    .trim(),
});

export const InviteSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .toLowerCase(),
  role: z.enum([TeamRole.MEMBER, TeamRole.VIEWER], {
    errorMap: () => ({ message: "Role must be MEMBER or VIEWER" }),
  }),
});

export const UpdateMemberRoleSchema = z.object({
  role: z.nativeEnum(TeamRole),
});

export type TeamInput = z.infer<typeof TeamSchema>;
export type InviteInput = z.infer<typeof InviteSchema>;
export type UpdateMemberRoleInput = z.infer<typeof UpdateMemberRoleSchema>;
