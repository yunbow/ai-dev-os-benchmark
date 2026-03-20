"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { registerUser, loginUser } from "@/features/auth/server/auth-actions";
import { CheckSquare, Loader2, Check } from "lucide-react";

const PASSWORD_REQUIREMENTS = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "Uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "Number", test: (p: string) => /[0-9]/.test(p) },
  { label: "Special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const pw = formData.get("password") as string;

    const result = await registerUser({
      email,
      password: pw,
      name: formData.get("name") as string || undefined,
    });

    if (result.success) {
      // Auto-login after registration
      const loginResult = await loginUser({ email, password: pw });
      if (loginResult.success) {
        router.push("/dashboard");
        router.refresh();
      } else {
        router.push("/login");
      }
    } else {
      if (result.error.fieldErrors) {
        setFieldErrors(result.error.fieldErrors);
      }
      setError(result.error.message);
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">TaskFlow</span>
          </div>
          <p className="text-muted-foreground">Create your account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create account</CardTitle>
            <CardDescription>
              Sign up to start managing your tasks
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  autoComplete="name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  aria-describedby={fieldErrors.email ? "reg-email-error" : undefined}
                />
                {fieldErrors.email && (
                  <p id="reg-email-error" className="text-sm text-destructive">
                    {fieldErrors.email[0]}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-describedby="password-requirements"
                />

                {password.length > 0 && (
                  <ul
                    id="password-requirements"
                    className="mt-2 space-y-1"
                    aria-label="Password requirements"
                  >
                    {PASSWORD_REQUIREMENTS.map((req) => (
                      <li
                        key={req.label}
                        className={`flex items-center gap-1.5 text-xs ${
                          req.test(password)
                            ? "text-green-600"
                            : "text-muted-foreground"
                        }`}
                      >
                        <Check
                          className={`h-3 w-3 ${
                            req.test(password)
                              ? "text-green-600"
                              : "opacity-30"
                          }`}
                        />
                        {req.label}
                      </li>
                    ))}
                  </ul>
                )}

                {fieldErrors.password && (
                  <p className="text-sm text-destructive">
                    {fieldErrors.password[0]}
                  </p>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create account"
                )}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
