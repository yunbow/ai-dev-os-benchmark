import { redirect } from "next/navigation";
import { acceptInvitationAction } from "@/features/teams/server/team-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata = { title: "Accept Invitation - TaskFlow" };

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;

  if (!params.token) {
    redirect("/login");
  }

  const result = await acceptInvitationAction(params.token);

  if (result.success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Welcome to the team!</CardTitle>
            <CardDescription>You have successfully joined the team.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/teams">View Teams</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Invalid invitation</CardTitle>
          <CardDescription>
            {result.error.message ?? "This invitation link is invalid or has expired."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Go to login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
