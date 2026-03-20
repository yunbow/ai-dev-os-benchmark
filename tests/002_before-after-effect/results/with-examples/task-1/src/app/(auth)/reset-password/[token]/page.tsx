import { ResetPasswordForm } from "@/components/forms/reset-password-form";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Verify token is valid before showing the form
  const resetRecord = await prisma.passwordReset.findUnique({
    where: { token },
  });

  const isValid =
    resetRecord && !resetRecord.used && resetRecord.expiresAt > new Date();

  if (!isValid) {
    return (
      <div className="rounded-lg bg-white p-8 shadow text-center">
        <h1 className="text-xl font-bold text-gray-900">Invalid or expired link</h1>
        <p className="mt-2 text-sm text-gray-600">
          This password reset link is no longer valid.
        </p>
        <Link
          href="/forgot-password"
          className="mt-4 inline-block text-sm text-blue-600 hover:underline"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-8 shadow">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Set new password</h1>
      <ResetPasswordForm token={token} />
    </div>
  );
}
