import type { Team, TeamMember, User, TeamInvitation } from "@prisma/client";

export type TeamWithMembers = Team & {
  members: (TeamMember & {
    user: Pick<User, "id" | "name" | "email" | "image">;
  })[];
  _count: { members: number };
};

export type TeamInvitationWithTeam = TeamInvitation & {
  team: Pick<Team, "id" | "name">;
  inviter: Pick<User, "id" | "name" | "email">;
};
