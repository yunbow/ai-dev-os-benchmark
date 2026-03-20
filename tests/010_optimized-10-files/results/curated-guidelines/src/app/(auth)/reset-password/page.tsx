import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import Link from "next/link";

export default function ResetPasswordPage() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Set new password</h2>
      <ResetPasswordForm />
      <p className="mt-4 text-center text-sm text-gray-600">
        <Link href="/login" className="text-blue-600 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
