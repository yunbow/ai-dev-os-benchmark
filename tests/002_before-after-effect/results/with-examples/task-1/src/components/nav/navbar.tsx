"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

interface NavbarProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export function Navbar({ user }: NavbarProps) {
  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-lg font-bold text-blue-600">
            TaskFlow
          </Link>
          <Link
            href="/tasks"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Tasks
          </Link>
          <Link
            href="/teams"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Teams
          </Link>
          {user.role === "admin" && (
            <Link
              href="/admin"
              className="text-sm text-red-600 hover:text-red-800"
            >
              Admin
            </Link>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user.name}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
