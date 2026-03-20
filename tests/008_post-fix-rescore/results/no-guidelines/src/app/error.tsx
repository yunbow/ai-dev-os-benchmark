"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("Global error:", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen items-center justify-center p-4 bg-background text-foreground">
          <div className="text-center space-y-6 max-w-md">
            <div className="flex justify-center">
              <AlertCircle className="h-16 w-16 text-destructive" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Something went wrong</h1>
              <p className="mt-2 text-muted-foreground">
                An unexpected error occurred. Our team has been notified.
              </p>
              {error.digest && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
            <div className="flex gap-3 justify-center">
              <Button onClick={reset} variant="default">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try again
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Go home
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
