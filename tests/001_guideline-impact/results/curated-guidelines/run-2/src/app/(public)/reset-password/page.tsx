import { redirect } from "next/navigation";
import { NewPasswordForm } from "@/features/auth/components/new-password-form";

export const metadata = {
  title: "Reset Password - TaskFlow",
};

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token } = await searchParams;

  if (!token) {
    redirect("/forgot-password");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <NewPasswordForm token={token} />
    </div>
  );
}
