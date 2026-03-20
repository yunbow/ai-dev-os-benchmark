# Test 004: V9 Date Range Validation Fix

## Background

In Test 001 (guideline-impact), V9 (date format/range check) had **0% pass rate across all 9 runs** (3 conditions × 3 runs). The AI consistently validated date format but never checked date range (e.g., due date must be in the future).

## What Changed

**Before (validation.md):**
```
* Cross-field constraints: e.g., endDate must be after startDate, maxPrice >= minPrice
```

**After (validation.md):**
```
* Date range constraints: MUST validate that future-facing dates (e.g., dueDate, expiresAt)
  are in the future using .refine(). MUST validate that endDate is after startDate
```

## Test Design

- **Task:** Create Task Server Action with `dueDate` field
- **Check:** Does the Zod schema validate that `dueDate` is in the future?
- **Conditions:** Before-fix guideline vs After-fix guideline
- **Target item:** V9

## Result

**Fix confirmed.** Specific guideline wording drove the AI to place validation in the correct location.

| Condition | V9 (date range check) |
|-----------|:---:|
| Before-fix | **Fail** — checked in server action, not in Zod schema |
| After-fix | **Pass** — `.refine()` in Zod schema |

**Key insight:** The AI *knew* to check future dates in both conditions, but only placed it in the Zod schema (the correct location) when the guideline explicitly said "using `.refine()`". Guideline **specificity** — not quantity — drives compliance.

[→ Full analysis](results/analysis.md)

---

Languages: English | [日本語](docs/i18n/ja/README.md)
