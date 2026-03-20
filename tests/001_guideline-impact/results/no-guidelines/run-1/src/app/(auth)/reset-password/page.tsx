"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { resetPassword } from "@/lib/actions/auth";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  if (!token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invalid reset link</CardTitle>
          <CardDescription>This reset link is invalid or has expired.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
            Request a new reset link
          </Link>
        </CardContent>
      </Card>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("token", token);
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await resetPassword(formData);
      if (result.success) {
        router.push("/login?message=password-reset");
      } else if (result.fieldErrors) {
        setFieldErrors(result.fieldErrors);
      } else {
        setError(result.error ?? "Password reset failed");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set new password</CardTitle>
        <CardDescription>Enter your new password below</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {error && (
            <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="password">New Password</Label>
            <Input id="password" name="password" type="password" autoComplete="new-password" required aria-required="true" />
            {fieldErrors.password && <p className="text-xs text-red-600" role="alert">{fieldErrors.password[0]}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required aria-required="true" />
            {fieldErrors.confirmPassword && <p className="text-xs text-red-600" role="alert">{fieldErrors.confirmPassword[0]}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Resetting..." : "Reset password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
