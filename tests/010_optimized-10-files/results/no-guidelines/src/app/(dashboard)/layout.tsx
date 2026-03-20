import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <Nav />

      {/* Main content area - offset for sidebar on desktop, header on mobile */}
      <div className="md:pl-64">
        <div className="pt-16 md:pt-0">
          <main className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
