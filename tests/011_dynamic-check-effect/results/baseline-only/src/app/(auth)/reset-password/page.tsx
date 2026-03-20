import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset Password",
};

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;
  const token = params.token;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">TF</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Set new password</h1>
          <p className="text-gray-600 mt-1">Enter your new password below</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border p-8">
          {token ? (
            <ResetPasswordForm token={token} />
          ) : (
            <div className="text-center py-4">
              <p className="text-red-600 font-medium">Invalid or missing reset token.</p>
              <Link href="/forgot-password" className="text-indigo-600 hover:underline text-sm mt-2 inline-block">
                Request a new reset link
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
