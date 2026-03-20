import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { CheckSquare, Users, Tag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <CheckSquare className="h-5 w-5 text-primary" aria-hidden="true" />
            <span>TaskFlow</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        {/* Hero */}
        <section className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
            Collaborative task management for teams
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            TaskFlow helps your team stay organized, prioritize work, and ship
            faster. Create tasks, assign them to teammates, and track progress
            in one place.
          </p>
          <div className="mt-8 flex gap-3">
            <Link href="/register">
              <Button size="lg">
                Get started for free
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">
                Sign in
              </Button>
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="border-t bg-muted/40 px-4 py-16">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-10 text-center text-2xl font-bold">
              Everything your team needs
            </h2>
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <CheckSquare
                    className="h-6 w-6 text-primary"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="font-semibold">Task tracking</h3>
                <p className="text-sm text-muted-foreground">
                  Create, assign, and track tasks with priorities, due dates,
                  and categories.
                </p>
              </div>
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <h3 className="font-semibold">Team collaboration</h3>
                <p className="text-sm text-muted-foreground">
                  Invite teammates, assign roles, and work together on shared
                  projects.
                </p>
              </div>
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Tag className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <h3 className="font-semibold">Organize with categories</h3>
                <p className="text-sm text-muted-foreground">
                  Color-code tasks by category to keep your work organized and
                  easy to filter.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} TaskFlow. All rights reserved.
      </footer>
    </div>
  );
}
