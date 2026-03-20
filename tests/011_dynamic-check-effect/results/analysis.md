# Test 011: Dynamic Check Effect — Analysis

> Date: 2026-03-21

## Scores

| Condition | Score |
|-----------|:---:|
| baseline-only | **85.3** |
| baseline-then-check | **95.2** |
| **Delta (check+fix)** | **+9.9** |

## Go/No-Go: STRONG GO (+9.9 ≥ +5 threshold)

## This Is the Most Important Finding of the Entire Benchmark

Across 10 prior tests, static guidelines (CLAUDE.md) never clearly beat the no-guidelines baseline. The best delta was +0.8 (within variance). The dynamic check+fix produced **+9.9** — a 12x larger effect than the best static guideline result.

## Cross-Test Comparison

| Test | Method | Score | vs Baseline |
|------|--------|:---:|:---:|
| 001 avg | Static guidelines (C) | 84.9 | +0.8 |
| 010 | Optimized static (C) | 91.4 | -1.7 |
| **011** | **Generate → Check → Fix** | **95.2** | **+9.9** |

**95.2 is the highest score ever recorded across all benchmark tests.**

## What the Check+Fix Process Fixed (7 items)

| ID | Item | Before check | After check |
|---|------|:---:|:---:|
| S9 | Crypto token | Fail (Math.random) | **Pass** (crypto.randomBytes) |
| E4 | error.tsx per route | Fail (2 segments) | **Pass** (5 segments) |
| V9 | Date range .refine() | Fail (no range) | **Pass** (future date check) |
| N1 | File names kebab-case | Fail (PascalCase) | **Pass** (kebab-case) |
| N4 | DB columns snake_case | Fail (camelCase) | **Pass** (@map) |
| N7 | Handler naming | Fail (handleDelete) | **Pass** (handleTaskDelete) |
| T4 | Minimal `as` casts | Fail (many) | **Pass** (Prisma types) |

**Zero regressions** — no item went from Pass to Fail.

## Why Dynamic Check Works Where Static Guidelines Don't

1. **Single-task focus:** During check, the AI's only job is "find violations and fix them." No competing objectives (implementing features, choosing architecture). Attention is not diluted.

2. **Concrete input:** The AI reviews actual code, not abstract rules. "This file uses Math.random() for tokens" is easier to act on than "MUST use crypto.randomBytes."

3. **Self-correction is easier than prevention:** The AI can see its own mistakes and fix them, which is cognitively simpler than anticipating all rules during generation.

4. **No token budget competition:** The check prompt is ~3K tokens (just a checklist). It doesn't compete with 25K+ tokens of guidelines for attention.

## Implications for ai-dev-os Architecture

### Current architecture (static injection):
```
[CLAUDE.md 10 files, 25K tokens] → [LLM generates] → [Output]
Result: C ≈ A (no clear improvement)
```

### Validated architecture (generate + check + fix):
```
[No/minimal CLAUDE.md] → [LLM generates] → [Check against checklist] → [Fix violations] → [Output]
Result: +9.9 points improvement
```

### Recommended new architecture:
```
[Minimal CLAUDE.md: 3-5 files, project-specific only] → [LLM generates]
  → [/ai-dev-os-check with specific checklist] → [LLM fixes] → [Output]
```

## Items Still Failing (persistent across all tests)

| ID | Item | Notes |
|---|------|------|
| D2 | features/ directory | Neither condition uses features/ (both use components/) |
| T5 | Exhaustive union checks | No `never` pattern in either condition |
| P4 | Dynamic imports | No next/dynamic in either condition |

These 3 items may require explicit mention in the check prompt or a different approach.

## Next Steps

1. **Reposition ai-dev-os:** From "generation-time guidelines" to "generate + verify + fix" workflow
2. **Optimize the check prompt:** The current 3K token checklist achieved +9.9. Improving specificity could raise it further.
3. **Test with minimal CLAUDE.md + check:** Phase 3B (Test 012) — does adding 3-5 static files on top of check+fix provide additional benefit?
4. **Integrate into /ai-dev-os-check skill:** Make the checklist the core of the dynamic check skill
