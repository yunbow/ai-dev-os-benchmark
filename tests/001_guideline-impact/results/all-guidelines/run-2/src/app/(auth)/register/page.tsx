import Link from "next/link";
import { RegisterForm } from "@/features/auth/components/register-form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Register - TaskFlow" };

export default function RegisterPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>Start managing tasks with TaskFlow</CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm />
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-foreground underline ml-1">
          Sign in
        </Link>
      </CardFooter>
    </Card>
  );
}
