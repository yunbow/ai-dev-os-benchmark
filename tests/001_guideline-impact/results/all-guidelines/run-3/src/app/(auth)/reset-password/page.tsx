import { Metadata } from "next";
import Link from "next/link";
import RequestResetForm from "@/features/auth/components/RequestResetForm";

export const metadata: Metadata = {
  title: "Reset Password - TaskFlow",
};

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold tracking-tight text-gray-900">
            TaskFlow
          </h1>
          <h2 className="mt-6 text-center text-2xl font-semibold text-gray-700">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        <RequestResetForm />

        <p className="text-center text-sm text-gray-600">
          Remember your password?{" "}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
