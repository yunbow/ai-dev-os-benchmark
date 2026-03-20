"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requestPasswordReset } from "@/lib/actions/auth";
import { toast } from "@/hooks/use-toast";
import { CheckSquare, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const fd = new FormData();
      fd.append("email", email);
      const result = await requestPasswordReset(fd);

      if (result.success) {
        setSent(true);
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <main
      id="main-content"
      className="min-h-screen flex items-center justify-center p-4 bg-muted/50"
    >
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-2xl">
            <CheckSquare className="h-8 w-8 text-primary" aria-hidden="true" />
            TaskFlow
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Reset your password</CardTitle>
            <CardDescription>
              {sent
                ? "Check your email for reset instructions"
                : "Enter your email address and we'll send you a reset link"}
            </CardDescription>
          </CardHeader>

          {sent ? (
            <CardContent>
              <div
                className="rounded-md bg-green-50 border border-green-200 p-4 text-sm text-green-800"
                role="status"
                aria-live="polite"
              >
                <p className="font-medium">Email sent!</p>
                <p className="mt-1">
                  If an account exists with that email, you&apos;ll receive a
                  password reset link within a few minutes. The link will expire
                  in 1 hour.
                </p>
              </div>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <CardContent>
                <div className="space-y-1">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    aria-required="true"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={isPending || !email}>
                  {isPending ? "Sending..." : "Send reset link"}
                </Button>
              </CardFooter>
            </form>
          )}

          <CardFooter>
            <Link
              href="/auth/login"
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to sign in
            </Link>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
