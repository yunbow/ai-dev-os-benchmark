# AI Dev OS 3-Condition Benchmark — Detailed Design Document

> Created: 2026-03-19
> Extracted from: [SNS Strategy & Profile Revision Plan §7](./sns_strategy_profile.md#7-beforeafter-ベンチマーク設計)
> Related: [Checklist Format Trial Plan](./checklist_trial_plan.md) / [Ecosystem Review R-1, M-6](./ecosystem_review.md)

---

## Table of Contents

1. [Benchmark Overview](#1-benchmark-overview)
2. [Definition of 3 Conditions](#2-definition-of-3-conditions)
3. [Requirements Specification (Benchmark App)](#3-requirements-specification-benchmark-app)
4. [Evaluation Criteria and Scoring Standards](#4-evaluation-criteria-and-scoring-standards)
5. [Expected Check Items (By Category)](#5-expected-check-items-by-category)
6. [Before/After Example Addition Plan and Measurement Methods](#6-beforeafter-example-addition-plan-and-measurement-methods)
7. [README Header Before/After Code Example Proposals](#7-readme-header-beforeafter-code-example-proposals)
8. [60-Second Demo GIF Content Design](#8-60-second-demo-gif-content-design)
9. [Execution Procedure and Reproducibility](#9-execution-procedure-and-reproducibility)
10. [Utilization of Results](#10-utilization-of-results)
11. [security.md Checklist Format Benchmark](#11-securitymd-checklist-format-benchmark)

---

## 1. Benchmark Overview

### 1.1 Purpose

| Purpose | Details |
|---------|---------|
| **Quantitative Proof** | Demonstrate numerically how much AI coding quality differs with and without AI Dev OS |
| **Identifying Optimal Rule Volume** | Measure whether "loading everything" vs "curated selection" is more effective |
| **Before/After Content Material** | Obtain concrete code diffs for use in README, articles, and demo GIFs |
| **Honest Analysis** | Report cases where guidelines have adverse effects, ensuring credibility |

### 1.2 Benchmark Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                   Benchmark Overview                          │
│                                                              │
│  [Input] Same requirements specification (task management app)│
│     │                                                        │
│     ├── Condition A: Requirements spec only                  │
│     ├── Condition B: Requirements spec + all guidelines (33 files)│
│     └── Condition C: Requirements spec + curated guidelines (10 files)│
│                                                              │
│  [Output] 3 implementation artifacts                         │
│     │                                                        │
│     └── Scored across 9 items, 100-point scale               │
│         ├── Visualized as radar chart                        │
│         ├── Code diff extracted per item                     │
│         └── Statistical significance verified (3 repetitions)│
│                                                              │
│  [By-products]                                               │
│     ├── Before/After code examples for README                │
│     ├── 60-second demo GIF material                          │
│     ├── Code diffs and charts for articles                   │
│     └── Identification of guidelines lacking Before/After examples│
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Definition of 3 Conditions

### 2.1 Condition List

| Condition | Included in Context | Token Estimate | Goal |
|-----------|-------------------|---------------|------|
| **A: Baseline** | Requirements spec only | ~2,000 | Measure "raw" output quality without guidelines |
| **B: Full Load** | Requirements spec + all 33 guidelines | ~25,000-30,000 | Verify whether "more is better" holds true |
| **C: Curated 10 Files** | Requirements spec + curated set per Two-Tier Context Strategy | ~8,000-10,000 | Measure the effectiveness of AI Dev OS recommended configuration |

### 2.2 Curated File Selection for Condition C

**Selection Criteria:** High scoring weight x Frequently mishandled by AI x Framework-specific important patterns

| # | File | Selection Rationale | Corresponding Evaluation Item |
|---|------|-------------------|------------------------------|
| 1 | `ai-coding.md` | Core of the Two-Tier Context Strategy. Common AI Pitfalls table | Cross-cutting across all items |
| 2 | `security.md` | Highest score allocation (20 points). Most overlooked area by AI | Security |
| 3 | `error-handling.md` | ActionResult pattern. Unified error handling | Error Handling |
| 4 | `validation.md` | Both client + server sides. Zod schema design | Validation |
| 5 | `server-actions.md` | Critical Next.js-specific patterns | Error Handling, Type Safety |
| 6 | `api.md` | Unified API design format | API Design |
| 7 | `naming.md` | Consistency is AI's weakest area | Naming Convention Consistency |
| 8 | `project-structure.md` | Directory structure standardization | Directory Structure |
| 9 | `code.md` | strict TypeScript, no `any` | Type Safety |
| 10 | `auth.md` | Authentication/authorization patterns. Avoiding overlap with security | Security |

### 2.3 Hypotheses to Verify

| # | Hypothesis | Verification Method |
|---|-----------|-------------------|
| H1 | C > A (Curated guidelines produce higher quality than baseline) | C total score > A total score |
| H2 | C >= B (Curated is equal to or better than full load) | C total score >= B total score |
| H3 | Some items in B score worse than A (evidence of attention dilution) | At least one item where B < A |
| H4 | Largest differences appear in Security and Validation | Diff in these items > diff in other items |
| H5 | Small differences in Naming Conventions and Directory Structure | Diff in these items < 5 points |

---

## 3. Requirements Specification (Benchmark App)

### 3.1 App Overview

**Task Management App (Extended Todo App)** — Deliberately designed to include requirements where quality differences are likely to emerge.

### 3.2 Tech Stack

| Technology | Version |
|-----------|---------|
| Next.js | 15 (App Router) |
| TypeScript | 5.x (strict mode) |
| Prisma | 6.x + PostgreSQL |
| NextAuth.js | v5 |
| Tailwind CSS | 4.x + shadcn/ui |
| Zod | 3.x |

### 3.3 Functional Requirements

#### F1: User Authentication

| Feature | Points Where Differences Are Likely |
|---------|--------------------------------------|
| Email/password registration | Password hashing, validation |
| Login/logout | Session management, CSRF protection |
| Password reset (email) | Token management, expiration, HTML escaping |
| Session management | Cookie settings (SameSite, Secure, HttpOnly) |

#### F2: Task Management (CRUD)

| Feature | Points Where Differences Are Likely |
|---------|--------------------------------------|
| Task creation | Server Action + ActionResult pattern |
| List view (filter & sort) | N+1 query prevention, pagination |
| Edit & delete | IDOR prevention (resource ownership check) |
| Status change | Optimistic UI updates, conflict control |
| Search | SQL injection prevention |

#### F3: Category Management

| Feature | Points Where Differences Are Likely |
|---------|--------------------------------------|
| CRUD | Input validation (color code format) |
| Color-coded display | XSS prevention (user-input color values) |

#### F4: Team Features

| Feature | Points Where Differences Are Likely |
|---------|--------------------------------------|
| Team creation | Permission model design (RBAC) |
| Member invitation (email) | Invitation token, email template safety |
| Task sharing & assignment | Authorization check (verify team membership) |
| Permission management | 3 tiers: Owner / Member / Viewer |

#### F5: API Design

| Feature | Points Where Differences Are Likely |
|---------|--------------------------------------|
| RESTful API | URL design, appropriate HTTP method usage |
| Error responses | Unified format, no internal information leakage |
| Pagination | Cursor-based vs offset-based |
| Rate limiting | Per-endpoint configuration |

### 3.4 Non-Functional Requirements

| Requirement | Points Where Differences Are Likely |
|-------------|--------------------------------------|
| Responsive design | Tailwind breakpoint consistency |
| Loading/error states | Proper use of Suspense/ErrorBoundary |
| Input validation | Both client + server sides |
| Accessibility | aria attributes, keyboard navigation |

---

## 4. Evaluation Criteria and Scoring Standards

### 4.1 Scoring Matrix

| # | Evaluation Item | Points | Weighting Rationale |
|---|----------------|--------|-------------------|
| 1 | Security | 20 | Most overlooked by AI + highest impact |
| 2 | Error Handling | 15 | Major difference based on ActionResult pattern adoption |
| 3 | Validation | 15 | Major difference based on dual-side validation |
| 4 | Naming Convention Consistency | 10 | Cross-file consistency is an AI weakness |
| 5 | Directory Structure | 10 | Adherence to standard structure |
| 6 | API Design | 10 | RESTful compliance, response format consistency |
| 7 | Type Safety | 10 | Number of `any` usages, type definition coverage |
| 8 | Performance | 5 | N+1 queries, unnecessary re-renders |
| 9 | Accessibility | 5 | aria attributes, keyboard navigation |
| | **Total** | **100** | |

### 4.2 Detailed Scoring Criteria (5 Levels)

Each item is scored on a 5-level scale and pro-rated to its point allocation.

| Score | Criteria | Meaning |
|-------|----------|---------|
| 5 | All check items satisfied | Perfect |
| 4 | 80%+ of check items satisfied | Nearly perfect |
| 3 | 60-79% of check items satisfied | Acceptable |
| 2 | 40-59% of check items satisfied | Insufficient |
| 1 | Less than 40% of check items satisfied | Critical issues |

**Formula:** `Item score = (Score / 5) x Points`

---

## 5. Expected Check Items (By Category)

### 5.1 Security (20 Points)

| # | Check Item | Relevant Feature | Commonly Overlooked by AI? |
|---|-----------|-----------------|---------------------------|
| S1 | Password hashed with bcrypt/argon2 | F1 | ★★☆ |
| S2 | CSRF protection implemented (SameSite Cookie or token) | F1 | ★★★ |
| S3 | Session cookie has `Secure`, `HttpOnly`, `SameSite=Lax` set | F1 | ★★★ |
| S4 | Password reset token has an expiration time | F1 | ★★☆ |
| S5 | SQL injection prevention (using Prisma parameterized queries) | F2 | ★☆☆ |
| S6 | IDOR prevention: resource ownership check on task operations | F2 | ★★★ |
| S7 | XSS prevention: user input escaping | F3 | ★★☆ |
| S8 | HTML escaping in invitation email templates | F4 | ★★★ |
| S9 | Invitation token is a cryptographically secure random value | F4 | ★★☆ |
| S10 | API error responses do not contain internal info (stack trace, error.message) | F5 | ★★★ |
| S11 | Rate limiting applied to authentication endpoints | F5 | ★★★ |
| S12 | Secrets managed via environment variables (no hardcoding) | Overall | ★☆☆ |

### 5.2 Error Handling (15 Points)

| # | Check Item | Relevant Feature | Commonly Overlooked by AI? |
|---|-----------|-----------------|---------------------------|
| E1 | Server Action returns ActionResult pattern (`{ success, data, error }`) | F2 | ★★★ |
| E2 | try-catch at appropriate granularity (not wrapping entire functions) | Overall | ★★☆ |
| E3 | Error messages separated between user-facing and logging | Overall | ★★★ |
| E4 | Next.js `error.tsx` placed in each route segment | Overall | ★★☆ |
| E5 | `not-found.tsx` properly placed | Overall | ★☆☆ |
| E6 | Fallback implemented for database errors | F2 | ★★☆ |
| E7 | Rollback handling when optimistic updates fail | F2 | ★★★ |
| E8 | Unified error format for API responses | F5 | ★★☆ |

### 5.3 Validation (15 Points)

| # | Check Item | Relevant Feature | Commonly Overlooked by AI? |
|---|-----------|-----------------|---------------------------|
| V1 | Zod schemas defined on the server side | Overall | ★☆☆ |
| V2 | Same Zod schema shared between client and server | Overall | ★★★ |
| V3 | Form validation works on the client side too | F1, F2 | ★★☆ |
| V4 | Email address format validation exists | F1 | ★☆☆ |
| V5 | Password strength check exists (minimum length, complexity) | F1 | ★★☆ |
| V6 | Color code validation exists | F3 | ★★★ |
| V7 | Pagination parameter validation exists | F5 | ★★★ |
| V8 | Search query length limit exists | F2 | ★★★ |
| V9 | Date format and range validation exists (for deadlines) | F2 | ★★☆ |

### 5.4 Naming Convention Consistency (10 Points)

| # | Check Item | Commonly Overlooked by AI? |
|---|-----------|---------------------------|
| N1 | File names consistently use kebab-case | ★★☆ |
| N2 | Component names consistently use PascalCase | ★☆☆ |
| N3 | Variable and function names consistently use camelCase | ★☆☆ |
| N4 | Database column names consistently use snake_case | ★★☆ |
| N5 | API endpoints consistently use kebab-case | ★★☆ |
| N6 | Boolean variables start with `is`, `has`, `can` | ★★☆ |
| N7 | Event handlers follow `handle` + noun + verb pattern | ★★★ |
| N8 | Server Actions start with a verb (`createTask`, `updateTask`) | ★★☆ |

### 5.5 Directory Structure (10 Points)

| # | Check Item | Commonly Overlooked by AI? |
|---|-----------|---------------------------|
| D1 | App Router structure is appropriate (`app/`, `(group)/` usage) | ★☆☆ |
| D2 | Feature-based separation using features/ directory | ★★★ |
| D3 | Shared components placed in `components/ui/` | ★★☆ |
| D4 | Server Actions placed in `actions/` or `app/**/actions.ts` | ★★☆ |
| D5 | Prisma schema located at `prisma/schema.prisma` | ★☆☆ |
| D6 | Zod schemas co-located with Server Actions / API Routes | ★★★ |
| D7 | lib/ directory has clear responsibilities (utilities vs business logic) | ★★★ |

### 5.6 API Design (10 Points)

| # | Check Item | Commonly Overlooked by AI? |
|---|-----------|---------------------------|
| A1 | URLs are RESTful (`/api/v1/tasks`, `/api/v1/teams/:id/members`) | ★★☆ |
| A2 | HTTP methods are appropriate (GET=read, POST=create, PUT=update, DELETE=delete) | ★☆☆ |
| A3 | Response format is unified (`{ data, error, meta }` etc.) | ★★★ |
| A4 | HTTP status codes are appropriate (201 Created, 404 Not Found, etc.) | ★★☆ |
| A5 | Pagination is implemented | ★★☆ |
| A6 | Content-Type is properly set | ★☆☆ |
| A7 | Authentication check exists for endpoints requiring auth | ★★☆ |

### 5.7 Type Safety (10 Points)

| # | Check Item | Commonly Overlooked by AI? |
|---|-----------|---------------------------|
| T1 | No usage of `any` | ★★★ |
| T2 | API response types are defined | ★★☆ |
| T3 | Prisma types are leveraged (no duplicate manual type definitions) | ★★☆ |
| T4 | Type casting with `as` is minimal | ★★★ |
| T5 | Exhaustive checks for union types (never check) exist | ★★★ |
| T6 | `null` / `undefined` handling is explicit (proper use of `??` `?.`) | ★★☆ |

### 5.8 Performance (5 Points)

| # | Check Item | Commonly Overlooked by AI? |
|---|-----------|---------------------------|
| P1 | No N+1 queries (using Prisma `include` / `select`) | ★★☆ |
| P2 | `use client` only applied to minimal necessary components | ★★★ |
| P3 | Images use `next/image` | ★☆☆ |
| P4 | Heavy components use `React.lazy` / dynamic import | ★★★ |

### 5.9 Accessibility (5 Points)

| # | Check Item | Commonly Overlooked by AI? |
|---|-----------|---------------------------|
| AC1 | Form elements have associated `<label>` | ★★☆ |
| AC2 | Buttons have appropriate `aria-label` (icon buttons) | ★★★ |
| AC3 | Modals/dialogs have `role="dialog"` and `aria-modal` | ★★★ |
| AC4 | All operations are possible using keyboard only | ★★★ |
| AC5 | Color contrast meets WCAG AA standards | ★★★ |

---

## 6. Before/After Example Addition Plan and Measurement Methods

### 6.1 Current Before/After Example Coverage

In parallel with running the benchmark, identify guidelines that do not yet have Before/After examples and measure their effectiveness.

#### 6.1.1 Coverage Survey Targets

| File | Before/After Examples | Priority |
|------|----------------------|----------|
| `common/security.md` | To be confirmed | ★★★ (highest score allocation) |
| `common/error-handling.md` | To be confirmed | ★★★ |
| `common/validation.md` | To be confirmed | ★★★ |
| `common/naming.md` | To be confirmed | ★★☆ |
| `common/code.md` | To be confirmed | ★★☆ |
| `common/performance.md` | To be confirmed | ★☆☆ |
| `common/logging.md` | To be confirmed | ★☆☆ |
| `common/testing.md` | To be confirmed | ★☆☆ |
| `common/i18n.md` | To be confirmed | ★☆☆ |
| `common/cors.md` | To be confirmed | ★☆☆ |
| `common/env.md` | To be confirmed | ★☆☆ |
| `common/rate-limiting.md` | To be confirmed | ★☆☆ |
| `common/cicd.md` | To be confirmed | ☆☆☆ |
| `frameworks/nextjs/overview.md` | To be confirmed | ★☆☆ |
| `frameworks/nextjs/project-structure.md` | To be confirmed | ★☆☆ |
| `frameworks/nextjs/routing.md` | To be confirmed | ★☆☆ |
| `frameworks/nextjs/api.md` | To be confirmed | ★★☆ |
| `frameworks/nextjs/server-actions.md` | To be confirmed | ★★★ |
| `frameworks/nextjs/client-hooks.md` | To be confirmed | ★☆☆ |
| `frameworks/nextjs/form.md` | To be confirmed | ★★☆ |
| `frameworks/nextjs/state.md` | To be confirmed | ★☆☆ |
| `frameworks/nextjs/ui.md` | To be confirmed | ★☆☆ |
| `frameworks/nextjs/auth.md` | To be confirmed | ★★☆ |
| `frameworks/nextjs/database.md` | To be confirmed | ★★☆ |
| `frameworks/nextjs/middleware.md` | To be confirmed | ★☆☆ |
| `frameworks/nextjs/format.md` | To be confirmed | ☆☆☆ |
| `frameworks/nextjs/build.md` | To be confirmed | ☆☆☆ |

### 6.2 Before/After Example Effectiveness Measurement Method

#### 6.2.1 Measurement Design (A/B Test Approach)

Measure how AI output quality changes when Before/After examples are added versus not added.

```
┌──────────────────────────────────────────────────────────┐
│  Before/After Example Effectiveness Measurement           │
│                                                          │
│  [Target Guideline] security.md as the first measurement │
│  target                                                  │
│                                                          │
│  [2 Conditions]                                          │
│   D: Guideline (version without Before/After examples)   │
│   E: Guideline (version with Before/After examples)      │
│                                                          │
│  [Procedure]                                             │
│   1. Request code generation from D and E with same prompt│
│   2. Score generated code against check items            │
│   3. Analyze diff between D and E                        │
│   4. Confirm whether Before/After examples affected output│
│                                                          │
│  [Expected Results]                                      │
│   - Compliance rate improves for specific patterns       │
│     included in Before/After examples                    │
│   - Example: IDOR prevention Before/After → S6 check    │
│     pass rate increases                                  │
└──────────────────────────────────────────────────────────┘
```

#### 6.2.2 Specific Measurement Procedure

| Step | Content | Details |
|------|---------|---------|
| 1 | **Select target guideline** | Start with security.md (highest score allocation, 12 check items) |
| 2 | **Prepare version without Before/After examples** | Use the current guideline as-is |
| 3 | **Create version with Before/After examples** | Add Before/After code examples corresponding to check items S1-S12 |
| 4 | **Create prompts** | Define 5 tasks where security.md rules apply (selected from S1-S12 in §5.1) |
| 5 | **Execute with Condition D** | Run each task 3 times, score against check items |
| 6 | **Execute with Condition E** | Same as above |
| 7 | **Score & compare** | Compare compliance rates per item |
| 8 | **Determine** | Compliance rate improves by 10%+ = effective |

#### 6.2.3 Measurement Prompt Examples (for security.md)

| # | Task | Primary Check Items Measured |
|---|------|----------------------------|
| 1 | "Create a user profile update Server Action" | S6 (IDOR), V2 (dual-side validation) |
| 2 | "Implement a password reset email sending feature" | S4 (token expiration), S8 (HTML escaping), S9 (secure token) |
| 3 | "Create a task search API endpoint" | S5 (SQLi), S10 (information leakage), S11 (rate limiting) |
| 4 | "Implement a login endpoint" | S1 (hashing), S2 (CSRF), S3 (cookie settings), S11 (rate limiting) |
| 5 | "Implement a team member invitation email sending feature" | S8 (HTML escaping), S9 (secure token), S12 (environment variables) |

#### 6.2.4 Guidelines for Creating Before/After Examples

Criteria for good Before/After examples:

```
✅ Good examples:
- Before is realistic (code that AI would actually generate)
- After is specific (clearly shows what changed and how)
- Diff is minimal (1-3 line changes that demonstrate the effect)
- Comments explain "why"

❌ Bad examples:
- Before is extremely poor (code nobody would write)
- After is too long (code diff exceeding 10 lines)
- Diff between Before and After is too large to identify what matters
```

Example:

```typescript
// ❌ Before: Code that AI actually generates
export async function updateProfile(formData: FormData) {
  const userId = formData.get("userId") as string;
  await db.user.update({
    where: { id: userId },
    data: { name: formData.get("name") as string },
  });
}

// ✅ After: IDOR prevention + validation added
export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  const parsed = updateProfileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, error: parsed.error.flatten() };

  // ✅ Use userId from session (do not trust userId from form)
  await db.user.update({
    where: { id: session.user.id },
    data: { name: parsed.data.name },
  });
  return { success: true, data: null };
}
```

#### 6.2.5 Evaluation Criteria

| Result | Determination | Next Action |
|--------|--------------|-------------|
| With Before/After examples, compliance rate **+10% or more** | **Highly effective** | Add Before/After examples to all guidelines |
| With Before/After examples, compliance rate **+5-10%** | **Effective** | Prioritize adding to guidelines with 10+ point allocation |
| With Before/After examples, compliance rate **less than +5%** | **Not effective** | Defer Before/After example additions. Explore other approaches |

#### 6.2.6 Integration with 3-Condition Benchmark

The Before/After example measurement can be combined with the 3-condition benchmark (A/B/C):

```
                3-Condition Benchmark
                ┌─────────────┐
                │ A: None     │
                │ B: Full     │ ← Add conditions B', C' using versions
                │ C: Curated  │   with Before/After examples
                └─────────────┘

    Extension (optional):
    B': Full (without Before/After examples)  vs  B: Full (with Before/After examples)
    C': Curated (without Before/After examples)  vs  C: Curated (with Before/After examples)

    → Enables analysis of Before/After example effectiveness
      including interaction effects with guideline volume
```

However, since there is a risk of too many conditions, the recommended approach is a 2-phase method: first run the 3 conditions (A/B/C), then conduct the Before/After example measurement based on the results.

---

## 7. README Header Before/After Code Example Proposals

### 7.1 Purpose

Solve the problem identified in Ecosystem Review R-1: "README is theory-first and doesn't show 'what happens'."

**Current README header:**
```
4-layer model diagram → 15 classical theory table → Reader judges it as "academic project" and leaves
```

**Goal:**
```
Before/After code example (~10 lines) → "Oh, quality actually improves" → Reader continues
```

### 7.2 Five Specific Proposals

#### Proposal 1: Security (IDOR Prevention) — Most Likely to Show Difference

```markdown
## What changes?

**Without AI Dev OS** — AI generates code that "works" but has security holes:
```typescript
// ❌ AI-generated: Anyone can update any user's profile
export async function updateProfile(userId: string, data: FormData) {
  await db.user.update({ where: { id: userId }, data: { name: data.get("name") } });
}
```

**With AI Dev OS** — Same prompt, but AI follows your security guidelines:
```typescript
// ✅ AI-generated: Ownership verified, input validated, result typed
export async function updateProfile(data: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };
  const parsed = profileSchema.safeParse(Object.fromEntries(data));
  if (!parsed.success) return { success: false, error: parsed.error.flatten() };
  await db.user.update({ where: { id: session.user.id }, data: parsed.data });
  return { success: true, data: null };
}
```

> The difference isn't luck — it's [L3 guidelines](./spec/4-layer-model.md) that encode your team's security practices into enforceable rules.
```

**Selection Rationale:** Security resonates with all engineers. IDOR is serious yet easily overlooked, making the guideline's effect immediately visible.

---

#### Proposal 2: Error Handling (ActionResult Pattern)

```markdown
## What changes?

**Without AI Dev OS:**
```typescript
// ❌ try-catch hell, inconsistent error shapes
export async function createTask(data: FormData) {
  try {
    const task = await db.task.create({ data: { title: data.get("title") } });
    return task;
  } catch (e) {
    throw new Error("Failed to create task: " + e.message); // 💀 leaks internal info
  }
}
```

**With AI Dev OS:**
```typescript
// ✅ Typed ActionResult, no internal leak, consistent shape
export async function createTask(data: FormData): Promise<ActionResult<Task>> {
  const parsed = createTaskSchema.safeParse(Object.fromEntries(data));
  if (!parsed.success) return { success: false, error: "Invalid input" };
  const task = await db.task.create({ data: parsed.data });
  return { success: true, data: task };
}
```
```

**Selection Rationale:** Server Actions are directly relevant to Next.js users. The ActionResult pattern represents concrete value from AI Dev OS.

---

#### Proposal 3: Validation (Single-Side to Dual-Side)

```markdown
## What changes?

**Without AI Dev OS:**
```typescript
// ❌ Client-only validation — server trusts raw input
<input type="email" required />
// Server Action:
export async function invite(data: FormData) {
  await sendInvite(data.get("email") as string); // 💀 no server-side check
}
```

**With AI Dev OS:**
```typescript
// ✅ Shared Zod schema — validated on both sides
const inviteSchema = z.object({ email: z.string().email().max(255) });

// Client: <Form schema={inviteSchema} />
// Server:
export async function invite(data: FormData): Promise<ActionResult> {
  const parsed = inviteSchema.safeParse(Object.fromEntries(data));
  if (!parsed.success) return { success: false, error: "Invalid email" };
  await sendInvite(parsed.data.email);
  return { success: true, data: null };
}
```
```

**Selection Rationale:** "Client-only validation" is a common mistake from beginners to intermediate developers. The shared schema concept is fresh.

---

#### Proposal 4: Naming Convention Consistency

```markdown
## What changes?

**Without AI Dev OS** — AI generates inconsistent naming across files:
```typescript
// File 1: camelCase
const userData = await fetchUser(userId);
// File 2: snake_case
const task_list = await get_tasks(user_id);
// File 3: PascalCase for non-components
const TaskService = { GetAll: () => {} };
// API: mixed
GET /api/getUserTasks    // ❌ camelCase
POST /api/create-task    // ❌ kebab-case (inconsistent with above)
```

**With AI Dev OS:**
```typescript
// All files: consistent conventions
const userData = await fetchUser(userId);     // ✅ camelCase for variables
const taskList = await getTasks(userId);      // ✅ same
GET /api/v1/users/:id/tasks                   // ✅ RESTful, kebab-case
POST /api/v1/tasks                            // ✅ consistent
```
```

**Selection Rationale:** Naming consistency is one of the most frequently raised items in code reviews. The difference is visually obvious.

---

#### Proposal 5: Composite (Most Effective, Recommended)

```markdown
## What changes?

Same prompt. Same AI model. Different output quality.

| Aspect | Without AI Dev OS | With AI Dev OS |
|--------|------------------|----------------|
| Security | `userId` from form input (IDOR) | `session.user.id` from auth |
| Validation | Client-only `required` | Shared Zod schema, both sides |
| Error handling | `throw new Error(e.message)` | `ActionResult<T>` typed return |
| Naming | `get_tasks` / `GetAll` / `fetchUser` | Consistent `camelCase` everywhere |
| API errors | `{ message: error.stack }` | `{ error: "Not found" }` (no leak) |

> AI Dev OS doesn't replace your AI assistant — it gives it your team's **tacit knowledge** as explicit, enforceable rules.
```

**Selection Rationale:** Table format displays 5 differences at a glance. Readers can easily feel "this applies to my code too."

### 7.3 Recommended Configuration

**Adoption priority:**

| Priority | Proposal | Rationale |
|----------|----------|-----------|
| 1st | **Proposal 5 (Composite Table)** | Shows multiple values in a single figure. Minimal scrolling |
| 2nd | **Proposal 1 (Security)** | Shows the most critical issue with concrete code. Highly persuasive |
| 3rd | **Proposals 1 + 5 Combined** | Code example (Proposal 1) → Table (Proposal 5) → Details below |

**README restructuring concept:**

```markdown
# AI Dev OS

> Write coding rules once, enforce across Claude Code / Cursor / Kiro.

## What changes?              ← NEW: Before/After first
(Proposal 5 table or Proposal 1 code example)

## Quick Start                ← 2nd: Try it immediately
(3-step installation instructions)

## How it works               ← 3rd: Overview of the mechanism
(Concise 4-layer model explanation)

## Ecosystem                  ← 4th: Repository list
(Roles of 7 repositories)

## Theory                     ← Moved lower: For those interested in theory
(Classical theory tables, etc.)
```

---

## 8. 60-Second Demo GIF Content Design

### 8.1 Demo GIF Purpose

| Purpose | Details |
|---------|---------|
| **Instant Understanding** | Visually convey "what it can do" the moment someone opens the README |
| **Conveying the Experience** | Show the "actual development experience" that text cannot communicate |
| **Call to Action** | Make viewers think "I want to try this" and guide them to Quick Start |

### 8.2 Demo GIF Structure Proposals (5 Patterns)

#### Pattern A: Setup → Code Generation → Check (Recommended)

**Overview:** Show the entire flow from 0 to working in 60 seconds

```
[0:00-0:10] Setup
  $ git submodule add ... .ai-dev-os/rules
  $ git submodule add ... .ai-dev-os/plugin
  ✔ Added submodules

[0:10-0:30] Request code generation from AI (Claude Code chat screen)
  User: "Create a user profile update Server Action"
  AI: (code being generated — 5-second fast forward)
  → Code output with ActionResult pattern, IDOR prevention, Zod validation

[0:30-0:50] Run check command
  User: /ai-dev-os-check
  AI:
    ✔ Security: IDOR prevention verified
    ✔ Validation: Zod schema shared between client/server
    ✔ Error handling: ActionResult pattern used
    ⚠ Performance: Consider adding React.cache()

    Score: 9/10 guidelines passed

[0:50-0:60] Results summary
  Text overlay:
  "Write rules once. Enforce across Claude Code / Cursor / Kiro."
  → github.com/yunbow/ai-dev-os
```

**Selection Rationale:** The 3 stages of init → generate → check convey end-to-end value.

---

#### Pattern B: Before/After Comparison

**Overview:** Compare output with and without guidelines side by side using the same prompt

```
[0:00-0:05] Title: "Same prompt. Different quality."

[0:05-0:25] Left panel: Without AI Dev OS
  User: "Create login endpoint"
  AI: (code generation — fast forward)
  → Wraps everything in try-catch, no rate limiting, stack trace in error messages

[0:25-0:45] Right panel: With AI Dev OS
  User: "Create login endpoint" (same prompt)
  AI: (code generation — fast forward)
  → ActionResult, rate limiting, no error information leakage, session cookie settings

[0:45-0:55] Diff highlight
  Highlight differences between left and right

[0:55-0:60] CTA
  "Get started: npx ai-dev-os init"
```

---

#### Pattern C: Focus on Check Command

**Overview:** Center on the `/ai-dev-os-check` output results. Emphasize custom command value.

```
[0:00-0:10] Context setup (text overlay)
  "You wrote some code with AI. Is it good enough?"

[0:10-0:35] Run /ai-dev-os-check
  User: /ai-dev-os-check
  AI:
    Checking against AI Dev OS guidelines...

    📋 Security (security.md)
      ✔ No hardcoded secrets
      ✔ IDOR prevention: resource ownership verified
      ✖ Rate limiting: not applied to /api/auth/login
      ✖ CSP nonce: missing in middleware

    📋 Error Handling (error-handling.md)
      ✔ ActionResult pattern used
      ✔ No internal error exposure
      ✖ Missing error.tsx in /app/dashboard/

    📋 Validation (validation.md)
      ✔ Zod schemas defined
      ✖ Client-side validation missing for invite form

    Summary: 6/10 passed | 4 issues found

    Suggested fixes:
    1. Add rate limiter to /api/auth/login (see security.md §3.2)
    2. Add CSP nonce middleware (see security.md §3.4)
    3. Create /app/dashboard/error.tsx
    4. Add client validation to InviteForm

[0:35-0:55] AI applies fixes
  User: "Fix all 4 issues"
  AI: (fix code generation — fast forward)
  ✔ All 4 issues resolved

[0:55-0:60] Re-check
  User: /ai-dev-os-check
  AI: Summary: 10/10 passed ✔
```

**Selection Rationale:** Conveys the value of `/ai-dev-os-check` most concretely. The "check → fix → re-check" cycle is the product's core.

---

#### Pattern D: Dashboard-Style Scan Results Display

**Overview:** Show the `/ai-dev-os-scan` full project scan results

```
[0:00-0:10] Scan entire project
  User: /ai-dev-os-scan
  AI: Scanning project against 28 guidelines...

[0:10-0:40] Results display
  ┌─────────────────────────────────────────────┐
  │  AI Dev OS Scan Report                      │
  │                                             │
  │  Files scanned: 47                          │
  │  Guidelines checked: 28                     │
  │                                             │
  │  ✔ Passed: 23 (82%)                        │
  │  ⚠ Warnings: 3                             │
  │  ✖ Violations: 2                           │
  │                                             │
  │  Top issues:                                │
  │  1. [CRITICAL] No rate limiting on auth     │
  │  2. [HIGH] Missing error boundary in 3 routes│
  │  3. [MEDIUM] Inconsistent naming in lib/    │
  └─────────────────────────────────────────────┘

[0:40-0:55] JSON output mode
  User: /ai-dev-os-scan --format json
  → JSON output displayed for CI/CD usage

[0:55-0:60] CTA
```

---

#### Pattern E: Initialization Wizard (Future CLI Version)

**Overview:** Interactive setup with `npx ai-dev-os init`

```
[0:00-0:40] CLI initialization
  $ npx ai-dev-os init
  ? Select rules: typescript
  ? Select plugin: claude-code
  ✔ Added 3 submodules
  ✔ Generated CLAUDE.md
  ✔ Merged hooks

[0:40-0:60] First check run
  → Shows /ai-dev-os-check running immediately
```

### 8.3 Recommended Patterns and Priority

| Priority | Pattern | Rationale |
|----------|---------|-----------|
| **1st** | **C: Focus on Check Command** | Most succinctly conveys AI Dev OS's most unique value (check → fix → re-check) |
| **2nd** | **A: Setup → Generation → Check** | Shows the entire flow, but difficult to fit within 60 seconds |
| **3rd** | **B: Before/After Comparison** | High visual impact, but split-screen is hard to read on small screens |
| Deferred | D: Scan | Report screen is "view only." Doesn't convey the interactive experience |
| Future | E: CLI | To be created after CLI tool development |

### 8.4 Demo GIF Production Technical Considerations

| Item | Recommended | Alternative |
|------|------------|-------------|
| Recording tool | [Terminalizer](https://github.com/faressoft/terminalizer) | [asciinema](https://asciinema.org/) + [svg-term](https://github.com/marionebl/svg-term-cli) |
| Format | GIF (GitHub README compatible) | SVG (lightweight but compatibility issues) |
| Resolution | 80 columns x 24 rows | — |
| Font | JetBrains Mono | Fira Code |
| Speed adjustment | Typing at high speed (50ms/char), results at normal speed | — |
| Size limit | Under 5MB (GitHub recommended) | — |
| Color theme | One Dark (dark background, looks good on GitHub) | Dracula |

### 8.5 Demo GIF Script (Pattern C Detailed Version)

Pre-scripted commands to execute during recording, along with expected output:

```yaml
# demo-script.yaml
title: "AI Dev OS — Check & Fix in 60 seconds"
theme: one-dark
cols: 100
rows: 28

frames:
  - type: text-overlay
    duration: 3s
    content: "You wrote code with AI. Is it following your rules?"

  - type: command
    delay: 1s
    input: "/ai-dev-os-check"
    typing_speed: 80ms

  - type: output
    delay: 500ms
    content: |
      Checking against AI Dev OS guidelines...

      📋 Security (security.md)
        ✔ No hardcoded secrets
        ✔ IDOR prevention: resource ownership verified
        ✖ Rate limiting: not applied to /api/auth/login
        ✖ CSP nonce: missing in middleware

      📋 Error Handling (error-handling.md)
        ✔ ActionResult pattern used
        ✔ No internal error exposure
        ✖ Missing error.tsx in /app/dashboard/

      📋 Validation (validation.md)
        ✔ Zod schemas defined
        ✖ Client-side validation missing for invite form

      Summary: 6/10 passed | 4 issues found

  - type: pause
    duration: 3s
    highlight: "4 issues found"

  - type: command
    delay: 1s
    input: "Fix all 4 issues"
    typing_speed: 60ms

  - type: output
    delay: 500ms
    speed: fast
    content: |
      I'll fix all 4 issues:

      1. Adding rate limiter to /api/auth/login...
         ✔ Created src/lib/rate-limit.ts
         ✔ Applied to /api/auth/login/route.ts

      2. Adding CSP nonce middleware...
         ✔ Updated src/middleware.ts

      3. Creating error boundary...
         ✔ Created app/dashboard/error.tsx

      4. Adding client-side validation...
         ✔ Updated components/InviteForm.tsx

  - type: command
    delay: 1s
    input: "/ai-dev-os-check"
    typing_speed: 80ms

  - type: output
    delay: 500ms
    content: |
      Checking against AI Dev OS guidelines...

      📋 Security: ✔ All passed
      📋 Error Handling: ✔ All passed
      📋 Validation: ✔ All passed

      Summary: 10/10 passed ✔

  - type: text-overlay
    duration: 3s
    content: |
      AI Dev OS — Write rules once, enforce everywhere.
      github.com/yunbow/ai-dev-os
```

---

## 9. Execution Procedure and Reproducibility

### 9.1 Execution Procedure

```
Phase 1: Preparation (1 day)
  ├── [ ] Finalize requirements specification (based on §3 of this document)
  ├── [ ] Create context files for 3 conditions
  │     ├── A: requirements.md only
  │     ├── B: requirements.md + all 33 guidelines
  │     └── C: requirements.md + curated 10 guidelines
  ├── [ ] Create evaluation sheet (spreadsheet of §5 check items)
  └── [ ] Create prompt template for reproducibility

Phase 2: Benchmark Execution (2-3 days)
  ├── [ ] Implement with Condition A (3 repetitions) → Score
  ├── [ ] Implement with Condition B (3 repetitions) → Score
  ├── [ ] Implement with Condition C (3 repetitions) → Score
  ├── [ ] Record token consumption
  └── [ ] Aggregate and analyze results

Phase 3: Before/After Example Effectiveness Measurement (1-2 days)
  ├── [ ] Identify guidelines lacking Before/After examples (§6.1)
  ├── [ ] Add Before/After examples to security.md
  ├── [ ] Measure with Conditions D and E (§6.2)
  └── [ ] Determine rollout to other guidelines based on results

Phase 4: Deliverable Creation (1-2 days)
  ├── [ ] Select and place Before/After examples for README (§7)
  ├── [ ] Record demo GIF (§8)
  ├── [ ] Create radar chart
  ├── [ ] Extract code diffs for articles
  └── [ ] Create ai-dev-os-benchmark repository (publish all code)
```

### 9.2 Ensuring Reproducibility

| Element | Method |
|---------|--------|
| Model pinning | Use Claude Sonnet 4 (claude-sonnet-4-20250514). Record model ID |
| Prompt pinning | Save all prompts as template files |
| Temperature | 0 (deterministic output). However, measure variance across 3 repetitions |
| Guideline version | Record the git commit hash used |
| Evaluator bias | Mechanical scoring based on checklists. Subjective items scored independently by 2 evaluators |

### 9.3 Statistical Reliability

| Design Element | Value |
|---------------|-------|
| Number of conditions | 3 (A, B, C) |
| Number of repetitions | 3 per condition |
| Total executions | 9 (+ 6 for Before/After measurement = 15) |
| Evaluation items | 9 items x 73 check items |
| Significance testing | Statistical testing is difficult with 3 repetitions. Report using descriptive statistics (mean, range) |

---

## 10. Utilization of Results

### 10.1 Deliverables and Utilization Mapping

| Deliverable | Utilization | Corresponding Issue |
|------------|-------------|-------------------|
| Before/After examples for README | ai-dev-os core README header | R-1: Theory-first |
| 60-second demo GIF | README top, X pinned post | R-1: "What happens" is not visible |
| Radar chart | Zenn article #5, X share images | M-6: No real usage examples |
| Per-item code diffs | Qiita articles #4 and #5, Zenn article #5 | M-6: No Before/After |
| 3-condition total scores | Badges on each repository README | M-6: Quantitative evidence |
| Before/After example effectiveness measurement results | Guideline improvement roadmap | QW-1: Add Before/After to all L3 |
| Full benchmark code | `ai-dev-os-benchmark` repository | Ensuring reproducibility |
| Check item list (§5) | Improving `ai-dev-os-check` skill | R-5: CI-level enforcement |

### 10.2 Expansion into Articles

| Article | Material from Benchmark |
|---------|------------------------|
| [Qiita] #4 How to Reduce Security Vulnerabilities | S1-S12 check results + Before/After code |
| [Zenn] #5 Before/After Benchmark Publication | Radar chart + full item analysis |
| [Qiita] #8 Adverse Effects of Rule Volume | Condition B vs Condition C comparison data |
| [X] Pinned post | Radar chart image + 60-second demo GIF |

### 10.3 Relationship with Checklist Format Benchmark

The security.md checklist format benchmark in §11 and this benchmark (§1-9) have the following relationship:

| Aspect | This Benchmark (§1-9) | Checklist Format Benchmark (§11) |
|--------|----------------------|--------------------------------|
| Purpose | Measure overall AI Dev OS effectiveness | Measure effectiveness of YAML frontmatter / Quick Rules |
| Scope | All 9 evaluation items x 73 check items | security.md's 28 rules only |
| Conditions | A (none) / B (full) / C (curated) | A (current prose) / B (YAML added) / C (YAML + Quick Rules) |
| Timing | Execute first | Execute after this benchmark |

**Execution Order:**
1. Execute this benchmark (3 conditions, §1-9) first → Confirm overall AI Dev OS effectiveness
2. Adjust checklist format benchmark (§11) conditions based on results
3. Execute checklist format benchmark (§11) → Optimize guideline format

---

## 11. security.md Checklist Format Benchmark

> Integrated from: [checklist_trial_plan.md](./checklist_trial_plan.md)
> Related: [Checklist Format Analysis](./checklist_first_analysis.md)

### 11.1 Overview

Measure the effect on AI output quality when YAML frontmatter and Quick Rules summary are added to security.md (505 lines, 28 rules).

**Target file:** `ai-dev-os-rules-typescript/03_guidelines/common/security.md`

### 11.2 Definition of 3 Conditions

| Condition | Content | security.md Format |
|-----------|---------|-------------------|
| **A: Current State** | Current prose format (control group) | No changes |
| **B: YAML Only** | Method A (YAML frontmatter) added | YAML frontmatter + existing body |
| **C: YAML + Quick Rules** | Both Method A + Method B applied | YAML frontmatter + Quick Rules summary + existing body |

#### Method A: YAML Frontmatter (Example)

```yaml
---
checklist:
  - severity: MUST
    rule: Never hardcode secrets (API keys, passwords, tokens)
    section: "1"
  - severity: MUST
    rule: Validate all user input at system boundaries with Zod
    section: "1"
  - severity: MUST
    rule: Verify resource ownership before access (IDOR prevention)
    section: "3"
  - severity: MUST
    rule: Verify webhook signatures before processing
    section: "3.3"
  - severity: MUST_NOT
    rule: Expose internal error details (stack traces, error.message) to users
    section: "3.7"
  - severity: MUST
    rule: Apply rate limiting to authentication and critical endpoints
    section: "3.2"
  # ... enumerate all 28 rules
---
```

#### Method B: Quick Rules Summary (Example)

```markdown
# Security Guidelines

> **Quick Rules** (details below):
> - MUST: Never hardcode secrets — use env vars and secret management [§1](#1-fundamental-principles-zero-trust-architecture)
> - MUST: Validate all input with Zod [§1](#1-fundamental-principles-zero-trust-architecture)
> - MUST: Verify resource ownership (IDOR prevention) [§3.1](#31-idor-prevention-pattern)
> - MUST: Verify webhook signatures [§3.3](#33-webhook-security)
> - MUST NOT: Expose stack traces or error.message to users [§3.7](#37-error-page-information-leakage-prevention)
> - MUST: Apply rate limiting to auth endpoints [§3.2](#32-rate-limiting)
> - MUST: Use CSP nonce headers, prohibit unsafe-inline [§3.4](#34-csp-nonce-header)
> - MUST: Validate webhook certificate URLs against allowlist (SSRF prevention) [§3.5](#35-webhook-certificate-url-ssrf-prevention)
> - MUST: Escape user data in email templates [§3.6](#36-email-template-html-injection-prevention)
> - MUST: Use minimum DB privileges [§4](#4-database-security)
> - MUST: Patch Critical vulns (CVSS 9.0+) within 24h [§10](#10-cicd-security)

(Existing detailed sections maintained below)
```

### 11.3 Measurement Metrics

| Metric | Measurement Method | Expected Value |
|--------|-------------------|----------------|
| **AI Compliance Rate** | Generate code with same prompt under each condition, calculate security rule compliance count / applicable rule count | A: 60-75% → C: 80-90% |
| **Violation Severity** | Classify violations in generated code as Critical/High/Medium/Low | Reduction in Critical violations |
| **Token Consumption** | Measure input token count for each condition | B: +12%, C: +15% |
| **Check/Scan Accuracy** | Detection rate of `ai-dev-os-check` (True Positive / False Positive) | TP improvement in B and C |
| **Maintenance Cost** | Number of edit locations required to add/modify a single rule | A: 1 location, C: 2-3 locations |

### 11.4 Test Scenarios (10 Tasks)

| # | Task | Target Rules to Check |
|---|------|----------------------|
| 1 | Create a user profile update Server Action | IDOR prevention, input validation |
| 2 | Create a webhook endpoint | Signature verification, replay attack prevention, SSRF prevention |
| 3 | Create a login endpoint | Rate limiting, session management, suspicious login detection |
| 4 | Create an admin panel API Route | RBAC, IP restriction, authorization check |
| 5 | Create a password reset email sending feature | HTML escaping, secret management |
| 6 | Create an API Route with error handling | Error information leakage prevention |
| 7 | Create an external API integration (OAuth) | Scope minimization, token management |
| 8 | Create database query functions | Minimum privileges, data encryption |
| 9 | Create CI/CD pipeline configuration | Vulnerability detection, SLA compliance |
| 10 | Create a cookie consent banner component | Privacy, GDPR |

### 11.5 security.md 28-Rule List

| # | Severity | Rule | Section |
|---|----------|------|---------|
| 1 | MUST | Default deny: grant only necessary permissions | §1 |
| 2 | MUST | Validate all input data with Zod | §1 |
| 3 | MUST_NOT | Include secrets in code | §1 |
| 4 | MUST | Use minimal scopes for external API integrations | §1 |
| 5 | MUST | Enforce SameSite=Lax or stricter for cookies | §2 |
| 6 | MUST | Perform Origin/Referer checks in API Routes | §2 |
| 7 | MUST | Use POST/PUT/DELETE for state-changing APIs only | §2 |
| 8 | MUST | Introduce RBAC/ABAC for authorization | §3 |
| 9 | MUST | Verify resource ownership (IDOR prevention) | §3 |
| 10 | MUST | Apply IP-based rate limiting | §3.2 |
| 11 | MUST | Verify webhook signatures | §3.3 |
| 12 | MUST | Prevent replay attacks (idempotency check) | §3.3 |
| 13 | MUST | Validate webhook timestamps | §3.3 |
| 14 | MUST | Generate CSP nonce per request | §3.4 |
| 15 | MUST_NOT | Use 'unsafe-inline' in CSP | §3.4 |
| 16 | MUST | Validate webhook certificate URLs against allowlist (SSRF) | §3.5 |
| 17 | MUST | Escape user data in email templates | §3.6 |
| 18 | MUST_NOT | Display stack traces in error pages | §3.7 |
| 19 | MUST_NOT | Include error.message/error.stack in API responses | §3.7 |
| 20 | MUST | Limit concurrent sessions to 5 per user | §3.8 |
| 21 | MUST_NOT | Use prohibited OSS licenses (AGPL, GPL) | §3.9 |
| 22 | MUST | Use minimum DB privileges per user role | §4 |
| 23 | MUST | Manage secrets via Vercel/GitHub (never in Git) | §5 |
| 24 | MUST | Enforce HTTPS for all API calls | §6 |
| 25 | MUST | Set Secure attribute on cookies | §6 |
| 26 | MUST | Patch Critical vulns (CVSS 9.0+) within 24h | §10 |
| 27 | MUST | Patch High vulns (CVSS 7.0+) within 7 days | §10 |
| 28 | MUST | Collect auth/authz failures at ERROR/CRITICAL level | §12 |

**Total: 28 rules** (MUST: 24, MUST_NOT: 4)

### 11.6 Evaluation Criteria

| Result | Determination | Next Action |
|--------|--------------|-------------|
| Condition C compliance rate improves by **10% or more** over A | **Adopt** | Roll out to all common/ files |
| Condition C compliance rate improves by **5-10%** over A | **Conditional adoption** | Re-evaluate maintenance cost vs effectiveness. Consider adopting Method A only |
| Condition C compliance rate differs by **less than 5%** from A | **Do not adopt** | Focus on adding Before/After examples instead |
| Condition B (YAML only) performs equally to Condition C | **Adopt Method A only** | Quick Rules are unnecessary. YAML frontmatter alone is sufficient |

### 11.7 Implementation Plan

```
Phase 1: Preparation (1 day)
  ├── [ ] Extract and classify all 28 rules from security.md (MUST / MUST_NOT)
  ├── [ ] Create 3 versions of security.md for each condition
  ├── [ ] Create 10 test prompts
  └── [ ] Create evaluation sheet template

Phase 2: Benchmark Execution (1-2 days)
  ├── [ ] Execute 10 tasks with Condition A (current prose) and evaluate
  ├── [ ] Execute 10 tasks with Condition B (YAML only) and evaluate
  ├── [ ] Execute 10 tasks with Condition C (YAML + Quick Rules) and evaluate
  └── [ ] Aggregate and analyze results

Phase 3: Decision & Rollout (1 day)
  ├── [ ] Make adoption decision based on evaluation criteria
  ├── [ ] If adopted: officially apply to security.md
  ├── [ ] If adopted: apply similarly to rules-python security.md
  └── [ ] Create roadmap for full file rollout
```

### 11.8 Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| YAML frontmatter not displayed on GitHub | Quick Rules summary (Method B) compensates human readability |
| Inconsistency between YAML and body text | Add verification in `ai-dev-os-scan` to compare rule counts in frontmatter vs body |
| Benchmark results are model-dependent | Run with multiple models (Claude Sonnet, Claude Opus) |
| 10 tasks are statistically insufficient | Repeat each task 3 times, evaluate on averages (90 total executions) |
| Method B duplication increases maintenance burden | Quick Rules contain only "rule name + section link." No details written |

---

Languages: English | [日本語](docs/i18n/ja/spec/benchmark_design.md)
