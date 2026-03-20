import { notFound } from "next/navigation";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token } = await searchParams;

  if (!token) {
    notFound();
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <ResetPasswordForm token={token} />
    </main>
  );
}
