import { Metadata } from "next";
import Link from "next/link";
import ResetPasswordForm from "@/features/auth/components/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Set New Password - TaskFlow",
};

export default async function ResetPasswordTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold tracking-tight text-gray-900">
            TaskFlow
          </h1>
          <h2 className="mt-6 text-center text-2xl font-semibold text-gray-700">
            Set new password
          </h2>
        </div>

        <ResetPasswordForm token={token} />

        <p className="text-center text-sm text-gray-600">
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
