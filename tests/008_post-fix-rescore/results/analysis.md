# Test 008: Post-Fix Re-score — Analysis

> Date: 2026-03-21

## Scores

| Condition | Score | vs 001 Average |
|-----------|:---:|:---:|
| A: No guidelines | **86.1** | 001-A: 84.1 (+2.0) |
| C: Curated (post-fix) | **83.2** | 001-C: 84.9 (−1.7) |

## Key Finding: Post-fix guidelines did NOT improve the overall score

The curated condition (83.2) scored **lower** than both:
- The no-guidelines baseline (86.1) in this run
- The pre-fix curated average from Test 001 (84.9)

This suggests the V9/N7/T5/P4 fixes alone are insufficient to move the overall score, and AI output variance (±4-5 pts per run) dominates the signal.

## 66-Item Score Map

### Items where C improved over A

| ID | Item | A | C |
|---|------|:---:|:---:|
| S8 | Email HTML escaping | Fail | **Pass** |
| N4 | DB columns snake_case | Fail | **Pass** |
| D2 | Features directory | Fail | **Pass** |
| D6 | Zod co-located | Fail | **Pass** |
| T3 | Prisma types leveraged | Fail | **Pass** |

### Items where A was better than C

| ID | Item | A | C |
|---|------|:---:|:---:|
| S11 | Rate limiting on auth | Pass | **Fail** |
| E4 | error.tsx per segment | Fail | Fail (both) |
| E5 | not-found.tsx | Pass | **Fail** |
| V3 | Client-side validation | Pass | **Fail** |
| N1 | File names kebab-case | Pass | **Fail** |
| T4 | Minimal `as` casts | Pass | **Fail** |
| AC2 | aria-label on buttons | Pass | **Fail** |

### Items Fail in BOTH conditions (persistent problems)

| ID | Item | Notes |
|---|------|------|
| **E4** | error.tsx per route segment | Neither condition places error boundaries in all segments |
| **N7** | Event handler naming | Both use handleSubmit/handleSearch without noun |
| **T5** | Exhaustive union checks | Neither uses `never` pattern |
| **P4** | Dynamic imports | Neither uses `next/dynamic` |

## Analysis

### Why T5, N7, P4 still failed despite guideline fixes

Tests 004-007 proved these fixes work in **isolated tasks** (single-function generation). However, in the **full app generation** context (Test 008), the AI has many more decisions to make simultaneously and may not consistently apply patterns from the guideline, especially when:

1. **The pattern is not directly triggered by the task**: The app generation prompt doesn't ask to "create utility functions with switch statements" (T5's trigger in Test 006)
2. **The AI uses a different valid approach**: For N7, using `handleSubmit` is a common React pattern that tutorials teach — the guideline has to override deeply ingrained defaults
3. **No explicit trigger in the requirements**: P4 (dynamic import) requires the AI to proactively decide to split components, which the requirements don't mention

### Implications

The **specificity fixes work at the individual task level but don't fully transfer to full-app generation**. This is likely because:
- In full-app generation, the AI processes ~100K tokens of context (requirements + guidelines + all generated code so far)
- Individual guideline rules compete for attention with hundreds of other decisions
- The "attention dilution" problem from Test 001 applies at the rule level too

## Still-Failing Items (Next Targets)

| ID | Item | Priority | Fix Strategy |
|---|------|:---:|------|
| S11 | Rate limiting on auth Server Actions | High | Add explicit "MUST apply rate limiting to ALL Server Actions that handle auth" with code example |
| E4 | error.tsx per route segment | High | Add to Next.js guideline as MUST with directory tree example |
| E5 | not-found.tsx placement | Medium | Add to Next.js guideline as MUST |
| V3 | Client-side form validation | Medium | Strengthen "MUST use zodResolver on client" rule |
| N7 | Event handler naming | Medium | Already fixed in guideline but not applied in full-app context |
| T5 | Exhaustive union checks | Medium | Already fixed but not applied in full-app context |
| P4 | Dynamic imports | Low | Already fixed but not applied in full-app context |
| T4 | Minimal `as` casts | Low | Add "MUST NOT use `as string` on formData.get()" |
| N1 | File names kebab-case | Low | Clarify component file naming exception |
| AC2 | aria-label on all icon buttons | Low | Add MUST rule to accessibility or UI guideline |
