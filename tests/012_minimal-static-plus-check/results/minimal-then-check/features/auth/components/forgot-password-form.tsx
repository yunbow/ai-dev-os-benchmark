"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Link from "next/link";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/features/auth/schema";
import { requestPasswordReset } from "@/features/auth/server/actions";

export function ForgotPasswordForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(data: ForgotPasswordInput) {
    const result = await requestPasswordReset(data);
    if (!result.success) {
      toast.error(result.error);
    }
  }

  if (isSubmitSuccessful) {
    return (
      <div className="bg-white shadow rounded-lg p-8 text-center">
        <p className="text-green-600 font-medium">Check your email</p>
        <p className="text-gray-600 text-sm mt-2">
          If an account exists, we&apos;ve sent a password reset link.
        </p>
        <Link href="/login" className="mt-4 inline-block text-blue-600 hover:underline text-sm">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white shadow rounded-lg p-8 space-y-4"
      aria-label="Forgot password form"
    >
      <h2 className="text-xl font-semibold text-gray-900">Reset your password</h2>
      <p className="text-sm text-gray-600">
        Enter your email and we&apos;ll send you a reset link.
      </p>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          {...register("email")}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        {errors.email && (
          <p id="email-error" className="mt-1 text-xs text-red-600" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {isSubmitting ? "Sending..." : "Send reset link"}
      </button>

      <p className="text-sm text-center">
        <Link href="/login" className="text-blue-600 hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
