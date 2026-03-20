import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AcceptInvitationClient from "@/features/teams/components/AcceptInvitationClient";

export const metadata: Metadata = {
  title: "Team Invitation - TaskFlow",
};

interface Props {
  params: Promise<{ token: string }>;
}

export default async function AcceptInvitationPage({ params }: Props) {
  const session = await auth();
  const { token } = await params;

  if (!session) {
    redirect(`/login?callbackUrl=/teams/invite/${token}`);
  }

  return (
    <div className="max-w-md mx-auto">
      <AcceptInvitationClient token={token} />
    </div>
  );
}
