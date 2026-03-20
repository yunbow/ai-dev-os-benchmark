import { Metadata } from "next";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = {
  title: "Create account - TaskFlow",
  description: "Create a new TaskFlow account",
};

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <RegisterForm />
    </main>
  );
}
