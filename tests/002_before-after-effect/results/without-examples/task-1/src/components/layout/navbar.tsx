"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import type { SessionUser } from "@/lib/types";

interface NavbarProps {
  user: SessionUser;
}

export function Navbar({ user }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
      <div className="flex h-16 items-center justify-between px-6">
        <Link href="/dashboard" className="text-xl font-bold text-gray-900">
          Task<span className="text-blue-600">Flow</span>
        </Link>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 hidden sm:block">
            {user.name ?? user.email}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
}
