import Link from "next/link";
import { notFound } from "next/navigation";
import { InviteForm } from "@/components/forms/invite-form";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;

  // Only the team owner can access this page
  const team = await prisma.team.findUnique({ where: { id } });
  if (!team) notFound();
  if (team.ownerId !== session.user.id) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-700">
        Only the team owner can invite members.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <Link href="/teams" className="text-sm text-gray-500 hover:text-gray-700">
          Teams
        </Link>
        <span className="text-gray-400">/</span>
        <Link
          href={`/teams/${id}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          {team.name}
        </Link>
        <span className="text-gray-400">/</span>
        <span className="text-sm text-gray-900">Invite member</span>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <h1 className="mb-6 text-xl font-bold text-gray-900">
          Invite to {team.name}
        </h1>
        <InviteForm teamId={id} />
      </div>
    </div>
  );
}
