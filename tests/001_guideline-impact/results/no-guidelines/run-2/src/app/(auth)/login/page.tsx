import { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Sign In - TaskFlow",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-muted)] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>Sign in to your TaskFlow account</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
        <CardFooter className="flex flex-col gap-2 text-center text-sm text-[var(--color-muted-foreground)]">
          <Link href="/forgot-password" className="hover:text-[var(--color-primary)]">
            Forgot your password?
          </Link>
          <span>
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-[var(--color-primary)] hover:underline">
              Sign up
            </Link>
          </span>
        </CardFooter>
      </Card>
    </main>
  );
}
