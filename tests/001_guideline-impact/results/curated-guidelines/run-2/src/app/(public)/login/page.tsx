import { LoginForm } from "@/features/auth/components/login-form";

export const metadata = {
  title: "Sign In - TaskFlow",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <LoginForm />
    </div>
  );
}
