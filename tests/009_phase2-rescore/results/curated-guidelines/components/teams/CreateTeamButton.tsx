"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createTeamSchema, CreateTeamInput } from "@/features/teams/schema/team-schema";
import { createTeam } from "@/features/teams/server/team-actions";
import { useRouter } from "next/navigation";

export default function CreateTeamButton() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<CreateTeamInput>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: { name: "", description: "" },
  });

  async function onSubmit(values: CreateTeamInput) {
    setIsLoading(true);
    try {
      const result = await createTeam(values);
      if (result.success) {
        toast.success("Team created");
        setOpen(false);
        form.reset();
        router.refresh();
      } else {
        toast.error(result.error.message);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        New Team
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-team-title"
        >
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 id="create-team-title" className="text-lg font-bold mb-4">Create Team</h2>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label htmlFor="team-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Team Name *
                </label>
                <input
                  id="team-name"
                  {...form.register("name")}
                  maxLength={100}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {form.formState.errors.name && (
                  <p className="mt-1 text-sm text-red-600" role="alert">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="team-description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="team-description"
                  {...form.register("description")}
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? "Creating..." : "Create Team"}
                </button>
                <button
                  type="button"
                  onClick={() => { setOpen(false); form.reset(); }}
                  className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
