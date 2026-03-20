"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Users,
  Mail,
  Loader2,
  UserMinus,
  CheckSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { TaskList } from "@/features/tasks/components/task-list";
import { CreateTaskDialog } from "@/features/tasks/components/create-task-dialog";
import { inviteTeamMember, removeTeamMember } from "@/features/teams/server/team-actions";
import {
  inviteMemberSchema,
  type InviteMemberInput,
} from "@/features/teams/schema/team-schema";
import type { TeamRole, TaskStatus, TaskPriority } from "@prisma/client";

type MemberItem = {
  id: string;
  role: TeamRole;
  user: { id: string; name: string | null; email: string; image: string | null };
};

type TaskItem = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  category: { id: string; name: string; color: string } | null;
  assignee: { id: string; name: string | null; email: string } | null;
  creator: { id: string; name: string | null; email: string };
  createdAt: Date;
  updatedAt: Date;
};

type TeamDetail = {
  id: string;
  name: string;
  members: MemberItem[];
  tasks: TaskItem[];
};

interface TeamDetailClientProps {
  team: TeamDetail;
  currentUserRole: TeamRole;
  currentUserId: string;
}

const roleLabels: Record<TeamRole, string> = {
  OWNER: "Owner",
  MEMBER: "Member",
  VIEWER: "Viewer",
};

export function TeamDetailClient({
  team,
  currentUserRole,
  currentUserId,
}: TeamDetailClientProps) {
  const router = useRouter();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const isOwner = currentUserRole === "OWNER";
  const canManageTasks = currentUserRole === "OWNER" || currentUserRole === "MEMBER";

  const form = useForm<InviteMemberInput>({
    resolver: zodResolver(inviteMemberSchema) as Resolver<InviteMemberInput>,
    defaultValues: { email: "", role: "MEMBER" },
  });

  const handleInvite = async (data: InviteMemberInput) => {
    setInviteError(null);
    const result = await inviteTeamMember(team.id, data);

    if (!result.success) {
      setInviteError(result.error.message);
      return;
    }

    form.reset();
    setInviteOpen(false);
    router.refresh();
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("Remove this member from the team?")) return;
    await removeTeamMember(team.id, userId);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{team.name}</h1>
          <p className="text-muted-foreground">
            Your role: {roleLabels[currentUserRole]}
          </p>
        </div>
        {canManageTasks && (
          <CreateTaskDialog teamId={team.id} onSuccess={() => router.refresh()} />
        )}
      </div>

      {/* Members Section */}
      <section aria-labelledby="members-heading">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle id="members-heading" className="flex items-center gap-2">
              <Users className="h-5 w-5" aria-hidden="true" />
              Members ({team.members.length})
            </CardTitle>
            {isOwner && (
              <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Mail className="mr-2 h-4 w-4" aria-hidden="true" />
                    Invite
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={form.handleSubmit(handleInvite)} className="space-y-4">
                    {inviteError && (
                      <div role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                        {inviteError}
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="invite-email">Email</Label>
                      <Input
                        id="invite-email"
                        type="email"
                        placeholder="colleague@example.com"
                        {...form.register("email")}
                      />
                      {form.formState.errors.email && (
                        <p className="text-xs text-destructive" role="alert">
                          {form.formState.errors.email.message}
                        </p>
                      )}
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting && (
                          <Loader2 className="animate-spin" aria-hidden="true" />
                        )}
                        Send Invitation
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent>
            <ul className="space-y-2" aria-label="Team members">
              {team.members.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center justify-between rounded-md p-2 hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                      {(member.user.name ?? member.user.email)[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {member.user.name ?? member.user.email}
                        {member.user.id === currentUserId && (
                          <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{member.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{roleLabels[member.role]}</Badge>
                    {isOwner && member.role !== "OWNER" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleRemoveMember(member.user.id)}
                        aria-label={`Remove ${member.user.name ?? member.user.email} from team`}
                      >
                        <UserMinus className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* Tasks Section */}
      <section aria-labelledby="tasks-heading">
        <div className="mb-3 flex items-center gap-2">
          <CheckSquare className="h-5 w-5" aria-hidden="true" />
          <h2 id="tasks-heading" className="text-lg font-semibold">
            Tasks ({team.tasks.length})
          </h2>
        </div>
        <TaskList
          tasks={team.tasks}
          onRefresh={() => router.refresh()}
        />
      </section>
    </div>
  );
}
