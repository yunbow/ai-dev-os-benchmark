import { Suspense } from "react";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata = { title: "Sign In - TaskFlow" };

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="animate-pulse bg-white rounded-lg h-80" />}>
      <LoginForm />
    </Suspense>
  );
}
