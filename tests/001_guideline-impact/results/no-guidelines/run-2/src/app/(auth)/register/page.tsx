import { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Create Account - TaskFlow",
};

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-muted)] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create an account</CardTitle>
          <CardDescription>Start managing tasks with your team</CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
        <CardFooter className="text-center text-sm text-[var(--color-muted-foreground)]">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[var(--color-primary)] hover:underline ml-1">
            Sign in
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
