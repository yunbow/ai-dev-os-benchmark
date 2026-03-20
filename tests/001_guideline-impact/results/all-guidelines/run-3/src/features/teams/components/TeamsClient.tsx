"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Users, Crown, UserMinus, Mail, X } from "lucide-react";
import { listUserTeams, createTeam, deleteTeam, getTeam, inviteMember, removeMember, updateMemberRole } from "../actions";
import type { Team, TeamRole } from "@prisma/client";
import type { TeamWithMembers } from "../actions";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TeamCreateSchema, InviteMemberSchema } from "../schemas";
import type { TeamCreateInput, InviteMemberInput } from "../schemas";

const ROLE_LABELS: Record<TeamRole, string> = {
  OWNER: "Owner",
  MEMBER: "Member",
  VIEWER: "Viewer",
};

interface TeamsClientProps {
  currentUserId: string;
}

export default function TeamsClient({ currentUserId }: TeamsClientProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<TeamWithMembers | null>(null);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);

  const loadTeams = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listUserTeams();
      if (result.success) setTeams(result.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  const loadTeamDetails = async (teamId: string) => {
    setLoadingTeam(true);
    try {
      const result = await getTeam(teamId);
      if (result.success) setSelectedTeam(result.data);
    } finally {
      setLoadingTeam(false);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm("Delete this team? This will also delete all team tasks.")) return;
    setTeams((prev) => prev.filter((t) => t.id !== teamId));
    if (selectedTeam?.id === teamId) setSelectedTeam(null);
    const result = await deleteTeam(teamId);
    if (!result.success) loadTeams();
  };

  const handleRemoveMember = async (teamId: string, userId: string) => {
    if (!confirm("Remove this member from the team?")) return;
    const result = await removeMember(teamId, userId);
    if (result.success) {
      await loadTeamDetails(teamId);
    }
  };

  const handleRoleChange = async (teamId: string, userId: string, role: "MEMBER" | "VIEWER") => {
    const result = await updateMemberRole({ teamId, userId, role });
    if (result.success) {
      await loadTeamDetails(teamId);
    }
  };

  const currentMember = selectedTeam?.members.find((m) => m.userId === currentUserId);
  const isOwner = currentMember?.role === "OWNER";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Team list */}
      <div className="lg:col-span-1 space-y-3">
        <button
          onClick={() => setShowCreateForm(true)}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          New Team
        </button>

        {loading ? (
          <div className="space-y-2" role="status" aria-label="Loading teams" aria-busy="true">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" aria-hidden="true" />
            ))}
          </div>
        ) : teams.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm text-gray-500">No teams yet.</p>
          </div>
        ) : (
          <ul className="space-y-2" role="list" aria-label="Your teams">
            {teams.map((team) => (
              <li key={team.id}>
                <button
                  onClick={() => loadTeamDetails(team.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    selectedTeam?.id === team.id
                      ? "border-blue-300 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                  aria-current={selectedTeam?.id === team.id ? "true" : undefined}
                >
                  <p className="text-sm font-medium text-gray-900">{team.name}</p>
                  {team.description && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{team.description}</p>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Team detail */}
      <div className="lg:col-span-2">
        {loadingTeam ? (
          <div
            className="bg-white rounded-lg border border-gray-200 p-6"
            role="status"
            aria-label="Loading team details"
            aria-busy="true"
          >
            <div className="space-y-3">
              <div className="h-6 bg-gray-100 rounded animate-pulse w-1/2" />
              <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
              <div className="mt-4 space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        ) : selectedTeam ? (
          <div className="bg-white rounded-lg border border-gray-200">
            {/* Team header */}
            <div className="p-5 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{selectedTeam.name}</h2>
                  {selectedTeam.description && (
                    <p className="text-sm text-gray-500 mt-1">{selectedTeam.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {selectedTeam.members.length} member{selectedTeam.members.length !== 1 ? "s" : ""} ·{" "}
                    {selectedTeam._count.tasks} task{selectedTeam._count.tasks !== 1 ? "s" : ""}
                  </p>
                </div>
                {isOwner && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowInviteForm(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                      Invite
                    </button>
                    <button
                      onClick={() => handleDeleteTeam(selectedTeam.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      Delete team
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Members list */}
            <ul className="divide-y divide-gray-100" role="list" aria-label="Team members">
              {selectedTeam.members.map((member) => (
                <li key={member.userId} className="flex items-center gap-3 px-5 py-3">
                  <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                    {(member.user.name ?? member.user.email)[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {member.user.name ?? member.user.email}
                      {member.userId === currentUserId && (
                        <span className="ml-1.5 text-xs text-gray-400">(you)</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{member.user.email}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {member.role === "OWNER" ? (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                        <Crown className="h-3 w-3" aria-hidden="true" />
                        Owner
                      </span>
                    ) : isOwner ? (
                      <select
                        value={member.role}
                        onChange={(e) =>
                          handleRoleChange(selectedTeam.id, member.userId, e.target.value as "MEMBER" | "VIEWER")
                        }
                        className="text-xs border border-gray-300 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        aria-label={`Role for ${member.user.name ?? member.user.email}`}
                      >
                        <option value="MEMBER">Member</option>
                        <option value="VIEWER">Viewer</option>
                      </select>
                    ) : (
                      <span className="text-xs text-gray-500">{ROLE_LABELS[member.role]}</span>
                    )}

                    {isOwner && member.role !== "OWNER" && (
                      <button
                        onClick={() => handleRemoveMember(selectedTeam.id, member.userId)}
                        className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                        aria-label={`Remove ${member.user.name ?? member.user.email}`}
                      >
                        <UserMinus className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}

                    {/* Allow self to leave if not owner */}
                    {!isOwner && member.userId === currentUserId && (
                      <button
                        onClick={() => handleRemoveMember(selectedTeam.id, currentUserId)}
                        className="text-xs text-red-600 hover:underline focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                      >
                        Leave
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 flex items-center justify-center h-48">
            <p className="text-sm text-gray-400">Select a team to view details</p>
          </div>
        )}
      </div>

      {/* Create team modal */}
      {showCreateForm && (
        <CreateTeamModal
          onSuccess={async (team) => {
            setShowCreateForm(false);
            await loadTeams();
            await loadTeamDetails(team.id);
          }}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Invite member modal */}
      {showInviteForm && selectedTeam && (
        <InviteMemberModal
          teamId={selectedTeam.id}
          onSuccess={() => {
            setShowInviteForm(false);
          }}
          onCancel={() => setShowInviteForm(false)}
        />
      )}
    </div>
  );
}

function CreateTeamModal({
  onSuccess,
  onCancel,
}: {
  onSuccess: (team: Team) => void;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TeamCreateInput>({
    resolver: zodResolver(TeamCreateSchema),
    defaultValues: { name: "", description: "" },
  });

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  const onSubmit = async (data: TeamCreateInput) => {
    const result = await createTeam(data);
    if (result.success) {
      onSuccess(result.data);
    } else {
      setError("root", { message: result.error.message });
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onCancel} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Create team"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="w-full max-w-md bg-white rounded-lg shadow-xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-900">New Team</h2>
            <button onClick={onCancel} className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Close">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="px-5 py-4 space-y-4">
              {errors.root && (
                <div role="alert" className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                  {errors.root.message}
                </div>
              )}
              <div>
                <label htmlFor="team-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Team name <span aria-hidden="true" className="text-red-500">*</span>
                </label>
                <input
                  id="team-name"
                  type="text"
                  {...register("name")}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  aria-required="true"
                  aria-invalid={!!errors.name}
                  autoFocus
                />
                {errors.name && <p role="alert" className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
              </div>
              <div>
                <label htmlFor="team-desc" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="team-desc"
                  {...register("description")}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-200">
              <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50">
                {isSubmitting ? "Creating..." : "Create team"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

function InviteMemberModal({
  teamId,
  onSuccess,
  onCancel,
}: {
  teamId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<InviteMemberInput>({
    resolver: zodResolver(InviteMemberSchema) as any,
    defaultValues: { teamId, email: "", role: "MEMBER" },
  });

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = async (data: any) => {
    const result = await inviteMember(data as InviteMemberInput);
    if (result.success) {
      onSuccess();
    } else {
      setError("root", { message: result.error.message });
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onCancel} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Invite team member"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="w-full max-w-md bg-white rounded-lg shadow-xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-900">Invite Member</h2>
            <button onClick={onCancel} className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Close">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="px-5 py-4 space-y-4">
              {errors.root && (
                <div role="alert" className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                  {errors.root.message}
                </div>
              )}
              <input type="hidden" {...register("teamId")} />
              <div>
                <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email address <span aria-hidden="true" className="text-red-500">*</span>
                </label>
                <input
                  id="invite-email"
                  type="email"
                  {...register("email")}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  aria-required="true"
                  aria-invalid={!!errors.email}
                  autoFocus
                />
                {errors.email && <p role="alert" className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
              </div>
              <div>
                <label htmlFor="invite-role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  id="invite-role"
                  {...register("role")}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="MEMBER">Member — can create and edit tasks</option>
                  <option value="VIEWER">Viewer — read-only access</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-200">
              <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50">
                {isSubmitting ? "Sending..." : "Send invitation"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
