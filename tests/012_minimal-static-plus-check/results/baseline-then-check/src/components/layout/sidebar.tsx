"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  CheckSquare,
  Tag,
  Users,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/dashboard/categories", label: "Categories", icon: Tag },
  { href: "/dashboard/teams", label: "Teams", icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const NavContent = () => (
    <nav aria-label="Sidebar navigation">
      <ul className="space-y-1">
        {navItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive(item.href, item.exact)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
              aria-current={isActive(item.href, item.exact) ? "page" : undefined}
            >
              <item.icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden fixed top-4 left-4 z-50"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={mobileOpen}
        aria-controls="sidebar"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        id="sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-56 bg-background border-r transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 md:flex md:flex-col",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Navigation sidebar"
      >
        <div className="p-4 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-6 font-bold text-lg md:hidden">
            <CheckSquare className="h-6 w-6 text-primary" aria-hidden="true" />
            TaskFlow
          </div>
          <NavContent />
        </div>
      </aside>
    </>
  );
}
