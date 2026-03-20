# Test 010: Optimized 10 Files — All fixes integrated, no file count increase

## Background

Test 009 showed that expanding from 10 → 13 files (+50% tokens) made things worse despite 11 specificity fixes. The "Less is More" principle applies to the curated set too.

This test keeps the curated set at **10 files (~25K tokens)** — the same count as Test 001 — but with all 11 specificity fixes integrated INTO existing files instead of adding new ones.

## What Changed vs Test 009

| | Test 009 | Test 010 |
|---|---|---|
| Files | 13 (added routing, performance, ui) | **10** (original set) |
| Tokens | ~36K | **~25K** |
| E4/E5 rules | In routing.md (separate file) | **In error-handling.md** (integrated) |
| P4 rules | In performance.md (separate file) | **In project-structure.md** (integrated) |
| AC2 rules | In ui.md (separate file) | **In project-structure.md** (integrated) |

## Result

**10 files restored performance. C scored 91.4 — highest ever.**

| Condition | Score | vs 009 |
|-----------|:---:|:---:|
| A: No guidelines | **93.1** | +10.4 |
| C: Curated 10 (optimized) | **91.4** | **+13.6** |
| Delta (C−A) | **−1.7** | 009: −4.9 → −1.7 (improved) |

9 of 11 specificity fixes now work in full-app generation (vs 2/11 in Test 009 with 13 files). Reducing tokens from 36K → 25K allowed the fixes to take effect.

| Improved (9 items) | Still failing (6 items) |
|---|---|
| S11, E4, E5, V3, V8, V9, AC2, N1, N4 | N7, D3, T4, T5, P4, AC3 |

[→ Full analysis](results/analysis.md)

---

Languages: English | [日本語](docs/i18n/ja/README.md)
