import { auth } from "@/lib/auth";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title?: string;
}

export async function Header({ title }: HeaderProps) {
  const session = await auth();

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div>
        {title && (
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
            {session?.user?.name?.[0]?.toUpperCase() ??
              session?.user?.email?.[0]?.toUpperCase() ??
              "U"}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium">
              {session?.user?.name ?? session?.user?.email}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
