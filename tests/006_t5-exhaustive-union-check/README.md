# Test 006: T5 Exhaustive Union Check Fix

## Background

T5 (exhaustive union type checks with `never`) had **0% pass rate** in Test 001. The AI never added `default: { const _exhaustive: never = status; }` patterns.

## What Changed

**Before:** No exhaustive check rule in code.md.

**After:** Added §2.4 "Exhaustive Checks on Union Types" with MUST rule and concrete example:
```typescript
default: {
  const _exhaustive: never = status;
  throw new Error(`Unhandled status: ${_exhaustive}`);
}
```

## Result

**Fix confirmed.** Specifying the exact `never` pattern drove 0/4 → 4/4 compliance.

| Condition | T5 (never exhaustive check) | Pattern |
|-----------|:---:|------|
| Before-fix | **Fail** (0/4) | if-chain, no compile-time safety |
| After-fix | **Pass** (4/4) | `switch` + `default: { const _exhaustive: never = ... }` |

[→ Full analysis](results/analysis.md)

---

Languages: English | [日本語](docs/i18n/ja/README.md)
