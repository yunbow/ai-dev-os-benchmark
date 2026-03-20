# Test 012: Minimal Static + Dynamic Check — Analysis

> Date: 2026-03-21

## Scores

| Condition | Score |
|-----------|:---:|
| baseline-then-check (0 files + check) | **87.4** |
| minimal-then-check (3 files + check) | **96.9** |
| **Delta** | **+9.5** |

## 96.9 — Highest Score Ever Recorded

| Test | Method | Score |
|------|--------|:---:|
| 001 avg | Static 10 files | 84.9 |
| 010 | Optimized static 10 files | 91.4 |
| 011 | Check+fix only (no guidelines) | 95.2 |
| **012** | **3 files + check+fix** | **96.9** |

## H2 Confirmed: Minimal Static + Check > Check Only

The 3 static guideline files provided measurable value ON TOP of the check+fix process:
- baseline-then-check: 87.4
- minimal-then-check: 96.9 (+9.5)

## What the 3 Static Files Added (vs check-only)

| ID | Item | check-only | 3 files + check | Reason |
|---|------|:---:|:---:|------|
| S8 | HTML escaping in emails | Fail | **Pass** | security.md's specific escapeHtml() pattern |
| V8 | Search max length | Fail | **Pass** | validation.md's specific .max(200) rule |
| V9 | Date range .refine() | Fail | **Pass** | validation.md's specific .refine() rule |
| N4 | DB columns snake_case | Fail | **Pass** | project-structure.md's @@map convention |
| D2 | features/ directory | Fail | **Pass** | project-structure.md's vertical slice rule |
| T4 | Minimal `as` casts | Fail | **Pass** | Zod-first validation from validation.md |
| P4 | Dynamic import | Fail | **Pass** | project-structure.md's dynamic import rule |

**7 items improved**, 1 regressed (D3: no components/ui/). Net +6 items.

## Why 3 Files + Check Beats Both Static-Only and Check-Only

```
Static-only (10 files, no check):
  → AI gets rules during generation but attention is diluted
  → Result: ~85-91 (volatile, sometimes worse than baseline)

Check-only (no files, just check+fix):
  → AI generates freely, then self-reviews
  → But check prompt doesn't know project-specific patterns
  → Result: 87-95 (good, but misses project-specific items)

3 files + check (optimal):
  → AI gets project-specific patterns during generation (low attention cost)
  → Then self-reviews against comprehensive checklist
  → Result: 96.9 (highest ever)
```

The 3 static files provide **project-specific knowledge that the checklist alone cannot convey** (e.g., features/ directory structure, @@map convention, .refine() pattern). The checklist catches everything else.

## The Optimal Architecture

```
CLAUDE.md (3 files, ~8K tokens)
├── security.md       — escapeHtml, crypto tokens, auth rate limiting
├── validation.md     — .refine() for dates, zodResolver for client, .max() for search
└── project-structure.md — features/ dir, @@map, dynamic import, aria-label

  ↓ AI generates code ↓

/ai-dev-os-check (3K token checklist)
  → Reviews against 40+ specific check items
  → Fixes all violations
  → Score: 96.9/100
```

## Remaining Failures (3 items)

| ID | Item | Notes |
|---|------|------|
| D3 | components/ui/ | M used native HTML instead of shadcn. Trade-off with features/ structure |
| T5 | Exhaustive union checks | Neither condition uses `never` — persistent across ALL tests |
| (none else) | | Only 2-3 items fail out of 66 |

## Conclusions

1. **The optimal ai-dev-os architecture is: 3 static files + dynamic check+fix**
2. **Static files should contain ONLY project-specific patterns** that the check prompt cannot convey
3. **The dynamic check is the primary quality mechanism** — it catches what static guidelines miss
4. **10 files is too many for static context** — 3 files (~8K tokens) with check+fix outperforms 10 files (~25K) without check
