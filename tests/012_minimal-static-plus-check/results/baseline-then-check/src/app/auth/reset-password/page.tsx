"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { resetPassword } from "@/lib/actions/auth";
import { toast } from "@/hooks/use-toast";
import { CheckSquare } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [isPending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    startTransition(async () => {
      const fd = new FormData();
      fd.append("token", token);
      fd.append("password", password);
      fd.append("confirmPassword", confirmPassword);

      const result = await resetPassword(fd);

      if (result.success) {
        toast({
          title: "Password reset",
          description: "Your password has been reset. Please sign in.",
        });
        router.push("/auth/login");
      } else {
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  };

  if (!token) {
    return (
      <main
        id="main-content"
        className="min-h-screen flex items-center justify-center p-4 bg-muted/50"
      >
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid link</CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <Link href="/auth/forgot-password">Request new link</Link>
            </Button>
          </CardFooter>
        </Card>
      </main>
    );
  }

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
            <CardTitle>Set new password</CardTitle>
            <CardDescription>
              Create a new password for your account
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit} noValidate>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="password">
                  New Password{" "}
                  <span aria-hidden="true" className="text-destructive">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  aria-required="true"
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby="password-hint"
                />
                <p id="password-hint" className="text-xs text-muted-foreground">
                  Min 8 chars with uppercase, lowercase, number, and special character
                </p>
                {fieldErrors.password && (
                  <p className="text-sm text-destructive" role="alert">
                    {fieldErrors.password[0]}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="confirmPassword">
                  Confirm New Password{" "}
                  <span aria-hidden="true" className="text-destructive">*</span>
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  aria-required="true"
                  aria-invalid={!!fieldErrors.confirmPassword}
                />
                {fieldErrors.confirmPassword && (
                  <p className="text-sm text-destructive" role="alert">
                    {fieldErrors.confirmPassword[0]}
                  </p>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full"
                disabled={isPending || !password || !confirmPassword}
              >
                {isPending ? "Resetting..." : "Reset password"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </main>
  );
}
