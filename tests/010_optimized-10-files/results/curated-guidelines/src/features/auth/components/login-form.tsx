"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LoginSchema, type LoginInput } from "../schema/auth-schema";
import { loginUser } from "../server/auth-actions";

export function LoginForm() {
  const router = useRouter();
  const form = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginInput) => {
    const result = await loginUser(data);
    if (!result.success) {
      toast.error(result.error.message);
      return;
    }
    router.push("/tasks");
    router.refresh();
  };

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
          aria-describedby={form.formState.errors.email ? "email-error" : undefined}
        />
        {form.formState.errors.email && (
          <p id="email-error" className="mt-1 text-xs text-red-600" role="alert">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          {...form.register("password")}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-describedby={form.formState.errors.password ? "password-error" : undefined}
        />
        {form.formState.errors.password && (
          <p id="password-error" className="mt-1 text-xs text-red-600" role="alert">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={form.formState.isSubmitting}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
