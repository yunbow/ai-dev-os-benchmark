import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckSquare, CheckCircle2, XCircle } from "lucide-react";
import { auth } from "@/lib/auth";
import { acceptInvitation } from "@/features/teams/server/team-actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface InvitationPageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitationPage({ params }: InvitationPageProps) {
  const { token } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect(`/login?callbackUrl=/invitations/${token}`);
  }

  const result = await acceptInvitation(token);

  if (!result.success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Link href="/" className="mb-8 flex items-center gap-2 font-semibold">
          <CheckSquare className="h-5 w-5 text-primary" aria-hidden="true" />
          <span>TaskFlow</span>
        </Link>
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <div className="mb-2 flex justify-center">
              <XCircle
                className="h-12 w-12 text-destructive"
                aria-hidden="true"
              />
            </div>
            <CardTitle>Invitation Invalid</CardTitle>
            <CardDescription>{result.error.message}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Link href="/teams">
              <Button className="w-full">Go to Teams</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full">
                Go to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Link href="/" className="mb-8 flex items-center gap-2 font-semibold">
        <CheckSquare className="h-5 w-5 text-primary" aria-hidden="true" />
        <span>TaskFlow</span>
      </Link>
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mb-2 flex justify-center">
            <CheckCircle2
              className="h-12 w-12 text-green-500"
              aria-hidden="true"
            />
          </div>
          <CardTitle>You&apos;re in!</CardTitle>
          <CardDescription>
            You have successfully joined the team.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href={`/teams/${result.data.teamId}`}>
            <Button className="w-full">Go to Team</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
