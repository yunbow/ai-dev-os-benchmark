"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Link from "next/link";
import { passwordResetRequestSchema, PasswordResetRequestInput } from "@/features/auth/schema/auth-schema";
import { requestPasswordReset } from "@/features/auth/server/auth-actions";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<PasswordResetRequestInput>({
    resolver: zodResolver(passwordResetRequestSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: PasswordResetRequestInput) {
    setIsLoading(true);
    try {
      const result = await requestPasswordReset(values);
      if (result.success) {
        setSubmitted(true);
      } else {
        toast.error(result.error.message);
      }
    } finally {
      setIsLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Check your email</h1>
        <p className="text-gray-600 mb-6">
          If an account exists for that email, we sent a password reset link.
        </p>
        <Link href="/login" className="text-blue-600 hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reset your password</h1>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            {...form.register("email")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {form.formState.errors.email && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? "Sending..." : "Send reset link"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm">
        <Link href="/login" className="text-blue-600 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
