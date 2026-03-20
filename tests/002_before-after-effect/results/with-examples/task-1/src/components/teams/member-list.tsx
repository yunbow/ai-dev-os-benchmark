"use client";

import { removeTeamMember } from "@/lib/actions/teams";
import type { TeamMember } from "@prisma/client";

interface Member extends TeamMember {
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface MemberListProps {
  members: Member[];
  ownerId: string;
  teamId: string;
  currentUserId: string;
  isOwner: boolean;
}

export function MemberList({
  members,
  ownerId,
  teamId,
  currentUserId,
  isOwner,
}: MemberListProps) {
  async function handleRemove(userId: string) {
    if (!confirm("Remove this member from the team?")) return;
    await removeTeamMember(teamId, userId);
  }

  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold text-gray-700">Members</h2>
      <ul className="space-y-2">
        {/* Owner */}
        <OwnerRow ownerId={ownerId} />

        {/* Members */}
        {members.map((member) => (
          <li
            key={member.id}
            className="flex items-center justify-between rounded border p-3 text-sm"
          >
            <div>
              <span className="font-medium text-gray-800">{member.user.name}</span>
              <span className="ml-2 text-xs text-gray-400">{member.user.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">{member.role}</span>
              {isOwner && member.userId !== currentUserId && (
                <button
                  onClick={() => handleRemove(member.userId)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function OwnerRow({ ownerId }: { ownerId: string }) {
  return (
    <li className="flex items-center justify-between rounded border bg-blue-50 p-3 text-sm">
      <span className="text-xs text-blue-600 font-medium">Team Owner</span>
      <span className="text-xs text-blue-400">{ownerId}</span>
    </li>
  );
}
