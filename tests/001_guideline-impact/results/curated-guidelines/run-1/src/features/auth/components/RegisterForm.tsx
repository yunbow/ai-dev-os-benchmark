"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { registerAction } from "../server/auth-actions";
import { registerSchema, RegisterInput } from "../schema/auth-schema";

export function RegisterForm() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(values: RegisterInput) {
    setIsPending(true);
    const result = await registerAction(values);
    setIsPending(false);

    if (!result.success) {
      if (result.error.fieldErrors) {
        Object.entries(result.error.fieldErrors).forEach(([field, messages]) => {
          form.setError(field as keyof RegisterInput, {
            type: "server",
            message: messages.join(", "),
          });
        });
      } else {
        toast.error(result.error.message);
      }
      return;
    }

    toast.success("Account created! Please sign in.");
    router.push("/login");
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>Get started with TaskFlow today</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              autoComplete="name"
              disabled={isPending}
              {...form.register("name")}
              aria-describedby={form.formState.errors.name ? "name-error" : undefined}
            />
            {form.formState.errors.name && (
              <p id="name-error" className="text-sm text-destructive" role="alert">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              disabled={isPending}
              {...form.register("email")}
              aria-describedby={form.formState.errors.email ? "email-error" : undefined}
            />
            {form.formState.errors.email && (
              <p id="email-error" className="text-sm text-destructive" role="alert">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
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
            <Label htmlFor="confirmPassword">Confirm Password</Label>
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
            {isPending ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
