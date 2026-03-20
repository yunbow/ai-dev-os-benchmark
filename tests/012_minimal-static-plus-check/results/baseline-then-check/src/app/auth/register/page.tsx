"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { registerUser } from "@/lib/actions/auth";
import { toast } from "@/hooks/use-toast";
import { CheckSquare } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    if (formData.password !== formData.confirmPassword) {
      setFieldErrors({ confirmPassword: ["Passwords do not match"] });
      return;
    }

    startTransition(async () => {
      const fd = new FormData();
      fd.append("name", formData.name);
      fd.append("email", formData.email);
      fd.append("password", formData.password);

      const result = await registerUser(fd);

      if (result.success) {
        // Auto-login after registration
        const signInResult = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (signInResult?.error) {
          toast({
            title: "Account created",
            description: "Please sign in with your new account",
          });
          router.push("/auth/login");
        } else {
          toast({ title: "Welcome to TaskFlow!", description: "Your account has been created." });
          router.push("/dashboard");
          router.refresh();
        }
      } else {
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
        toast({
          title: "Registration failed",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <main
      id="main-content"
      className="min-h-screen flex items-center justify-center p-4 bg-muted/50"
    >
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-2xl">
            <CheckSquare className="h-8 w-8 text-primary" aria-hidden="true" />
            TaskFlow
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create your account</CardTitle>
            <CardDescription>
              Sign up to start managing your tasks
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit} noValidate>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="John Doe"
                  autoComplete="name"
                  aria-invalid={!!fieldErrors.name}
                  aria-describedby={fieldErrors.name ? "name-error" : undefined}
                />
                {fieldErrors.name && (
                  <p id="name-error" className="text-sm text-destructive" role="alert">
                    {fieldErrors.name[0]}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="email">
                  Email <span aria-hidden="true" className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, email: e.target.value }))
                  }
                  placeholder="you@example.com"
                  autoComplete="email"
                  aria-required="true"
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={fieldErrors.email ? "email-error" : "email-hint"}
                />
                {fieldErrors.email ? (
                  <p id="email-error" className="text-sm text-destructive" role="alert">
                    {fieldErrors.email[0]}
                  </p>
                ) : (
                  <p id="email-hint" className="text-xs text-muted-foreground">
                    Must be a unique email address
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="password">
                  Password <span aria-hidden="true" className="text-destructive">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, password: e.target.value }))
                  }
                  autoComplete="new-password"
                  aria-required="true"
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby="password-error password-hint"
                />
                {fieldErrors.password ? (
                  <p id="password-error" className="text-sm text-destructive" role="alert">
                    {fieldErrors.password[0]}
                  </p>
                ) : (
                  <p id="password-hint" className="text-xs text-muted-foreground">
                    Min 8 chars with uppercase, lowercase, number, and special character
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="confirmPassword">
                  Confirm Password{" "}
                  <span aria-hidden="true" className="text-destructive">*</span>
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, confirmPassword: e.target.value }))
                  }
                  autoComplete="new-password"
                  aria-required="true"
                  aria-invalid={!!fieldErrors.confirmPassword}
                  aria-describedby={
                    fieldErrors.confirmPassword ? "confirmPassword-error" : undefined
                  }
                />
                {fieldErrors.confirmPassword && (
                  <p id="confirmPassword-error" className="text-sm text-destructive" role="alert">
                    {fieldErrors.confirmPassword[0]}
                  </p>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Creating account..." : "Create account"}
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="text-primary hover:underline underline-offset-4"
                >
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </main>
  );
}
