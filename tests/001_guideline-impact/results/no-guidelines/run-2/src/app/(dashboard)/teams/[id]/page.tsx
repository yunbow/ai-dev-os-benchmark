import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TeamDetail } from "@/components/teams/team-detail";
import { TeamTaskList } from "@/components/teams/team-task-list";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const team = await prisma.team.findUnique({ where: { id }, select: { name: true } });
  return { title: team ? `${team.name} - TaskFlow` : "Team - TaskFlow" };
}

export default async function TeamDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const userId = session!.user!.id!;

  const membership = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId: id } },
  });
  if (!membership) notFound();

  const team = await prisma.team.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      ownerId: true,
      createdAt: true,
      members: {
        select: {
          userId: true,
          role: true,
          joinedAt: true,
          user: { select: { id: true, name: true, email: true, image: true } },
        },
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  if (!team) notFound();

  const categories = await prisma.category.findMany({
    where: { teamId: id },
    select: { id: true, name: true, color: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-8">
      <TeamDetail team={team} currentUserId={userId} currentRole={membership.role} />
      <section aria-labelledby="team-tasks-heading">
        <h2 id="team-tasks-heading" className="text-xl font-bold mb-4">Team Tasks</h2>
        <TeamTaskList teamId={id} currentUserId={userId} currentRole={membership.role} categories={categories} />
      </section>
    </div>
  );
}
