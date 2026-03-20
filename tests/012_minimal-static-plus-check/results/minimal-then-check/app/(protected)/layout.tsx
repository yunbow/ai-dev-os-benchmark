import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { NavBar } from "@/components/layout/nav-bar";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar user={session.user} />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl" id="main-content">
        {children}
      </main>
    </div>
  );
}
