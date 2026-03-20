import Link from "next/link";
import { LoginForm } from "@/components/forms/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string; reset?: string; callbackUrl?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="rounded-lg bg-white p-8 shadow">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Sign in to TaskFlow</h1>

      {params.registered && (
        <div className="mb-4 rounded bg-green-50 p-3 text-sm text-green-700">
          Account created successfully. Please sign in.
        </div>
      )}
      {params.reset && (
        <div className="mb-4 rounded bg-green-50 p-3 text-sm text-green-700">
          Password reset successfully. Please sign in.
        </div>
      )}

      <LoginForm callbackUrl={params.callbackUrl} />

      <div className="mt-4 flex flex-col gap-2 text-sm text-gray-600">
        <Link href="/forgot-password" className="text-blue-600 hover:underline">
          Forgot your password?
        </Link>
        <span>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-blue-600 hover:underline">
            Sign up
          </Link>
        </span>
      </div>
    </div>
  );
}
