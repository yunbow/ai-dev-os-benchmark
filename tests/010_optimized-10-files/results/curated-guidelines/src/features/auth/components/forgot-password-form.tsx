"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { RequestPasswordResetSchema, type RequestPasswordResetInput } from "../schema/auth-schema";
import { requestPasswordReset } from "../server/auth-actions";

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const form = useForm<RequestPasswordResetInput>({
    resolver: zodResolver(RequestPasswordResetSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: RequestPasswordResetInput) => {
    await requestPasswordReset(data);
    setSent(true);
  };

  if (sent) {
    return (
      <div className="text-center py-4">
        <p className="text-green-700 text-sm font-medium">
          If an account exists with that email, you&apos;ll receive a reset link shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          {...form.register("email")}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {form.formState.errors.email && (
          <p className="mt-1 text-xs text-red-600" role="alert">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={form.formState.isSubmitting}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {form.formState.isSubmitting ? "Sending..." : "Send reset link"}
      </button>
    </form>
  );
}
