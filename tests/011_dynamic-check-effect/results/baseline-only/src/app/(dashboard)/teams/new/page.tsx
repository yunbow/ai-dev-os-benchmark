import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { TeamForm } from "@/components/teams/TeamForm";

export const metadata: Metadata = {
  title: "New Team",
};

export default function NewTeamPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href="/teams"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-1" aria-hidden="true" />
          Back to Teams
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create New Team</h1>
        <p className="text-gray-600 mt-1">Build a team and invite collaborators</p>
      </div>
      <TeamForm />
    </div>
  );
}
