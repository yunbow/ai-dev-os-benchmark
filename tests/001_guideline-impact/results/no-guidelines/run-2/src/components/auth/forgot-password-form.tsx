"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPassword } from "@/actions/auth";

export function ForgotPasswordForm() {
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);

    const formData = new FormData(e.currentTarget);
    const result = await forgotPassword(formData);

    setPending(false);

    if (result.success) {
      setSent(true);
    } else {
      toast.error(result.error);
    }
  }

  if (sent) {
    return (
      <div role="status" className="rounded-md bg-green-50 p-4 text-sm text-green-800">
        If an account with that email exists, a password reset link has been sent.
        Please check your inbox.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={pending} aria-busy={pending}>
        {pending ? "Sending..." : "Send reset link"}
      </Button>
    </form>
  );
}
