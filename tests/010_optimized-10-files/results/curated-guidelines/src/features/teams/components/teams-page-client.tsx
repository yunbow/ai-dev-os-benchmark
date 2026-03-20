"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { TeamWithMembers } from "../types/team-types";
import { createTeam, deleteTeam } from "../server/team-actions";

interface TeamsPageClientProps {
  initialTeams: TeamWithMembers[];
}

export function TeamsPageClient({ initialTeams }: TeamsPageClientProps) {
  const [teams, setTeams] = useState(initialTeams);
  const [newTeamName, setNewTeamName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    setIsCreating(true);
    const result = await createTeam({ name: newTeamName.trim() });
    setIsCreating(false);

    if (!result.success) {
      toast.error(result.error.message);
      return;
    }

    setTeams((prev) => [result.data, ...prev]);
    setNewTeamName("");
    toast.success("Team created");
  };

  const handleDeleteTeam = async (teamId: string) => {
    const result = await deleteTeam({ teamId });
    if (!result.success) {
      toast.error(result.error.message);
      return;
    }
    setTeams((prev) => prev.filter((t) => t.id !== teamId));
    toast.success("Team deleted");
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
      </div>

      <form onSubmit={handleCreateTeam} className="mb-8 flex gap-3">
        <input
          type="text"
          placeholder="New team name..."
          value={newTeamName}
          onChange={(e) => setNewTeamName(e.target.value)}
          maxLength={100}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="New team name"
        />
        <button
          type="submit"
          disabled={isCreating || !newTeamName.trim()}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
        >
          {isCreating ? "Creating..." : "Create Team"}
        </button>
      </form>

      {teams.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg font-medium">No teams yet</p>
          <p className="text-sm mt-1">Create a team to collaborate with others</p>
        </div>
      ) : (
        <ul className="space-y-4" role="list">
          {teams.map((team) => (
            <li key={team.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900">{team.name}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {team._count.members} member{team._count.members !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`/teams/${team.id}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Manage
                  </a>
                  {team.ownerId === team.members.find((m) => m.role === "OWNER")?.userId && (
                    <button
                      onClick={() => handleDeleteTeam(team.id)}
                      aria-label={`Delete team ${team.name}`}
                      className="text-sm text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
