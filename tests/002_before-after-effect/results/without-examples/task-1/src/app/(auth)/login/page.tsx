import { LoginForm } from "@/components/auth/login-form";
import Link from "next/link";

export const metadata = {
  title: "Sign In - TaskFlow",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Task<span className="text-blue-600">Flow</span>
          </h1>
          <p className="mt-2 text-gray-600">Sign in to your account</p>
        </div>
        <div className="bg-white rounded-xl border p-8 shadow-sm">
          <LoginForm />
          <div className="mt-6 text-center text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="text-blue-600 hover:underline font-medium">
              Sign up
            </Link>
          </div>
          <div className="mt-2 text-center text-sm text-gray-500">
            <Link href="/auth/reset-password" className="text-blue-600 hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
