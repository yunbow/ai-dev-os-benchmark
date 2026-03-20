import { auth } from "@/lib/auth";
import { signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

export async function Header() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-end border-b border-gray-200 bg-white px-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <User className="h-4 w-4" aria-hidden="true" />
          <span>{session?.user?.name ?? session?.user?.email}</span>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <Button type="submit" variant="ghost" size="sm">
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span>Sign out</span>
          </Button>
        </form>
      </div>
    </header>
  );
}
