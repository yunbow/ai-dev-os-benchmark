import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { LogoutButton } from "@/components/layout/LogoutButton";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <AppSidebar user={session.user} logoutButton={<LogoutButton />} />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
