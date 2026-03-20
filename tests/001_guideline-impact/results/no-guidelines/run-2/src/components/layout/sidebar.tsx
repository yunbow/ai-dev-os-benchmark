"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckSquare, FolderOpen, Users, Menu, X, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Session } from "next-auth";

const navItems = [
  { href: "/dashboard/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/dashboard/categories", label: "Categories", icon: FolderOpen },
  { href: "/dashboard/teams", label: "Teams", icon: Users },
];

interface SidebarProps {
  user: Session["user"];
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-50 md:hidden"
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close navigation" : "Open navigation"}
        aria-expanded={open}
        aria-controls="sidebar-nav"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <nav
        id="sidebar-nav"
        aria-label="Main navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transform bg-[var(--color-card)] border-r shadow-sm transition-transform duration-200 ease-in-out md:relative md:translate-x-0 md:shadow-none",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center px-6 border-b">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-lg">
            <LayoutDashboard className="h-5 w-5 text-[var(--color-primary)]" aria-hidden="true" />
            TaskFlow
          </Link>
        </div>

        <ul className="flex-1 space-y-1 p-4" role="list">
          {navItems.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  pathname.startsWith(href)
                    ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                    : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)]"
                )}
                aria-current={pathname.startsWith(href) ? "page" : undefined}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
