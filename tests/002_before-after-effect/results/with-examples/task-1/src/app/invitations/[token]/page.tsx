import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { acceptInvitation } from "@/lib/actions/teams";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await getSession();

  // Verify the invitation token
  const invitation = await prisma.teamInvitation.findUnique({
    where: { token },
    include: { team: true },
  });

  if (!invitation || invitation.used || invitation.expiresAt < new Date()) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="rounded-lg bg-white p-8 shadow text-center">
          <h1 className="text-xl font-bold text-gray-900">Invalid or expired invitation</h1>
          <p className="mt-2 text-sm text-gray-600">
            This invitation link is no longer valid.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm text-blue-600 hover:underline"
          >
            Go home
          </Link>
        </div>
      </div>
    );
  }

  // If not signed in, redirect to login with callback
  if (!session) {
    redirect(`/login?callbackUrl=/invitations/${token}`);
  }

  // Accept the invitation on page load
  const result = await acceptInvitation(token);

  if (!result.success) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="rounded-lg bg-white p-8 shadow text-center">
          <h1 className="text-xl font-bold text-gray-900">Could not accept invitation</h1>
          <p className="mt-2 text-sm text-red-600">{result.error}</p>
          <Link
            href="/teams"
            className="mt-4 inline-block text-sm text-blue-600 hover:underline"
          >
            View my teams
          </Link>
        </div>
      </div>
    );
  }

  redirect(`/teams`);
}
