import Link from "next/link";
import { ForgotPasswordForm } from "@/components/forms/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="rounded-lg bg-white p-8 shadow">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Reset your password</h1>
      <p className="mb-6 text-sm text-gray-600">
        Enter your email address and we&apos;ll send you a reset link.
      </p>

      <ForgotPasswordForm />

      <p className="mt-4 text-sm text-gray-600">
        <Link href="/login" className="text-blue-600 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
