import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { acceptInvitation } from "@/features/teams/server/team-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Accept Team Invitation",
};

interface AcceptInvitePageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function AcceptInvitePage({ searchParams }: AcceptInvitePageProps) {
  const { token } = await searchParams;

  if (!token) {
    redirect("/teams");
  }

  const result = await acceptInvitation(token);

  if (result.success) {
    return (
      <div className="flex justify-center py-12">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <CardTitle>You&apos;re in!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              You have successfully joined{" "}
              <strong>{result.data.teamName}</strong>.
            </p>
            <Button asChild>
              <Link href={`/teams/${result.data.teamId}`}>
                View team
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex justify-center py-12">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
          <CardTitle>Invitation Error</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">{result.error.message}</p>
          <Button variant="outline" asChild>
            <Link href="/teams">Go to teams</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
