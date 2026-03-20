"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorMessage } from "@/components/common/error-message";
import {
  ResetPasswordRequestSchema,
  type ResetPasswordRequestInput,
} from "../schema/auth-schema";
import { requestPasswordReset } from "../server/auth-actions";

export function ResetPasswordRequestForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordRequestInput>({
    resolver: zodResolver(ResetPasswordRequestSchema),
  });

  const onSubmit = async (data: ResetPasswordRequestInput) => {
    setServerError(null);
    try {
      const result = await requestPasswordReset(data);

      if (!result.success) {
        setServerError(result.error.message);
        return;
      }

      setSubmitted(true);
    } catch {
      setServerError("An unexpected error occurred. Please try again.");
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <CheckCircle2 className="h-12 w-12 text-green-500" />
        <h3 className="font-semibold text-gray-900">Check your email</h3>
        <p className="text-sm text-gray-600">
          If an account with that email exists, we&apos;ve sent a password reset link.
          The link expires in 1 hour.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <ErrorMessage message={serverError} />

      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          {...register("email")}
          aria-invalid={!!errors.email}
        />
        {errors.email && (
          <p className="text-xs text-red-600">{errors.email.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending reset link...
          </>
        ) : (
          "Send reset link"
        )}
      </Button>
    </form>
  );
}
