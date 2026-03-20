import { PasswordResetForm } from "@/features/auth/components/password-reset-form";

export const metadata = {
  title: "Forgot Password - TaskFlow",
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <PasswordResetForm />
    </div>
  );
}
