import { AcceptInvitationClient } from "@/features/teams/components/accept-invitation-client";

export default function AcceptInvitationPage() {
  return (
    <main className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <h1 className="text-xl font-semibold text-gray-900 mb-4">Accept Team Invitation</h1>
        <AcceptInvitationClient />
      </div>
    </main>
  );
}
