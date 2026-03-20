import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";
import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Reset password</h2>
      <p className="text-gray-600 mb-6 text-sm">
        Enter your email address and we&apos;ll send you a reset link.
      </p>
      <ForgotPasswordForm />
      <p className="mt-4 text-center text-sm text-gray-600">
        <Link href="/login" className="text-blue-600 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
