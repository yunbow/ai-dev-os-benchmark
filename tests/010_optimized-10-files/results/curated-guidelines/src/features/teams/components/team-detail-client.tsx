"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { TeamWithMembers } from "../types/team-types";
import { inviteMember, removeMember, updateMemberRole } from "../server/team-actions";
import { TeamRole } from "@prisma/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

interface TeamDetailClientProps {
  team: TeamWithMembers;
}

const InviteSchema = z.object({
  email: z.string().email("Invalid email"),
  role: z.nativeEnum(TeamRole).default(TeamRole.MEMBER),
});
type InviteInput = z.infer<typeof InviteSchema>;

const ROLE_LABELS: Record<TeamRole, string> = {
  OWNER: "Owner",
  MEMBER: "Member",
  VIEWER: "Viewer",
};

export function TeamDetailClient({ team: initialTeam }: TeamDetailClientProps) {
  const [team, setTeam] = useState(initialTeam);
  const form = useForm<InviteInput>({
    resolver: zodResolver(InviteSchema),
    defaultValues: { email: "", role: TeamRole.MEMBER },
  });

  const handleInvite = async (data: InviteInput) => {
    const result = await inviteMember({ teamId: team.id, ...data });
    if (!result.success) {
      toast.error(result.error.message);
      return;
    }
    form.reset();
    toast.success(`Invitation sent to ${data.email}`);
  };

  const handleRemoveMember = async (userId: string, userName: string) => {
    const result = await removeMember({ teamId: team.id, userId });
    if (!result.success) {
      toast.error(result.error.message);
      return;
    }
    setTeam((prev) => ({
      ...prev,
      members: prev.members.filter((m) => m.userId !== userId),
      _count: { members: prev._count.members - 1 },
    }));
    toast.success(`${userName} removed from team`);
  };

  const handleRoleChange = async (userId: string, role: TeamRole) => {
    const result = await updateMemberRole({ teamId: team.id, userId, role });
    if (!result.success) {
      toast.error(result.error.message);
      return;
    }
    setTeam((prev) => ({
      ...prev,
      members: prev.members.map((m) => (m.userId === userId ? { ...m, role } : m)),
    }));
    toast.success("Role updated");
  };

  const currentUserMembership = team.members[0]; // Comes from server with current user's data
  const isOwner = currentUserMembership?.role === TeamRole.OWNER;

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">{team.name}</h1>

      {isOwner && (
        <section className="mb-8" aria-labelledby="invite-section-heading">
          <h2 id="invite-section-heading" className="text-lg font-semibold text-gray-900 mb-4">
            Invite Member
          </h2>
          <form onSubmit={form.handleSubmit(handleInvite)} className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <input
                type="email"
                placeholder="Email address"
                {...form.register("email")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Invitee email address"
              />
              {form.formState.errors.email && (
                <p className="mt-1 text-xs text-red-600" role="alert">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            <select
              {...form.register("role")}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Member role"
            >
              <option value={TeamRole.MEMBER}>Member</option>
              <option value={TeamRole.VIEWER}>Viewer</option>
            </select>
            <button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {form.formState.isSubmitting ? "Sending..." : "Send Invite"}
            </button>
          </form>
        </section>
      )}

      <section aria-labelledby="members-section-heading">
        <h2 id="members-section-heading" className="text-lg font-semibold text-gray-900 mb-4">
          Members ({team._count.members})
        </h2>
        <ul className="space-y-3" role="list">
          {team.members.map((member) => (
            <li
              key={member.id}
              className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {member.user.name ?? member.user.email}
                </p>
                <p className="text-xs text-gray-500">{member.user.email}</p>
              </div>
              <div className="flex items-center gap-3">
                {isOwner && member.role !== TeamRole.OWNER ? (
                  <>
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.userId, e.target.value as TeamRole)}
                      className="text-sm border border-gray-200 rounded px-2 py-1"
                      aria-label={`Role for ${member.user.name ?? member.user.email}`}
                    >
                      <option value={TeamRole.MEMBER}>Member</option>
                      <option value={TeamRole.VIEWER}>Viewer</option>
                    </select>
                    <button
                      onClick={() => handleRemoveMember(member.userId, member.user.name ?? member.user.email ?? "member")}
                      aria-label={`Remove ${member.user.name ?? member.user.email} from team`}
                      className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                    {ROLE_LABELS[member.role]}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
