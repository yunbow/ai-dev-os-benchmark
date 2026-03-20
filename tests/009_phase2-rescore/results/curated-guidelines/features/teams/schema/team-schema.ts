import { z } from "zod";
import { TeamRole } from "@prisma/client";

export const createTeamSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email("Invalid email format"),
  role: z.nativeEnum(TeamRole).default("MEMBER"),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
