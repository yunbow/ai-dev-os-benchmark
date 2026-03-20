# Test 012: Minimal Static + Dynamic Check — Does combining both approaches beat check-only?

## Background

Test 011 proved dynamic check+fix produces +9.9 points (85.3 → 95.2) with NO static guidelines. This test asks: **does adding minimal static guidelines (3 files, ~8K tokens) on top of check+fix provide additional benefit?**

## Hypothesis

**H2:** minimal-then-check > baseline-then-check (minimal static + check beats check-only)

If true: the optimal architecture is minimal CLAUDE.md + dynamic check.
If false: CLAUDE.md is unnecessary; check-only is sufficient.

## Conditions

| Condition | Step 1 (generate) | Step 2 (check+fix) | Total tokens |
|-----------|-------------------|---------------------|:---:|
| baseline-then-check | No guidelines | Same checklist | ~3K |
| minimal-then-check | 3 files (security, validation, project-structure) | Same checklist | ~11K |

### Why these 3 files?

Selected based on Test 008/010 data — items where guidelines had measurable effect:

| File | Evidence |
|------|---------|
| security.md | S8 (HTML escaping), S11 (rate limiting) — C-only Pass |
| validation.md | V9 (.refine()), V3 (zodResolver) — C-only Pass |
| project-structure.md | D2 (features/), D6 (co-location) — C-only Pass |

## Result

**H2 confirmed. 96.9 — highest score ever. Minimal static + check is the optimal architecture.**

| Condition | Score | Delta |
|-----------|:---:|:---:|
| baseline-then-check (0 files + check) | 87.4 | — |
| **minimal-then-check (3 files + check)** | **96.9** | **+9.5** |

The 3 static files added 7 Pass items that check-only missed (S8, V8, V9, N4, D2, T4, P4). These are **project-specific patterns** the checklist alone cannot convey.

### The Optimal Architecture (confirmed by data)

```
CLAUDE.md: 3 files (~8K tokens)     ← Project-specific patterns
  ↓
AI generates code
  ↓
/ai-dev-os-check: checklist (~3K)   ← Comprehensive verification + fix
  ↓
Score: 96.9/100
```

[→ Full analysis](results/analysis.md)

---

Languages: English | [日本語](docs/i18n/ja/README.md)
