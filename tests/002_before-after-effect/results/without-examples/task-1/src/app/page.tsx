import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="max-w-2xl text-center">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Task<span className="text-blue-600">Flow</span>
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600">
          Manage your tasks efficiently. Collaborate with your team. Stay
          organized and productive.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Button asChild size="lg">
            <Link href="/auth/login">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/auth/register">Create Account</Link>
          </Button>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900">Task Management</h3>
            <p className="mt-2 text-sm text-gray-600">
              Create, organize, and track tasks with priorities and deadlines
            </p>
          </div>
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900">Team Collaboration</h3>
            <p className="mt-2 text-sm text-gray-600">
              Work together with role-based access control
            </p>
          </div>
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900">Secure & Fast</h3>
            <p className="mt-2 text-sm text-gray-600">
              Enterprise-grade security with real-time updates
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
