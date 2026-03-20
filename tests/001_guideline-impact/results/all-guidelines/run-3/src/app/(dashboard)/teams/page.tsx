import { Metadata } from "next";
import { auth } from "@/lib/auth";
import TeamsClient from "@/features/teams/components/TeamsClient";

export const metadata: Metadata = {
  title: "Teams - TaskFlow",
};

export default async function TeamsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
      <TeamsClient currentUserId={session.user.id} />
    </div>
  );
}
