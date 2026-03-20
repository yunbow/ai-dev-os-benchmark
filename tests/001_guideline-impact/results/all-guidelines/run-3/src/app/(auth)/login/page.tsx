import { Metadata } from "next";
import Link from "next/link";
import LoginForm from "@/features/auth/components/LoginForm";

export const metadata: Metadata = {
  title: "Sign In - TaskFlow",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold tracking-tight text-gray-900">
            TaskFlow
          </h1>
          <h2 className="mt-6 text-center text-2xl font-semibold text-gray-700">
            Sign in to your account
          </h2>
        </div>

        <LoginForm />

        <p className="text-center text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
