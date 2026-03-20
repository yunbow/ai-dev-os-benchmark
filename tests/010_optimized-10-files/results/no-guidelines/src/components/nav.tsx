"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  CheckSquare,
  Tag,
  Users,
  LogOut,
  Menu,
  X,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/categories", label: "Categories", icon: Tag },
  { href: "/teams", label: "Teams", icon: Users },
];

function NavLink({
  item,
  pathname,
  onClick,
}: {
  item: NavItem;
  pathname: string;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  const isActive =
    pathname === item.href || pathname.startsWith(item.href + "/");

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {item.label}
    </Link>
  );
}

export function Nav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  const userInitials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : session?.user?.email?.[0]?.toUpperCase() ?? "U";

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  return (
    <>
      {/* Desktop sidebar */}
      <nav
        className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 md:border-r md:bg-background"
        aria-label="Main navigation"
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          <div className="flex items-center h-16 px-4 border-b">
            <Link
              href="/tasks"
              className="flex items-center gap-2 font-bold text-lg"
            >
              <LayoutDashboard className="h-5 w-5 text-primary" aria-hidden="true" />
              TaskFlow
            </Link>
          </div>

          <div className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </div>

          <div className="p-3 border-t">
            <Separator className="mb-3" />
            <div className="flex items-center gap-3 px-3 py-2 mb-2">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={session?.user?.image ?? undefined}
                  alt={session?.user?.name ?? "User"}
                />
                <AvatarFallback className="text-xs">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {session?.user?.name ?? "User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {session?.user?.email}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between h-16 px-4 border-b bg-background">
        <Link href="/tasks" className="flex items-center gap-2 font-bold text-lg">
          <LayoutDashboard className="h-5 w-5 text-primary" aria-hidden="true" />
          TaskFlow
        </Link>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-menu"
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Menu className="h-5 w-5" aria-hidden="true" />
          )}
        </Button>
      </header>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/50"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Mobile menu drawer */}
      <nav
        id="mobile-menu"
        className={cn(
          "md:hidden fixed top-16 left-0 bottom-0 z-40 w-72 bg-background border-r flex flex-col transform transition-transform duration-300",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Mobile navigation"
        aria-hidden={!mobileMenuOpen}
      >
        <div className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              pathname={pathname}
              onClick={closeMobileMenu}
            />
          ))}
        </div>

        <div className="p-3 border-t">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={session?.user?.image ?? undefined}
                alt={session?.user?.name ?? "User"}
              />
              <AvatarFallback className="text-xs">
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {session?.user?.name ?? "User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {session?.user?.email}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground"
            onClick={() => {
              closeMobileMenu();
              signOut({ callbackUrl: "/login" });
            }}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </Button>
        </div>
      </nav>
    </>
  );
}
