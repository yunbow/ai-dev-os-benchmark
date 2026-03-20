"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function TasksError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to error reporting service (sanitize before logging)
    console.error("Tasks page error:", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Something went wrong
          </CardTitle>
          <CardDescription>
            We encountered an error while loading your tasks. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {/* Don&apos;t expose internal error details to users */}
            An unexpected error occurred. If this problem persists, please
            contact support.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground">
              Error ID: {error.digest}
            </p>
          )}
          <Button
            onClick={reset}
            className="w-full"
            aria-label="Retry loading tasks"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
