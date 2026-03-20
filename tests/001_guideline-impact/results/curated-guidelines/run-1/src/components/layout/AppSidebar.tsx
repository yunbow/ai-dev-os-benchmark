"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CheckSquare, FolderOpen, Users, LayoutDashboard, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface User {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/categories", label: "Categories", icon: FolderOpen },
  { href: "/teams", label: "Teams", icon: Users },
];

export function AppSidebar({ user, logoutButton }: { user: User; logoutButton: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user.email?.[0].toUpperCase() ?? "?";

  const sidebar = (
    <div className="flex h-full flex-col gap-2 p-4">
      <div className="flex items-center gap-2 px-2 py-3">
        <CheckSquare className="h-6 w-6 text-primary" aria-hidden />
        <span className="text-lg font-bold">TaskFlow</span>
      </div>

      <Separator />

      <nav className="flex-1" aria-label="Main navigation">
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  pathname.startsWith(href)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
                aria-current={pathname.startsWith(href) ? "page" : undefined}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <Separator />

      <div className="flex items-center gap-3 px-2 py-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.image ?? undefined} alt={user.name ?? "User"} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 overflow-hidden">
          <p className="truncate text-sm font-medium">{user.name ?? user.email}</p>
          {user.name && (
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          )}
        </div>
        {logoutButton}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-60 flex-shrink-0 border-r bg-card md:flex md:flex-col">
        {sidebar}
      </aside>

      {/* Mobile hamburger */}
      <div className="fixed left-4 top-4 z-50 md:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={mobileOpen}
        >
          <Menu className="h-4 w-4" aria-hidden />
        </Button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal aria-label="Navigation menu">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="relative flex h-full w-60 flex-col bg-card shadow-lg">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation menu"
            >
              <X className="h-4 w-4" aria-hidden />
            </Button>
            {sidebar}
          </aside>
        </div>
      )}
    </>
  );
}
