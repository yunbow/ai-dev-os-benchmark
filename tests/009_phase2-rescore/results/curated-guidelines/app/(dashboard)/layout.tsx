import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import Link from "next/link";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="text-xl font-bold text-blue-600">
                TaskFlow
              </Link>
              <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
                Tasks
              </Link>
              <Link href="/categories" className="text-sm text-gray-600 hover:text-gray-900">
                Categories
              </Link>
              <Link href="/teams" className="text-sm text-gray-600 hover:text-gray-900">
                Teams
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{session.user?.name || session.user?.email}</span>
              <form action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}>
                <button
                  type="submit"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
