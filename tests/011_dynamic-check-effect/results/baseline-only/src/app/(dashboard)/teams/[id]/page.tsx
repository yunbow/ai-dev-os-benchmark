import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Plus } from "lucide-react";
import { MemberList } from "@/components/teams/MemberList";
import { InviteMemberForm } from "@/components/teams/InviteMemberForm";
import { TeamForm } from "@/components/teams/TeamForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TeamRole } from "@prisma/client";
import { formatDate } from "@/lib/utils";
import type { TeamWithMembers } from "@/types";

interface TeamDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: TeamDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const team = await prisma.team.findUnique({ where: { id }, select: { name: true } });
  return { title: team?.name ?? "Team" };
}

export default async function TeamDetailPage({ params }: TeamDetailPageProps) {
  const session = await auth();
  if (!session?.user) return null;

  const { id } = await params;
  const userId = session.user.id;

  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
        orderBy: { joinedAt: "asc" },
      },
      _count: { select: { members: true, tasks: true } },
    },
  });

  if (!team) notFound();

  const membership = team.members.find((m) => m.userId === userId);
  if (!membership) notFound();

  const isOwner = team.ownerId === userId;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link
          href="/teams"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-1" aria-hidden="true" />
          Back to Teams
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
            {team.description && <p className="text-gray-600 mt-1">{team.description}</p>}
            <p className="text-xs text-gray-400 mt-1">Created {formatDate(team.createdAt)}</p>
          </div>
          {isOwner && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">Edit Team</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Team</DialogTitle>
                </DialogHeader>
                <TeamForm team={team as unknown as TeamWithMembers} />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{team._count.members}</p>
            <p className="text-sm text-gray-500">Members</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{team._count.tasks}</p>
            <p className="text-sm text-gray-500">Tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-900 capitalize">
              {membership.role.toLowerCase()}
            </p>
            <p className="text-sm text-gray-500">Your Role</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Members</CardTitle>
            {isOwner && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                    Invite Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                  </DialogHeader>
                  <InviteMemberForm teamId={id} />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <MemberList
            members={team.members}
            teamId={id}
            currentUserId={userId}
            isOwner={isOwner}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-3">
            View and manage all tasks belonging to this team.
          </p>
          <Button asChild variant="outline">
            <Link href={`/tasks?teamId=${id}`}>View Team Tasks</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
