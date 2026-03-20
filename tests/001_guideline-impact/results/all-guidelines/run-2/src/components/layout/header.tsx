import { auth } from "@/lib/auth/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export async function Header() {
  const session = await auth();
  const user = session?.user;
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? "U";

  return (
    <header className="h-14 border-b bg-card flex items-center justify-end px-6">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">{user?.name ?? user?.email}</span>
        <Avatar className="h-8 w-8">
          <AvatarImage src={user?.image ?? undefined} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
