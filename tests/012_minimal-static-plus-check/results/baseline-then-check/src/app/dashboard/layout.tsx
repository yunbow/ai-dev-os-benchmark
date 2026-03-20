import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Navbar } from "@/components/layout/navbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        user={{
          id: session.user.id!,
          name: session.user.name ?? null,
          email: session.user.email!,
          image: session.user.image ?? null,
        }}
      />
      <main id="main-content" className="flex-1 container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
