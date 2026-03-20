"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { resetPasswordAction } from "../server/auth-actions";
import { resetPasswordSchema, ResetPasswordInput } from "../schema/auth-schema";

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, password: "", confirmPassword: "" },
  });

  async function onSubmit(values: ResetPasswordInput) {
    setIsPending(true);
    const result = await resetPasswordAction(values);
    setIsPending(false);

    if (!result.success) {
      toast.error(result.error.message);
      return;
    }

    toast.success("Password reset successfully. Please sign in with your new password.");
    router.push("/login");
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>Enter your new password below</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
          <input type="hidden" {...form.register("token")} />

          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              disabled={isPending}
              {...form.register("password")}
              aria-describedby={form.formState.errors.password ? "password-error" : undefined}
            />
            {form.formState.errors.password && (
              <p id="password-error" className="text-sm text-destructive" role="alert">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              disabled={isPending}
              {...form.register("confirmPassword")}
              aria-describedby={
                form.formState.errors.confirmPassword ? "confirm-password-error" : undefined
              }
            />
            {form.formState.errors.confirmPassword && (
              <p id="confirm-password-error" className="text-sm text-destructive" role="alert">
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isPending} aria-busy={isPending}>
            {isPending ? "Resetting..." : "Reset password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
