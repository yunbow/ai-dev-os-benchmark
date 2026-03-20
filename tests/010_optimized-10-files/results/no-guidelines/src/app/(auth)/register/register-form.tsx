"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validations";
import { register as registerAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  function onSubmit(data: RegisterInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await registerAction(data);

      if (!result.success) {
        setServerError(result.error);
        return;
      }

      router.push("/login?registered=true");
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

          {/* Name */}
          <div className="space-y-1">
            <Label htmlFor="reg-name">
              Full Name <span aria-hidden="true" className="text-destructive">*</span>
            </Label>
            <Input
              id="reg-name"
              type="text"
              {...register("name")}
              placeholder="Jane Doe"
              autoComplete="name"
              aria-describedby={errors.name ? "reg-name-error" : undefined}
              aria-invalid={!!errors.name}
              aria-required="true"
              disabled={isPending}
            />
            {errors.name && (
              <p id="reg-name-error" className="text-xs text-destructive" role="alert">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1">
            <Label htmlFor="reg-email">
              Email <span aria-hidden="true" className="text-destructive">*</span>
            </Label>
            <Input
              id="reg-email"
              type="email"
              {...register("email")}
              placeholder="you@example.com"
              autoComplete="email"
              aria-describedby={errors.email ? "reg-email-error" : undefined}
              aria-invalid={!!errors.email}
              aria-required="true"
              disabled={isPending}
            />
            {errors.email && (
              <p id="reg-email-error" className="text-xs text-destructive" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1">
            <Label htmlFor="reg-password">
              Password <span aria-hidden="true" className="text-destructive">*</span>
            </Label>
            <Input
              id="reg-password"
              type="password"
              {...register("password")}
              placeholder="••••••••"
              autoComplete="new-password"
              aria-describedby="reg-password-requirements reg-password-error"
              aria-invalid={!!errors.password}
              aria-required="true"
              disabled={isPending}
            />
            <p id="reg-password-requirements" className="text-xs text-muted-foreground">
              Must be at least 8 characters with uppercase, lowercase, number, and special character.
            </p>
            {errors.password && (
              <p id="reg-password-error" className="text-xs text-destructive" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Creating account..." : "Create account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
