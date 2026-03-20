import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar, MobileSidebar } from "@/components/layout/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen flex-col">
      <Navbar user={session.user} />
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <Sidebar className="hidden md:flex" />
        {/* Main content */}
        <main
          className="flex-1 overflow-y-auto p-4 pb-20 sm:p-6 md:p-8 md:pb-8"
          id="main-content"
        >
          {children}
        </main>
      </div>
      {/* Mobile bottom nav */}
      <MobileSidebar />
    </div>
  );
}
