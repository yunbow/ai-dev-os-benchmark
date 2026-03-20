"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/tasks";
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  function onSubmit(data: LoginInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setServerError("Invalid email or password. Please try again.");
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {serverError && (
            <div
              role="alert"
              aria-live="assertive"
              className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive"
            >
              {serverError}
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="login-email">
              Email <span aria-hidden="true" className="text-destructive">*</span>
            </Label>
            <Input
              id="login-email"
              type="email"
              {...register("email")}
              placeholder="you@example.com"
              autoComplete="email"
              aria-describedby={errors.email ? "login-email-error" : undefined}
              aria-invalid={!!errors.email}
              aria-required="true"
              disabled={isPending}
            />
            {errors.email && (
              <p id="login-email-error" className="text-xs text-destructive" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="login-password">
                Password <span aria-hidden="true" className="text-destructive">*</span>
              </Label>
              <Link
                href="/forgot-password"
                className="text-xs text-primary hover:underline underline-offset-4"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="login-password"
              type="password"
              {...register("password")}
              placeholder="••••••••"
              autoComplete="current-password"
              aria-describedby={errors.password ? "login-password-error" : undefined}
              aria-invalid={!!errors.password}
              aria-required="true"
              disabled={isPending}
            />
            {errors.password && (
              <p id="login-password-error" className="text-xs text-destructive" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
