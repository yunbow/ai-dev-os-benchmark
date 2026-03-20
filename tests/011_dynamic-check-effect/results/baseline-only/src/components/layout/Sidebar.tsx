"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CheckSquare,
  Tag,
  Users,
  Plus,
} from "lucide-react";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/tasks",
    label: "Tasks",
    icon: CheckSquare,
  },
  {
    href: "/categories",
    label: "Categories",
    icon: Tag,
  },
  {
    href: "/teams",
    label: "Teams",
    icon: Users,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 bg-white border-r min-h-screen">
      <nav className="flex-1 p-4 space-y-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
          Navigation
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                className={cn("h-4 w-4", active ? "text-indigo-600" : "text-gray-400")}
                aria-hidden="true"
              />
              {item.label}
            </Link>
          );
        })}

        <div className="pt-4 mt-4 border-t">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
            Quick Actions
          </p>
          <Link
            href="/tasks/new"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New Task
          </Link>
          <Link
            href="/teams/new"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New Team
          </Link>
        </div>
      </nav>
    </aside>
  );
}
