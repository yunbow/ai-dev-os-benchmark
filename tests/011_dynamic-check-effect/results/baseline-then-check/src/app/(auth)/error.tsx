"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AuthError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-4" role="alert">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="text-muted-foreground text-sm">An error occurred. Please try again.</p>
      <Link href="/login" className="text-primary hover:underline underline-offset-4 text-sm">
        Back to sign in
      </Link>
    </main>
  );
}
