import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Nav } from "@/components/layout/nav";

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
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 container py-6 px-4 md:px-6" id="main-content">
        {children}
      </main>
    </div>
  );
}
