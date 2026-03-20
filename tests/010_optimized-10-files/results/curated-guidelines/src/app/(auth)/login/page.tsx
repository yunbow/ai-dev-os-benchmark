import { LoginForm } from "@/features/auth/components/login-form";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Sign in</h2>
      <LoginForm />
      <p className="mt-4 text-center text-sm text-gray-600">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-blue-600 hover:underline font-medium">
          Create one
        </Link>
      </p>
      <p className="mt-2 text-center text-sm text-gray-600">
        <Link href="/forgot-password" className="text-blue-600 hover:underline">
          Forgot your password?
        </Link>
      </p>
    </div>
  );
}
