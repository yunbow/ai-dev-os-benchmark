"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";

interface AppNavProps {
  user: Session["user"];
}

const NAV_ITEMS = [
  { href: "/tasks", label: "Tasks" },
  { href: "/teams", label: "Teams" },
];

export function AppNav({ user }: AppNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className="bg-white border-b border-gray-200"
      aria-label="Main navigation"
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <Link href="/tasks" className="font-bold text-gray-900 text-lg">
              TaskFlow
            </Link>
            <ul className="hidden sm:flex items-center gap-1" role="list">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      pathname.startsWith(item.href)
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                    aria-current={pathname.startsWith(item.href) ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 hidden sm:block">
              {user?.name ?? user?.email}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-100"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
