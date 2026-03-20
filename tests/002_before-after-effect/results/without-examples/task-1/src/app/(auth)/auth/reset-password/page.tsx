import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import Link from "next/link";
import { Suspense } from "react";

export const metadata = {
  title: "Reset Password - TaskFlow",
};

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Task<span className="text-blue-600">Flow</span>
          </h1>
          <p className="mt-2 text-gray-600">Reset your password</p>
        </div>
        <div className="bg-white rounded-xl border p-8 shadow-sm">
          <Suspense fallback={<div className="text-center text-gray-500">Loading...</div>}>
            <ResetPasswordForm />
          </Suspense>
          <div className="mt-6 text-center text-sm text-gray-500">
            Remember your password?{" "}
            <Link href="/auth/login" className="text-blue-600 hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
