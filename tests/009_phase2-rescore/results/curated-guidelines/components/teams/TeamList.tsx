"use client";

import { useState } from "react";
import { Prisma } from "@prisma/client";

type TeamWithMembers = Prisma.TeamGetPayload<{
  include: {
    members: {
      include: { user: { select: { id: true; name: true; email: true; image: true } } };
    };
  };
}>;

interface TeamListProps {
  initialData: TeamWithMembers[];
}

export default function TeamList({ initialData }: TeamListProps) {
  const [teams] = useState(initialData);

  if (teams.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No teams yet. Create your first team!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {teams.map((team) => (
        <div key={team.id} className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
              {team.description && (
                <p className="text-sm text-gray-500 mt-1">{team.description}</p>
              )}
            </div>
            <span className="text-sm text-gray-500">{team.members.length} members</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {team.members.map((member) => (
              <div key={member.id} className="flex items-center gap-2 bg-gray-50 rounded-full px-3 py-1">
                <span className="text-sm text-gray-700">
                  {member.user.name || member.user.email}
                </span>
                <span className="text-xs text-gray-500 capitalize">{member.role.toLowerCase()}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
