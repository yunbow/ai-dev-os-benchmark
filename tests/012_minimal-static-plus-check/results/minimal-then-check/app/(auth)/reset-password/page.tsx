import { notFound } from "next/navigation";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export const metadata = { title: "Reset Password - TaskFlow" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) notFound();

  return <ResetPasswordForm token={token} />;
}
