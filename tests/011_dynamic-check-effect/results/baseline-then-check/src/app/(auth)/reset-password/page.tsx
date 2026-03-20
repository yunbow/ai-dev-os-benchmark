"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { resetPassword } from "@/actions/auth";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setErrors({});
    setGlobalError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("token", token);

    const result = await resetPassword(formData);
    setPending(false);

    if (result.success) {
      router.push("/login?reset=true");
    } else {
      if (result.fieldErrors) {
        setErrors(result.fieldErrors);
      } else {
        setGlobalError(result.error);
      }
    }
  }

  if (!token) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <CardTitle>Invalid link</CardTitle>
            <CardDescription>This reset link is invalid or has expired.</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Link href="/forgot-password" className="text-primary hover:underline underline-offset-4 text-sm">
              Request a new link
            </Link>
          </CardFooter>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Set new password</CardTitle>
          <CardDescription>Choose a strong password for your account</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} noValidate>
          <CardContent className="space-y-4">
            {globalError && (
              <div role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {globalError}
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="password">New password</Label>
              <Input id="password" name="password" type="password" autoComplete="new-password" required aria-required="true" aria-invalid={!!errors.password} />
              {errors.password && <p className="text-xs text-destructive" role="alert">{errors.password[0]}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required aria-required="true" aria-invalid={!!errors.confirmPassword} />
              {errors.confirmPassword && <p className="text-xs text-destructive" role="alert">{errors.confirmPassword[0]}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Updating..." : "Update password"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
