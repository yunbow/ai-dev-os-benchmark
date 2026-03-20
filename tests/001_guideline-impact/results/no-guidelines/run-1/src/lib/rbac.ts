import { TeamRole } from "@prisma/client";

export function canManageTasks(role: TeamRole): boolean {
  return role === "OWNER" || role === "MEMBER";
}

export function canViewTeam(role: TeamRole): boolean {
  return true; // All roles can view
}

export function canInviteMembers(role: TeamRole): boolean {
  return role === "OWNER";
}

export function canManageMembers(role: TeamRole): boolean {
  return role === "OWNER";
}

export function canDeleteTeam(role: TeamRole): boolean {
  return role === "OWNER";
}

export function canUpdateTeam(role: TeamRole): boolean {
  return role === "OWNER";
}

export function canDeleteTask(
  role: TeamRole | null,
  isCreator: boolean
): boolean {
  if (role === "OWNER") return true;
  if (role === "MEMBER" && isCreator) return true;
  return false;
}

export function canEditTask(
  role: TeamRole | null,
  isCreator: boolean
): boolean {
  if (role === "OWNER") return true;
  if (role === "MEMBER" && isCreator) return true;
  return false;
}

export function canChangeTaskStatus(role: TeamRole): boolean {
  return role === "OWNER" || role === "MEMBER";
}

export function getRoleWeight(role: TeamRole): number {
  switch (role) {
    case "OWNER":
      return 3;
    case "MEMBER":
      return 2;
    case "VIEWER":
      return 1;
  }
}

export function canAssignRole(actorRole: TeamRole, targetRole: TeamRole): boolean {
  if (actorRole !== "OWNER") return false;
  return targetRole !== "OWNER"; // Cannot reassign owner role
}
