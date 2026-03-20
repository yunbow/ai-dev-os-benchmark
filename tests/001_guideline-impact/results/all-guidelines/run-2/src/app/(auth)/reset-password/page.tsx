import Link from "next/link";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Reset Password - TaskFlow" };

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Set new password</CardTitle>
        <CardDescription>Enter your new password below</CardDescription>
      </CardHeader>
      <CardContent>
        <ResetPasswordFormWrapper searchParams={searchParams} />
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        <Link href="/login" className="text-foreground underline">
          Back to sign in
        </Link>
      </CardFooter>
    </Card>
  );
}

async function ResetPasswordFormWrapper({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  if (!params.token) {
    return (
      <p className="text-sm text-destructive">
        Invalid or missing reset token. Please request a new password reset.
      </p>
    );
  }
  return <ResetPasswordForm token={params.token} />;
}
