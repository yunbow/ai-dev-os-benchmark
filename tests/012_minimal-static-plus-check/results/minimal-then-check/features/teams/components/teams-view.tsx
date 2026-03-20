"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import type { Team, TeamMember, User } from "@prisma/client";
import { TeamRole } from "@prisma/client";
import { createTeamSchema, inviteMemberSchema, type CreateTeamInput } from "@/features/teams/schema";
import {
  createTeamAction,
  inviteMemberAction,
  deleteTeamAction,
  removeMemberAction,
} from "@/features/teams/server/actions";

type InviteMemberFormValues = z.input<typeof inviteMemberSchema>;

type TeamWithMembers = Team & {
  members: (TeamMember & { user: Pick<User, "id" | "name" | "email"> })[];
};

const roleLabels: Record<TeamRole, string> = {
  OWNER: "Owner",
  MEMBER: "Member",
  VIEWER: "Viewer",
};

export function TeamsView({
  initialTeams,
  currentUserId,
}: {
  initialTeams: TeamWithMembers[];
  currentUserId: string;
}) {
  const [teams, setTeams] = useState(initialTeams);
  const [isCreateFormVisible, setIsCreateFormVisible] = useState(false);
  const [inviteTeamId, setInviteTeamId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const createForm = useForm<CreateTeamInput>({
    resolver: zodResolver(createTeamSchema),
  });

  const inviteForm = useForm<InviteMemberFormValues>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: { role: "MEMBER" },
  });

  async function onCreateTeam(data: CreateTeamInput) {
    const result = await createTeamAction(data);
    if (result.success) {
      toast.success("Team created");
      setIsCreateFormVisible(false);
      createForm.reset();
      window.location.reload();
    } else {
      toast.error(result.error);
    }
  }

  async function onInviteMember(data: InviteMemberFormValues) {
    if (!inviteTeamId) return;
    const result = await inviteMemberAction(inviteTeamId, data);
    if (result.success) {
      toast.success("Invitation sent");
      setInviteTeamId(null);
      inviteForm.reset();
    } else {
      toast.error(result.error);
    }
  }

  function handleTeamDelete(teamId: string) {
    startTransition(async () => {
      const result = await deleteTeamAction(teamId);
      if (result.success) {
        setTeams((prev) => prev.filter((t) => t.id !== teamId));
        toast.success("Team deleted");
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleMemberRemove(teamId: string, memberId: string) {
    startTransition(async () => {
      const result = await removeMemberAction(teamId, memberId);
      if (result.success) {
        setTeams((prev) =>
          prev.map((t) =>
            t.id === teamId
              ? { ...t, members: t.members.filter((m) => m.userId !== memberId) }
              : t
          )
        );
        toast.success("Member removed");
      } else {
        toast.error(result.error);
      }
    });
  }

  const inviteTeam = inviteTeamId ? teams.find((t) => t.id === inviteTeamId) : null;

  return (
    <div className="space-y-4">
      <button
        onClick={() => setIsCreateFormVisible(!isCreateFormVisible)}
        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {isCreateFormVisible ? "Cancel" : "New Team"}
      </button>

      {isCreateFormVisible && (
        <form
          onSubmit={createForm.handleSubmit(onCreateTeam)}
          className="bg-white border border-gray-200 rounded-lg p-4 space-y-3"
          aria-label="Create team form"
        >
          <h3 className="font-medium text-gray-900">Create Team</h3>
          <div>
            <label htmlFor="team-name" className="block text-sm font-medium text-gray-700">
              Team Name
            </label>
            <input
              id="team-name"
              type="text"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...createForm.register("name")}
            />
            {createForm.formState.errors.name && (
              <p className="mt-1 text-xs text-red-600" role="alert">
                {createForm.formState.errors.name.message}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="team-desc" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="team-desc"
              rows={2}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...createForm.register("description")}
            />
          </div>
          <button
            type="submit"
            disabled={createForm.formState.isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {createForm.formState.isSubmitting ? "Creating..." : "Create Team"}
          </button>
        </form>
      )}

      {teams.length === 0 ? (
        <div className="text-center py-12 text-gray-500" role="status">
          No teams yet. Create one to collaborate with others.
        </div>
      ) : (
        <div className="space-y-4">
          {teams.map((team) => {
            const myMembership = team.members.find((m) => m.userId === currentUserId);
            const isOwner = myMembership?.role === TeamRole.OWNER;

            return (
              <section
                key={team.id}
                className="bg-white border border-gray-200 rounded-lg p-4"
                aria-labelledby={`team-${team.id}-name`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 id={`team-${team.id}-name`} className="font-semibold text-gray-900">
                      {team.name}
                    </h3>
                    {team.description && (
                      <p className="text-sm text-gray-600">{team.description}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {team.members.length} member{team.members.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  {isOwner && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setInviteTeamId(team.id)}
                        className="text-sm text-blue-600 hover:underline focus:outline-none focus:underline"
                        aria-label={`Invite member to ${team.name}`}
                      >
                        Invite
                      </button>
                      <button
                        onClick={() => handleTeamDelete(team.id)}
                        disabled={isPending}
                        className="text-sm text-red-600 hover:underline focus:outline-none focus:underline"
                        aria-label={`Delete ${team.name}`}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                <ul className="space-y-1" aria-label={`Members of ${team.name}`}>
                  {team.members.map((member) => (
                    <li key={member.id} className="flex items-center justify-between text-sm">
                      <div>
                        <span className="text-gray-900">
                          {member.user.name ?? member.user.email}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          {roleLabels[member.role]}
                        </span>
                      </div>
                      {isOwner && member.userId !== currentUserId && (
                        <button
                          onClick={() => handleMemberRemove(team.id, member.userId)}
                          disabled={isPending}
                          className="text-xs text-red-500 hover:text-red-700 focus:outline-none focus:underline"
                          aria-label={`Remove ${member.user.name ?? member.user.email} from ${team.name}`}
                        >
                          Remove
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      {inviteTeam && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="invite-dialog-title"
        >
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h3 id="invite-dialog-title" className="text-lg font-semibold mb-4">
              Invite to {inviteTeam.name}
            </h3>
            <form onSubmit={inviteForm.handleSubmit(onInviteMember)} className="space-y-3">
              <div>
                <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="invite-email"
                  type="email"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...inviteForm.register("email")}
                />
              </div>
              <div>
                <label htmlFor="invite-role" className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  id="invite-role"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...inviteForm.register("role")}
                >
                  <option value="MEMBER">Member</option>
                  <option value="VIEWER">Viewer</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setInviteTeamId(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteForm.formState.isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {inviteForm.formState.isSubmitting ? "Sending..." : "Send Invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
