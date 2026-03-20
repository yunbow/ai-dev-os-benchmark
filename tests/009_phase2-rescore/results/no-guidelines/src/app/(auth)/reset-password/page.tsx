"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { resetPasswordAction } from "@/actions/auth";
import { toast } from "@/hooks/use-toast";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [isPending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("token", token);
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await resetPasswordAction(formData);
      if (!result.success) {
        setError(result.error);
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
      } else {
        toast({ title: "Password reset successfully. Please sign in." });
        router.push("/login");
      }
    });
  }

  if (!token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invalid link</CardTitle>
          <CardDescription>This password reset link is invalid.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/forgot-password" className="text-primary hover:underline text-sm">
            Request a new link
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Set new password</CardTitle>
        <CardDescription>Choose a new password for your account</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && !Object.keys(fieldErrors).length && (
            <div role="alert" className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input id="password" name="password" type="password" required autoComplete="new-password" />
            {fieldErrors.password?.[0] && <p className="text-xs text-destructive">{fieldErrors.password[0]}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input id="confirmPassword" name="confirmPassword" type="password" required autoComplete="new-password" />
            {fieldErrors.confirmPassword?.[0] && <p className="text-xs text-destructive">{fieldErrors.confirmPassword[0]}</p>}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Resetting..." : "Reset password"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
