# Test 008: Post-Fix Re-score — Did specificity improvements raise the overall score?

## Background

In Test 001, curated guidelines scored only +0.8 vs baseline (84.9 vs 84.1). Four items (V9, N7, T5, P4) had 0% pass rate across all runs.

Tests 004-007 fixed those 4 items by making guidelines more specific, achieving 0% → 100% on each. This test measures whether those fixes improve the **overall score** when running the full app generation benchmark.

## Purpose

1. **Score map**: Get pass/fail status for all 66 items with the improved guidelines
2. **Overall impact**: Does the curated condition now clearly beat baseline?
3. **Identify next targets**: Which items still have 0% pass rate?

## Conditions

| Condition | Context | Comparison to 001 |
|-----------|---------|-------------------|
| A: No guidelines | Requirements only (same as 001-A) | Baseline control |
| C: Curated 10 (post-fix) | Requirements + improved curated guidelines | V9, N7, T5, P4 fixes included |

## Result

| Condition | Score | vs 001 |
|-----------|:---:|:---:|
| A: No guidelines | **86.1** | 001-A avg: 84.1 (+2.0) |
| C: Curated (post-fix) | **83.2** | 001-C avg: 84.9 (−1.7) |

**The 4 specificity fixes alone did not raise the overall score.** AI output variance (±4-5 pts) dominates the signal. However, the 66-item score map revealed important patterns:

### Where Guidelines Helped (C > A)

| ID | Item | A | C |
|---|------|:---:|:---:|
| S8 | Email HTML escaping | Fail | **Pass** |
| N4 | DB columns snake_case | Fail | **Pass** |
| D2 | Features directory | Fail | **Pass** |
| D6 | Zod co-located | Fail | **Pass** |
| T3 | Prisma types leveraged | Fail | **Pass** |

### Still Failing in Both (Next Targets)

| ID | Item | Priority |
|---|------|:---:|
| E4 | error.tsx per route segment | High |
| N7 | Event handler naming | Medium |
| T5 | Exhaustive union checks | Medium |
| P4 | Dynamic imports | Low |

**Key insight:** Specificity fixes work in isolated tasks (Tests 004-007: 0%→100%) but don't fully transfer to full-app generation where the AI juggles hundreds of decisions simultaneously.

[→ Full analysis](results/analysis.md)

---

Languages: English | [日本語](docs/i18n/ja/README.md)
