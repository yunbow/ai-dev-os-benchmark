# Test 004: V9 Date Range Fix — Analysis

> Date: 2026-03-21

## Result

| Condition | V9 (date range in Zod schema) | Notes |
|-----------|:---:|-------|
| Before-fix | **Fail** | `dueDate` has `z.coerce.date().optional()` only. Future-date check exists as imperative code in server action, not in schema |
| After-fix | **Pass** | `dueDate` uses `.refine()` in Zod schema to reject past dates |

## What Made the Difference

**Before (validation.md):**
```
* Cross-field constraints: e.g., endDate must be after startDate
```
→ Vague. AI interprets "cross-field" as a general concept, not a specific action.

**After (validation.md):**
```
* Date range constraints: MUST validate that future-facing dates (e.g., dueDate, expiresAt)
  are in the future using .refine()
```
→ Specific. Mentions the exact field names, the exact method (`.refine()`), and the exact constraint ("in the future").

## Key Insight

**Guideline specificity — not quantity — drives AI compliance.**

The before-fix code actually *did* check for future dates, but in the wrong place (imperative code in the server action instead of declarative `.refine()` in the Zod schema). The after-fix guideline explicitly said "using `.refine()`", which directed the AI to put the check in the correct location.

This confirms the benchmark's overall finding: the AI already knows security and validation patterns from its training data. What it needs from guidelines is **where and how** to apply them — not what they are.

## Implications for Guideline Writing

| Principle | Example |
|-----------|---------|
| Name the specific method | "using `.refine()`" not "validate" |
| Name the specific fields | "`dueDate`, `expiresAt`" not "date fields" |
| Use MUST/SHOULD keywords | "MUST validate" not "should consider" |
| State the constraint explicitly | "in the future" not "appropriate range" |
