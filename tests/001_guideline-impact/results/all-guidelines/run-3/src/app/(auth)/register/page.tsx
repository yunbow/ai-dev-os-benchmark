import { Metadata } from "next";
import Link from "next/link";
import RegisterForm from "@/features/auth/components/RegisterForm";

export const metadata: Metadata = {
  title: "Create Account - TaskFlow",
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold tracking-tight text-gray-900">
            TaskFlow
          </h1>
          <h2 className="mt-6 text-center text-2xl font-semibold text-gray-700">
            Create your account
          </h2>
        </div>

        <RegisterForm />

        <p className="text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
