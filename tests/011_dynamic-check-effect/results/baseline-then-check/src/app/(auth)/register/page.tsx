"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { registerUser } from "@/actions/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setErrors({});
    setGlobalError(null);

    const result = await registerUser(new FormData(e.currentTarget));
    setPending(false);

    if (result.success) {
      router.push("/login?registered=true");
    } else {
      if (result.fieldErrors) {
        setErrors(result.fieldErrors);
      } else {
        setGlobalError(result.error);
      }
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Create account</CardTitle>
          <CardDescription>Sign up for TaskFlow</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} noValidate>
          <CardContent className="space-y-4">
            {globalError && (
              <div role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {globalError}
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" autoComplete="name" required aria-required="true" aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-err" : undefined} />
              {errors.name && <p id="name-err" className="text-xs text-destructive" role="alert">{errors.name[0]}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required aria-required="true" aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-err" : undefined} />
              {errors.email && <p id="email-err" className="text-xs text-destructive" role="alert">{errors.email[0]}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" autoComplete="new-password" required aria-required="true" aria-invalid={!!errors.password} aria-describedby="pw-hint" />
              <p id="pw-hint" className="text-xs text-muted-foreground">Min. 8 characters with uppercase, lowercase, number, and special character.</p>
              {errors.password && <p className="text-xs text-destructive" role="alert">{errors.password[0]}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required aria-required="true" aria-invalid={!!errors.confirmPassword} aria-describedby={errors.confirmPassword ? "cpw-err" : undefined} />
              {errors.confirmPassword && <p id="cpw-err" className="text-xs text-destructive" role="alert">{errors.confirmPassword[0]}</p>}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Creating account..." : "Create account"}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline underline-offset-4">Sign in</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
