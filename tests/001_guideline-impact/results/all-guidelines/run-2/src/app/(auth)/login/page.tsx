import Link from "next/link";
import { LoginForm } from "@/features/auth/components/login-form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Login - TaskFlow" };

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Sign in to your TaskFlow account</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
      <CardFooter className="flex flex-col gap-2 text-sm text-muted-foreground">
        <p>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-foreground underline">
            Sign up
          </Link>
        </p>
        <p>
          <Link href="/forgot-password" className="text-foreground underline">
            Forgot password?
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
