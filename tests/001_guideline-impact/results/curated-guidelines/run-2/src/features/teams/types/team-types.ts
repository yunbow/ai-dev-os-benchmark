import { Team, TeamMember, TeamMemberRole, User } from "@prisma/client";

export type TeamMemberWithUser = TeamMember & {
  user: Pick<User, "id" | "name" | "email">;
};

export type TeamWithMembers = Team & {
  members: TeamMemberWithUser[];
};

export const TEAM_ROLE_LABELS: Record<TeamMemberRole, string> = {
  OWNER: "Owner",
  MEMBER: "Member",
  VIEWER: "Viewer",
};
