"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CheckSquare, LogOut, Settings, User } from "lucide-react";

interface NavbarProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <header className="border-b bg-background sticky top-0 z-50" role="banner">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 font-bold text-lg"
              aria-label="TaskFlow home"
            >
              <CheckSquare className="h-6 w-6 text-primary" aria-hidden="true" />
              <span>TaskFlow</span>
            </Link>

            <nav
              className="hidden md:flex items-center gap-4"
              aria-label="Main navigation"
            >
              <Link
                href="/dashboard"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === "/dashboard"
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
                aria-current={pathname === "/dashboard" ? "page" : undefined}
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/tasks"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname.startsWith("/dashboard/tasks")
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
                aria-current={pathname.startsWith("/dashboard/tasks") ? "page" : undefined}
              >
                Tasks
              </Link>
              <Link
                href="/dashboard/categories"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname.startsWith("/dashboard/categories")
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
                aria-current={pathname.startsWith("/dashboard/categories") ? "page" : undefined}
              >
                Categories
              </Link>
              <Link
                href="/dashboard/teams"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname.startsWith("/dashboard/teams")
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
                aria-current={pathname.startsWith("/dashboard/teams") ? "page" : undefined}
              >
                Teams
              </Link>
            </nav>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-9 w-9 rounded-full"
                aria-label="User menu"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.image || undefined} alt={user.name || "User"} />
                  <AvatarFallback>
                    {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user.name || "User"}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard">
                  <User className="mr-2 h-4 w-4" aria-hidden="true" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
