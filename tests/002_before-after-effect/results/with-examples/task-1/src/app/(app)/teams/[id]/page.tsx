import Link from "next/link";
import { notFound } from "next/navigation";
import { getTeam } from "@/lib/actions/teams";
import { getSession } from "@/lib/auth";
import { MemberList } from "@/components/teams/member-list";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;

  const result = await getTeam(id);

  if (!result.success) {
    if (result.error === "Team not found") notFound();
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-700">{result.error}</div>
    );
  }

  const team = result.data;
  const isOwner = team.ownerId === session.user.id;

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <Link href="/teams" className="text-sm text-gray-500 hover:text-gray-700">
          Teams
        </Link>
        <span className="text-gray-400">/</span>
        <span className="text-sm text-gray-900">{team.name}</span>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{team.name}</h1>
            {team.description && (
              <p className="mt-1 text-sm text-gray-600">{team.description}</p>
            )}
          </div>
          {isOwner && (
            <Link
              href={`/teams/${id}/invite`}
              className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              Invite member
            </Link>
          )}
        </div>

        <MemberList
          members={team.members}
          ownerId={team.ownerId}
          teamId={id}
          currentUserId={session.user.id}
          isOwner={isOwner}
        />
      </div>
    </div>
  );
}
