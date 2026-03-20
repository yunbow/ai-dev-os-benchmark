# Test 006: T5 Exhaustive Union Check Fix — Analysis

> Date: 2026-03-21

## Result

| Condition | T5 (never exhaustive check) | Pattern |
|-----------|:---:|------|
| Before-fix | **Fail** (0/4) | if-chain with implicit fallthrough return |
| After-fix | **Pass** (4/4) | `switch` + `default: { const _exhaustive: never = status }` |

## What Made the Difference

**Before:** No mention of exhaustive checks in code.md. The AI defaults to if-chains or Record lookups — neither of which provides compile-time safety when a new union variant is added.

**After:** Added §2.4 with MUST rule, the exact `never` pattern, and explicit scope:
```typescript
default: {
  const _exhaustive: never = status;
  throw new Error(`Unhandled status: ${_exhaustive}`);
}
```
Plus: "This applies to all discriminated unions, Prisma enums (`TaskStatus`, `TeamRole`, `Priority`), and action type dispatchers."

The AI applied the pattern to all 4 functions — `getStatusLabel`, `getStatusColor`, `getPriorityIcon`, `getNextStatus` — with consistent `_exhaustive: never` naming.

## Guideline Writing Principle

Naming the exact TypeScript pattern (`const _exhaustive: never = ...`) was essential. Without it, the AI has multiple valid approaches (Record lookup, if-chain, switch without never). The guideline eliminated ambiguity by specifying both the construct (`switch`) and the safety mechanism (`never`).
