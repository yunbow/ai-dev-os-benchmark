// Zod schemas co-located with team Server Actions
export {
  createTeamSchema,
  updateTeamSchema,
  inviteMemberSchema,
  acceptInviteSchema,
  updateMemberRoleSchema,
  type CreateTeamInput,
  type UpdateTeamInput,
  type InviteMemberInput,
  type AcceptInviteInput,
} from "@/lib/validations/team";
