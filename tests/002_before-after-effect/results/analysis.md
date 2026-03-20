# Before/After Effect Measurement Results — Final

> Date: 2026-03-21
> Test: T-010 — Does adding Before/After code examples to security.md improve AI output quality?
> Conditions: D (security.md without examples, 505 lines) vs E (security.md with examples, 785 lines)
> Tasks: 5 security-focused implementation tasks

## Summary

| Task | D (without examples) | E (with examples) | Winner |
|------|:---:|:---:|:---:|
| 1. Profile update Server Action | All Pass | All Pass (V2 Partial) | D |
| 2. Team invitation email | All Pass | All Pass (+rate limit) | Tie |
| 3. Login with rate limiting | All Pass (+timing protection) | All Pass | D |
| 4. Task search API | 6/6 | 6/6 | Tie |
| 5. Password reset with email | 5/5 (+token hash) | 4/5 (S8 Partial) | **D** |

**Overall: D wins 3, Tie 2, E wins 0.**

## Detailed Results per Task

### Task 1: User Profile Update Server Action

**Targets:** S6 (IDOR), S10 (error leak), V1 (Zod), V2 (shared schema), E1 (ActionResult)

| Item | D | E |
|------|:---:|:---:|
| S6: IDOR prevention | Pass | Pass |
| S10: Error info leak | Pass | Pass |
| V1: Zod schema on server | Pass | Pass |
| V2: Schema shared client/server | **Pass** (separate files) | **Partial** (inline in "use server") |
| E1: ActionResult pattern | Pass | Pass |

D had cleaner schema architecture (separate `lib/validations/` files). E embedded schemas in server action files, making client sharing harder.

### Task 2: Team Invitation Email

**Targets:** S8 (HTML escaping), S9 (crypto token), S12 (env vars), S4 (expiry)

| Item | D | E |
|------|:---:|:---:|
| S4: Token 7-day expiry | Pass | Pass |
| S8: HTML escaping | Pass | Pass |
| S9: crypto.randomBytes | Pass | Pass |
| S12: SMTP env vars | Pass | Pass |

Both identical on target items. E added rate limiting as a bonus.

### Task 3: Login with Rate Limiting

**Targets:** S1 (bcrypt), S2 (SameSite), S3 (cookie flags), S11 (rate limiting)

| Item | D | E |
|------|:---:|:---:|
| S1: bcrypt.compare | Pass | Pass |
| S2: SameSite cookie | Pass | Pass |
| S3: Secure, HttpOnly, SameSite | Pass | Pass |
| S11: Rate limiting | Pass | Pass |
| Timing-attack protection | **Pass** (dummy hash) | **Fail** (early return) |

D used a dummy bcrypt.compare when user not found, preventing timing-based enumeration. E returned early, leaking timing information.

### Task 4: Task Search API

**Targets:** S5 (SQL injection), S6 (ownership), S10 (error leak), S11 (rate limit), V7 (pagination), V8 (search limit)

| Item | D | E |
|------|:---:|:---:|
| S5: Prisma parameterized | Pass | Pass |
| S6: User ownership filter | Pass | Pass |
| S10: No stack traces | Pass | Pass |
| S11: Rate limiting | Pass | Pass |
| V7: Pagination min/max | Pass | Pass |
| V8: Search max length | Pass | Pass |

Perfect tie. Both 6/6.

### Task 5: Password Reset with Email

**Targets:** S1 (bcrypt), S4 (token expiry), S8 (HTML escaping), S9 (crypto token), S12 (env vars)

| Item | D | E |
|------|:---:|:---:|
| S1: bcrypt hash | Pass | Pass |
| S4: Token 1h expiry | Pass | Pass |
| S8: HTML escaping | **Pass** | **Partial** (escapeHtml defined but never called) |
| S9: crypto.randomBytes | Pass | Pass |
| S12: SMTP env vars | Pass | Pass |
| Token hashing (bonus) | **Pass** (SHA-256 hash stored) | **Fail** (plaintext token in DB) |

D stored token hashes (SHA-256) in the database. E stored plaintext tokens. D properly called escapeHtml(); E defined the function but forgot to use it.

## Decision

Based on the evaluation criteria from benchmark_design.md §6.2.5:

| Threshold | Condition | Result |
|-----------|-----------|--------|
| +10% improvement | Adopt for all guidelines | ❌ |
| +5-10% improvement | Adopt for high-point guidelines | ❌ |
| <5% improvement | **Skip — focus on other approaches** | **✅ This outcome** |

**Before/After examples did NOT improve AI compliance on target security items.** The improvement is 0% or negative (E was worse than D in some cases).

## Why Before/After Examples Didn't Help

1. **The model already knows these patterns.** Claude generates secure code (bcrypt, IDOR checks, rate limiting) from the prose guidelines alone. The Before/After examples are redundant with the model's training data.

2. **Examples may cause "template following" instead of "principle understanding."** In Task 5, condition E defined `escapeHtml()` (matching the example) but forgot to call it — suggesting the model copied the pattern superficially rather than understanding the principle.

3. **Additional tokens may cause attention dilution.** Condition E's security.md is 785 lines vs D's 505 lines (+55%). The extra 280 lines of examples may have diluted attention, similar to the B < A finding in the guideline-impact benchmark.

## Recommendations

1. **Do NOT add Before/After examples to security.md at this time.** The effect is neutral to negative.

2. **Focus on guideline clarity over examples.** The prose guidelines are already effective. Improving rule specificity (e.g., "store token hashes, not plaintext tokens") may be more effective than code examples.

3. **Consider Before/After examples only for items with consistently low pass rates.** In the guideline-impact benchmark, V9 (date range) and N7 (event handler naming) had 0% pass across all conditions — these might benefit from examples where prose guidelines have clearly failed.

4. **The "less is more" principle applies to guideline content too.** Adding 280 lines of examples to a 505-line file did not improve quality. This is consistent with the Two-Tier Context Strategy finding.
