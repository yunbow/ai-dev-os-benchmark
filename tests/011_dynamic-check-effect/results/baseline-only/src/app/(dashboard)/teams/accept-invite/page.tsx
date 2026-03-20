import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AcceptInviteButton } from "./AcceptInviteButton";

export const metadata: Metadata = {
  title: "Accept Team Invitation",
};

interface AcceptInvitePageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function AcceptInvitePage({ searchParams }: AcceptInvitePageProps) {
  const session = await auth();
  if (!session?.user) {
    const params = await searchParams;
    const token = params.token;
    redirect(`/login?callbackUrl=${encodeURIComponent(`/teams/accept-invite?token=${token}`)}`);
  }

  const params = await searchParams;
  const token = params.token;

  if (!token) {
    redirect("/teams");
  }

  return (
    <div className="max-w-md mx-auto mt-16 text-center space-y-6">
      <div className="text-5xl" aria-hidden="true">👋</div>
      <h1 className="text-2xl font-bold text-gray-900">Accept Team Invitation</h1>
      <p className="text-gray-600">You&apos;ve been invited to join a team on TaskFlow.</p>
      <AcceptInviteButton token={token} />
    </div>
  );
}
