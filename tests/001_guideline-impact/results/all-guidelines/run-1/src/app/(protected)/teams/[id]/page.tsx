import { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TeamDetailClient } from "./team-detail-client";

interface TeamPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: TeamPageProps): Promise<Metadata> {
  const { id } = await params;
  const team = await prisma.team.findUnique({ where: { id }, select: { name: true } });
  return { title: team ? `${team.name} - TaskFlow` : "Team - TaskFlow" };
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { id } = await params;
  const session = await auth();

  const [membership, team] = await Promise.all([
    prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: id, userId: session!.user!.id! } },
    }),
    prisma.team.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        tasks: {
          include: {
            category: { select: { id: true, name: true, color: true } },
            assignee: { select: { id: true, name: true, email: true } },
            creator: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    }),
  ]);

  if (!team || !membership) notFound();

  return (
    <TeamDetailClient
      team={team as Parameters<typeof TeamDetailClient>[0]["team"]}
      currentUserRole={membership.role}
      currentUserId={session!.user!.id!}
    />
  );
}
