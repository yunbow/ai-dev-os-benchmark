import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckSquare, Users, Tag, Shield } from "lucide-react";

export default async function LandingPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main id="main-content" className="min-h-screen">
      {/* Header */}
      <header className="border-b" role="banner">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            <CheckSquare className="h-7 w-7 text-primary" aria-hidden="true" />
            TaskFlow
          </div>
          <nav aria-label="Header navigation">
            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild>
                <Link href="/auth/login">Sign in</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/register">Get started</Link>
              </Button>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section
        className="container mx-auto px-4 py-20 text-center"
        aria-labelledby="hero-heading"
      >
        <h1
          id="hero-heading"
          className="text-4xl md:text-6xl font-bold tracking-tight mb-6"
        >
          Manage tasks,{" "}
          <span className="text-primary">collaborate teams</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          TaskFlow helps you organize your work, track progress, and collaborate
          with your team — all in one place.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/auth/register">Start for free</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/auth/login">Sign in</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section
        className="container mx-auto px-4 py-16"
        aria-labelledby="features-heading"
      >
        <h2
          id="features-heading"
          className="text-3xl font-bold text-center mb-12"
        >
          Everything you need
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: CheckSquare,
              title: "Task Management",
              description:
                "Create, organize, and track tasks with priority levels, due dates, and status tracking.",
            },
            {
              icon: Tag,
              title: "Categories",
              description:
                "Organize tasks with color-coded categories for quick visual identification.",
            },
            {
              icon: Users,
              title: "Team Collaboration",
              description:
                "Work together with role-based access control for owners, members, and viewers.",
            },
            {
              icon: Shield,
              title: "Secure & Private",
              description:
                "Enterprise-grade security with bcrypt hashing and CSRF protection.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col items-center text-center p-6 rounded-lg border bg-card"
            >
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon
                  className="h-6 w-6 text-primary"
                  aria-hidden="true"
                />
              </div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get organized?</h2>
          <p className="text-primary-foreground/80 mb-8 text-lg">
            Join thousands of teams already using TaskFlow.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/auth/register">Create your free account</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8" role="contentinfo">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>&copy; {new Date().getFullYear()} TaskFlow. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
