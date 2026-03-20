import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-6xl font-bold text-[var(--color-muted-foreground)]">404</h1>
        <h2 className="text-2xl font-semibold">Page not found</h2>
        <p className="text-[var(--color-muted-foreground)]">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Button asChild>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    </main>
  );
}
