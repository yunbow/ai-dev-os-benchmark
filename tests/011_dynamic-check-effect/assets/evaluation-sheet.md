# AI Dev OS Benchmark - Evaluation Sheet

---

## Metadata

| Field | Value |
|-------|-------|
| Model ID | ___ |
| Run # | ___ |
| Condition | A / B / C |
| Date | ___ |
| Guideline commit | ___ |

---

## 1. Scoring Summary

| # | Category | Max Points | Condition A | Condition B | Condition C |
|---|----------|------------|-------------|-------------|-------------|
| 1 | Security | 20 | ___ / 20 | ___ / 20 | ___ / 20 |
| 2 | Error Handling | 15 | ___ / 15 | ___ / 15 | ___ / 15 |
| 3 | Validation | 15 | ___ / 15 | ___ / 15 | ___ / 15 |
| 4 | Naming Consistency | 10 | ___ / 10 | ___ / 10 | ___ / 10 |
| 5 | Directory Structure | 10 | ___ / 10 | ___ / 10 | ___ / 10 |
| 6 | API Design | 10 | ___ / 10 | ___ / 10 | ___ / 10 |
| 7 | Type Safety | 10 | ___ / 10 | ___ / 10 | ___ / 10 |
| 8 | Performance | 5 | ___ / 5 | ___ / 5 | ___ / 5 |
| 9 | Accessibility | 5 | ___ / 5 | ___ / 5 | ___ / 5 |
| | **Total** | **100** | **___ / 100** | **___ / 100** | **___ / 100** |

---

## 2. Detailed Checklist

### 5.1 Security (20 points / 12 items)

| ID | Check Item | Pass/Fail/NA | Notes |
|----|-----------|--------------|-------|
| S1 | Password is hashed with bcrypt/argon2 | | |
| S2 | CSRF protection is implemented (SameSite Cookie or token) | | |
| S3 | Session Cookie has `Secure`, `HttpOnly`, `SameSite=Lax` | | |
| S4 | Password reset token has an expiration time | | |
| S5 | SQL injection prevention (Prisma parameterized queries) | | |
| S6 | IDOR prevention: resource ownership check on task operations | | |
| S7 | XSS prevention: user input is escaped | | |
| S8 | Invitation email template uses HTML escaping | | |
| S9 | Invitation token is a cryptographically secure random value | | |
| S10 | API error responses do not expose internal info (stack trace, error.message) | | |
| S11 | Rate limiting is applied to authentication endpoints | | |
| S12 | Secrets are managed via environment variables (no hardcoding) | | |

**Pass count:** ___ / ___  **Score:** ___  **Points:** ___ / 20

---

### 5.2 Error Handling (15 points / 8 items)

| ID | Check Item | Pass/Fail/NA | Notes |
|----|-----------|--------------|-------|
| E1 | Server Action returns ActionResult pattern (`{ success, data, error }`) | | |
| E2 | try-catch is at appropriate granularity (not wrapping entire functions) | | |
| E3 | Error messages are separated for user-facing vs. logging | | |
| E4 | Next.js `error.tsx` is placed in each route segment | | |
| E5 | `not-found.tsx` is appropriately placed | | |
| E6 | Fallback is implemented for database errors | | |
| E7 | Optimistic update has rollback handling on failure | | |
| E8 | API response error format is unified | | |

**Pass count:** ___ / ___  **Score:** ___  **Points:** ___ / 15

---

### 5.3 Validation (15 points / 9 items)

| ID | Check Item | Pass/Fail/NA | Notes |
|----|-----------|--------------|-------|
| V1 | Zod schema is defined on the server side | | |
| V2 | Same Zod schema is shared between client and server | | |
| V3 | Form validation works on the client side | | |
| V4 | Email address format check exists | | |
| V5 | Password strength check exists (min length, complexity) | | |
| V6 | Color code validation exists | | |
| V7 | Pagination parameter validation exists | | |
| V8 | Search query length limit exists | | |
| V9 | Date format/range check exists (deadline setting) | | |

**Pass count:** ___ / ___  **Score:** ___  **Points:** ___ / 15

---

### 5.4 Naming Consistency (10 points / 8 items)

| ID | Check Item | Pass/Fail/NA | Notes |
|----|-----------|--------------|-------|
| N1 | File names are consistently kebab-case | | |
| N2 | Component names are consistently PascalCase | | |
| N3 | Variables/functions are consistently camelCase | | |
| N4 | Database column names are consistently snake_case | | |
| N5 | API endpoints are consistently kebab-case | | |
| N6 | Boolean variables start with `is`, `has`, `can` | | |
| N7 | Event handlers follow `handle` + noun + verb pattern | | |
| N8 | Server Actions start with a verb (`createTask`, `updateTask`) | | |

**Pass count:** ___ / ___  **Score:** ___  **Points:** ___ / 10

---

### 5.5 Directory Structure (10 points / 7 items)

| ID | Check Item | Pass/Fail/NA | Notes |
|----|-----------|--------------|-------|
| D1 | App Router structure is appropriate (`app/`, `(group)/` usage) | | |
| D2 | Features are separated by `features/` directory | | |
| D3 | Shared components are placed in `components/ui/` | | |
| D4 | Server Actions are in `actions/` or `app/**/actions.ts` | | |
| D5 | Prisma schema is at `prisma/schema.prisma` | | |
| D6 | Zod schemas are co-located with Server Actions / API Routes | | |
| D7 | `lib/` directory has clear responsibilities (utility vs. business logic) | | |

**Pass count:** ___ / ___  **Score:** ___  **Points:** ___ / 10

---

### 5.6 API Design (10 points / 7 items)

| ID | Check Item | Pass/Fail/NA | Notes |
|----|-----------|--------------|-------|
| A1 | URLs are RESTful (`/api/v1/tasks`, `/api/v1/teams/:id/members`) | | |
| A2 | HTTP methods are appropriate (GET=read, POST=create, PUT=update, DELETE=delete) | | |
| A3 | Response format is unified (`{ data, error, meta }` etc.) | | |
| A4 | HTTP status codes are appropriate (201 Created, 404 Not Found, etc.) | | |
| A5 | Pagination is implemented | | |
| A6 | Content-Type is properly set | | |
| A7 | Authentication check exists on endpoints that require auth | | |

**Pass count:** ___ / ___  **Score:** ___  **Points:** ___ / 10

---

### 5.7 Type Safety (10 points / 6 items)

| ID | Check Item | Pass/Fail/NA | Notes |
|----|-----------|--------------|-------|
| T1 | `any` is not used | | |
| T2 | API response types are defined | | |
| T3 | Prisma types are leveraged (no duplicate manual type definitions) | | |
| T4 | `as` type casts are minimal | | |
| T5 | Union types have exhaustive checks (never check) | | |
| T6 | `null` / `undefined` handling is explicit (proper use of `??`, `?.`) | | |

**Pass count:** ___ / ___  **Score:** ___  **Points:** ___ / 10

---

### 5.8 Performance (5 points / 4 items)

| ID | Check Item | Pass/Fail/NA | Notes |
|----|-----------|--------------|-------|
| P1 | No N+1 queries (Prisma `include` / `select` usage) | | |
| P2 | `use client` is applied only to the minimum necessary components | | |
| P3 | Images use `next/image` | | |
| P4 | Heavy components use `React.lazy` / dynamic import | | |

**Pass count:** ___ / ___  **Score:** ___  **Points:** ___ / 5

---

### 5.9 Accessibility (5 points / 5 items)

| ID | Check Item | Pass/Fail/NA | Notes |
|----|-----------|--------------|-------|
| AC1 | Form elements have associated `<label>` | | |
| AC2 | Buttons have appropriate `aria-label` (icon buttons) | | |
| AC3 | Modals/dialogs have `role="dialog"` and `aria-modal` | | |
| AC4 | All operations are possible with keyboard only | | |
| AC5 | Color contrast meets WCAG AA criteria | | |

**Pass count:** ___ / ___  **Score:** ___  **Points:** ___ / 5

---

## 3. Scoring Formula

```
Score = (Pass count / Total applicable items) × 5
Points = (Score / 5) × Max Points
```

Where:
- **Pass count** = number of items marked "Pass"
- **Total applicable items** = total items minus items marked "NA"
- **Score** = 1-5 scale value
- **Max Points** = category max points from the summary table

**Overall Total = sum of all category Points (out of 100)**
