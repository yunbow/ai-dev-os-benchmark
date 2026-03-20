import type { ReactNode } from "react";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/layout/app-nav";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col">
      <AppNav user={session.user} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
