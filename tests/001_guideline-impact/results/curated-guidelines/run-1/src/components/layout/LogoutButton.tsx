import { signOut } from "@/lib/auth/auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  async function handleLogout() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <form action={handleLogout}>
      <Button variant="ghost" size="icon" type="submit" aria-label="Sign out">
        <LogOut className="h-4 w-4" aria-hidden />
      </Button>
    </form>
  );
}
