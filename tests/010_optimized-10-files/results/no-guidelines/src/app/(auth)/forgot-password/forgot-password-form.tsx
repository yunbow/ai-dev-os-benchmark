"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  passwordResetRequestSchema,
  passwordResetSchema,
  type PasswordResetRequestInput,
  type PasswordResetInput,
} from "@/lib/validations";
import {
  resetPasswordRequest,
  resetPassword,
} from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

function RequestResetForm() {
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordResetRequestInput>({
    resolver: zodResolver(passwordResetRequestSchema),
  });

  function onSubmit(data: PasswordResetRequestInput) {
    startTransition(async () => {
      await resetPasswordRequest(data.email);
      // Always show success to prevent user enumeration
      setSent(true);
    });
  }

  if (sent) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div
            role="status"
            aria-live="polite"
            className="text-center space-y-2"
          >
            <div className="rounded-full bg-green-100 w-12 h-12 flex items-center justify-center mx-auto">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="font-semibold">Check your email</h2>
            <p className="text-sm text-muted-foreground">
              If an account exists with that email, we&apos;ve sent a password
              reset link. Check your inbox and follow the instructions.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="reset-email">
              Email <span aria-hidden="true" className="text-destructive">*</span>
            </Label>
            <Input
              id="reset-email"
              type="email"
              {...register("email")}
              placeholder="you@example.com"
              autoComplete="email"
              aria-describedby={errors.email ? "reset-email-error" : undefined}
              aria-invalid={!!errors.email}
              aria-required="true"
              disabled={isPending}
            />
            {errors.email && (
              <p id="reset-email-error" className="text-xs text-destructive" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Sending..." : "Send reset link"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ResetPasswordForm({ token }: { token: string }) {
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordResetInput>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: { token },
  });

  function onSubmit(data: PasswordResetInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await resetPassword(data.token, data.password);
      if (!result.success) {
        setServerError(result.error);
      } else {
        setSuccess(true);
      }
    });
  }

  if (success) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div role="status" aria-live="polite" className="text-center space-y-2">
            <div className="rounded-full bg-green-100 w-12 h-12 flex items-center justify-center mx-auto">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="font-semibold">Password reset successful</h2>
            <p className="text-sm text-muted-foreground">
              Your password has been updated. You can now sign in with your new password.
            </p>
            <Button asChild className="mt-2">
              <a href="/login">Go to sign in</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
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

          <input type="hidden" {...register("token")} />

          <div className="space-y-1">
            <Label htmlFor="new-password">
              New Password <span aria-hidden="true" className="text-destructive">*</span>
            </Label>
            <Input
              id="new-password"
              type="password"
              {...register("password")}
              placeholder="••••••••"
              autoComplete="new-password"
              aria-describedby="new-password-requirements new-password-error"
              aria-invalid={!!errors.password}
              aria-required="true"
              disabled={isPending}
            />
            <p id="new-password-requirements" className="text-xs text-muted-foreground">
              At least 8 characters with uppercase, lowercase, number, and special character.
            </p>
            {errors.password && (
              <p id="new-password-error" className="text-xs text-destructive" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Resetting..." : "Reset password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  if (token) {
    return <ResetPasswordForm token={token} />;
  }

  return <RequestResetForm />;
}
