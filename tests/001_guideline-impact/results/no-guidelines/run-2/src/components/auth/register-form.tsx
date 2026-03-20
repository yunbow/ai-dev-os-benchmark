"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { register } from "@/actions/auth";

export function RegisterForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const result = await register(formData);

    if (!result.success) {
      const errs: Record<string, string> = {};
      if (result.details) {
        Object.entries(result.details).forEach(([k, v]) => {
          errs[k] = v[0] ?? "";
        });
      } else {
        errs.root = result.error;
      }
      setErrors(errs);
      setPending(false);
      return;
    }

    toast.success("Account created! Please sign in.");
    router.push("/login");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {errors.root && (
        <p role="alert" className="text-sm text-[var(--color-destructive)]">
          {errors.root}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input id="name" name="name" autoComplete="name" placeholder="Jane Doe" aria-invalid={!!errors.name} />
        {errors.name && <p role="alert" className="text-xs text-[var(--color-destructive)]">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={!!errors.email} />
        {errors.email && <p role="alert" className="text-xs text-[var(--color-destructive)]">{errors.email}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" aria-invalid={!!errors.password} />
        {errors.password && <p role="alert" className="text-xs text-[var(--color-destructive)]">{errors.password}</p>}
        <p className="text-xs text-[var(--color-muted-foreground)]">
          Min 8 chars with uppercase, lowercase, number, and special character.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" aria-invalid={!!errors.confirmPassword} />
        {errors.confirmPassword && <p role="alert" className="text-xs text-[var(--color-destructive)]">{errors.confirmPassword}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={pending} aria-busy={pending}>
        {pending ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}
