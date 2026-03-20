# Test 011: Dynamic Check Effect — Does post-generation verification improve quality?

## Background

All prior tests measured the effect of guidelines loaded DURING code generation. The result: no clear improvement over baseline (C ≈ A).

This test measures a fundamentally different approach: **generate first, then check and fix**. This simulates the `/ai-dev-os-check` workflow.

## Hypothesis

> The value of ai-dev-os is not in generation-time context injection, but in post-generation quality verification.

**H1:** A→check > A (dynamic check improves baseline)
**H2:** A→check > C from Test 010 (check+fix beats static guidelines)

## Test Design

**Two-step process in a SINGLE session:**

```
Step 1: Generate app with NO guidelines (same as condition A)
  → Paste step1-generate.md

Step 2: In the SAME session, run dynamic check + fix
  → Paste step2-check-and-fix.md
  → AI reviews its own code against the checklist
  → AI fixes all violations found
```

**Control:** baseline-only (just step 1, no step 2)

## Conditions

| Condition | Process | Compare to |
|-----------|---------|------------|
| baseline-only | Step 1 only (generate, no check) | = Test 010 condition A |
| baseline-then-check | Step 1 → Step 2 (generate, then check+fix) | The new condition |

## Result

**STRONG GO. Dynamic check+fix produced +9.9 points — the largest improvement in any test.**

| Condition | Score | Improvement |
|-----------|:---:|:---:|
| baseline-only | 85.3 | — |
| baseline-then-check | **95.2** | **+9.9** |

95.2 is the **highest score ever recorded** across all 11 benchmark tests. For comparison, the best static guideline result was C=91.4 (Test 010, +6.1 vs this baseline).

7 items fixed by check+fix (zero regressions):

| Fixed | Items |
|-------|-------|
| Security | S9 (Math.random → crypto.randomBytes) |
| Error Handling | E4 (error.tsx in 5 route segments) |
| Validation | V9 (date range .refine()) |
| Naming | N1 (kebab-case), N4 (snake_case @@map), N7 (handleTaskDelete) |
| Type Safety | T4 (removed unnecessary `as` casts) |

**Key insight:** Static guidelines (CLAUDE.md) never clearly beat baseline across 10 tests. Dynamic check+fix beats it by +9.9 in a single test. The value of ai-dev-os is in **post-generation verification**, not generation-time context.

[→ Full analysis](results/analysis.md)

---

Languages: English | [日本語](docs/i18n/ja/README.md)
