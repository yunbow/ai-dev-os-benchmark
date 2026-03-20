import { RegisterForm } from "@/components/auth/register-form";
import Link from "next/link";

export const metadata = {
  title: "Create Account - TaskFlow",
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Task<span className="text-blue-600">Flow</span>
          </h1>
          <p className="mt-2 text-gray-600">Create your account</p>
        </div>
        <div className="bg-white rounded-xl border p-8 shadow-sm">
          <RegisterForm />
          <div className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-blue-600 hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
