"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { registerUser } from "@/lib/actions/auth";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setFieldErrors({});
    setError(null);

    startTransition(async () => {
      const result = await registerUser(formData);
      if (result.success) {
        toast({ title: "Account created! Please sign in." });
        router.push("/login");
      } else if (result.fieldErrors) {
        setFieldErrors(result.fieldErrors);
      } else {
        setError(result.error ?? "Registration failed");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create account</CardTitle>
        <CardDescription>Sign up to start managing your tasks</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {error && (
            <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" autoComplete="name" required aria-required="true" placeholder="Your name" />
            {fieldErrors.name && <p className="text-xs text-red-600" role="alert">{fieldErrors.name[0]}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required aria-required="true" placeholder="you@example.com" />
            {fieldErrors.email && <p className="text-xs text-red-600" role="alert">{fieldErrors.email[0]}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" autoComplete="new-password" required aria-required="true" />
            <p className="text-xs text-gray-500">Min. 8 chars with uppercase, lowercase, number, and special character</p>
            {fieldErrors.password && <p className="text-xs text-red-600" role="alert">{fieldErrors.password[0]}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required aria-required="true" />
            {fieldErrors.confirmPassword && <p className="text-xs text-red-600" role="alert">{fieldErrors.confirmPassword[0]}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">Sign in</Link>
        </p>
      </CardContent>
    </Card>
  );
}
