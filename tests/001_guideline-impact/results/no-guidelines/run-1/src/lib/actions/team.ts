"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { CreateTeamSchema, InviteMemberSchema, UpdateMemberRoleSchema } from "@/lib/validations/team";
import * as teamService from "@/lib/services/team.service";
import type { ActionResult } from "@/types";

async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function createTeam(formData: FormData): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  const raw = { name: formData.get("name") };
  const parsed = CreateTeamSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  try {
    const team = await teamService.createTeam(parsed.data, userId);
    revalidatePath("/teams");
    return { success: true, data: team };
  } catch {
    return { success: false, error: "Failed to create team" };
  }
}

export async function inviteMember(teamId: string, formData: FormData): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  const raw = {
    email: formData.get("email"),
    role: formData.get("role") || "MEMBER",
  };

  const parsed = InviteMemberSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  try {
    await teamService.inviteMember(teamId, parsed.data, userId);
    revalidatePath(`/teams/${teamId}`);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    if (message === "FORBIDDEN") return { success: false, error: "Only team owners can invite members" };
    if (message === "ALREADY_MEMBER") return { success: false, error: "User is already a team member" };
    return { success: false, error: "Failed to send invitation" };
  }
}

export async function updateMemberRole(
  teamId: string,
  targetUserId: string,
  formData: FormData
): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  const raw = { role: formData.get("role") };
  const parsed = UpdateMemberRoleSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  try {
    await teamService.updateMemberRole(teamId, targetUserId, parsed.data, userId);
    revalidatePath(`/teams/${teamId}`);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    if (message === "FORBIDDEN") return { success: false, error: "Access denied" };
    if (message === "CANNOT_CHANGE_OWNER") return { success: false, error: "Cannot change the owner's role" };
    return { success: false, error: "Failed to update member role" };
  }
}

export async function removeMember(teamId: string, targetUserId: string): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  try {
    await teamService.removeMember(teamId, targetUserId, userId);
    revalidatePath(`/teams/${teamId}`);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    if (message === "FORBIDDEN") return { success: false, error: "Access denied" };
    if (message === "CANNOT_REMOVE_OWNER") return { success: false, error: "Cannot remove the team owner" };
    return { success: false, error: "Failed to remove member" };
  }
}

export async function acceptInvitation(token: string): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  try {
    await teamService.acceptInvitation(token, userId);
    revalidatePath("/teams");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    if (message === "NOT_FOUND") return { success: false, error: "Invitation not found" };
    if (message === "INVITATION_USED") return { success: false, error: "This invitation has already been used" };
    if (message === "INVITATION_EXPIRED") return { success: false, error: "This invitation has expired" };
    if (message === "ALREADY_MEMBER") return { success: false, error: "You are already a member of this team" };
    return { success: false, error: "Failed to accept invitation" };
  }
}
