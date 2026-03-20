import { Suspense } from "react";
import { LoginForm } from "@/features/auth/components/LoginForm";

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { callbackUrl } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Suspense>
        <LoginForm callbackUrl={callbackUrl} />
      </Suspense>
    </main>
  );
}
