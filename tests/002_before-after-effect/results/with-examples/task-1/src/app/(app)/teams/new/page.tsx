import Link from "next/link";
import { TeamForm } from "@/components/forms/team-form";

export default function NewTeamPage() {
  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <Link href="/teams" className="text-sm text-gray-500 hover:text-gray-700">
          Teams
        </Link>
        <span className="text-gray-400">/</span>
        <span className="text-sm text-gray-900">New team</span>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <h1 className="mb-6 text-xl font-bold text-gray-900">Create new team</h1>
        <TeamForm />
      </div>
    </div>
  );
}
