"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/actions/auth";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);
    formData.set("token", token);

    const result = await resetPassword(formData);

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

    toast.success("Password reset successfully. Please sign in.");
    router.push("/login");
  }

  if (!token) {
    return (
      <p role="alert" className="text-sm text-[var(--color-destructive)]">
        Invalid or missing reset token. Please request a new reset link.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {errors.root && (
        <p role="alert" className="text-sm text-[var(--color-destructive)]">
          {errors.root}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="password">New Password</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" aria-invalid={!!errors.password} />
        {errors.password && <p role="alert" className="text-xs text-[var(--color-destructive)]">{errors.password}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" aria-invalid={!!errors.confirmPassword} />
        {errors.confirmPassword && <p role="alert" className="text-xs text-[var(--color-destructive)]">{errors.confirmPassword}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={pending} aria-busy={pending}>
        {pending ? "Resetting..." : "Reset password"}
      </Button>
    </form>
  );
}
