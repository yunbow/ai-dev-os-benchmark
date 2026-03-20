import { z } from "zod";
import { TeamRole } from "@prisma/client";

export const TeamCreateSchema = z.object({
  name: z.string().min(1, "Team name is required").max(100, "Team name too long"),
  description: z.string().max(500, "Description too long").optional(),
});

export type TeamCreateInput = z.infer<typeof TeamCreateSchema>;

export const TeamUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
});

export type TeamUpdateInput = z.infer<typeof TeamUpdateSchema>;

export const InviteMemberSchema = z.object({
  teamId: z.string().cuid(),
  email: z.string().email("Invalid email address"),
  role: z.nativeEnum(TeamRole).default("MEMBER").refine(
    (role) => role !== "OWNER",
    "Cannot invite someone as team owner"
  ),
});

export type InviteMemberInput = z.infer<typeof InviteMemberSchema>;

export const UpdateMemberRoleSchema = z.object({
  teamId: z.string().cuid(),
  userId: z.string().cuid(),
  role: z.nativeEnum(TeamRole).refine(
    (role) => role !== "OWNER",
    "Cannot assign owner role via this action"
  ),
});

export type UpdateMemberRoleInput = z.infer<typeof UpdateMemberRoleSchema>;

export const AcceptInvitationSchema = z.object({
  token: z.string().min(1, "Invitation token is required"),
});

export type AcceptInvitationInput = z.infer<typeof AcceptInvitationSchema>;
