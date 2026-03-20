# Test 009: Phase 2 Re-score — Analysis

> Date: 2026-03-21

## Scores

| Condition | Score | vs 001 avg | vs 008 |
|-----------|:---:|:---:|:---:|
| A: No guidelines | **82.7** | 84.1 (−1.4) | 86.1 (−3.4) |
| C: Curated 13 (phase 2) | **77.8** | 84.9 (−7.1) | 83.2 (−5.4) |
| **Delta (C−A)** | **−4.9** | — | — |

## Key Finding: More specific guidelines + more files = WORSE score

The Phase 2 curated set (13 files, ~36K tokens, 11 specificity fixes) scored **lower** than:
- No guidelines (77.8 vs 82.7)
- Pre-fix curated 10 files from Test 001 (77.8 vs 84.9)
- Phase 1 fix curated 10 files from Test 008 (77.8 vs 83.2)

## What Went Wrong

### 1. Token increase caused attention dilution

| Test | Curated files | Tokens | C Score |
|------|:---:|:---:|:---:|
| 001 avg | 10 | ~24K | 84.9 |
| 008 | 10 | ~24K | 83.2 |
| **009** | **13** | **~36K** | **77.8** |

Adding 3 files (routing.md, performance.md, ui.md) increased tokens by 50%. This followed the same pattern as Test 001 where all 28 files (~75K) scored worst. **The "Less is More" principle applies to the curated set too.**

### 2. Fixes work individually but don't compose in full-app generation

| Item | Individual test | Full-app (009) |
|------|:---:|:---:|
| V3 (client validation) | — | **Pass** ✅ (improved) |
| AC2 (aria-label) | — | **Pass** ✅ (improved) |
| V9 (date range) | 004: Pass | **Fail** ❌ |
| N7 (handler naming) | 005: Pass | **Fail** ❌ |
| T5 (exhaustive check) | 006: Pass | **Fail** ❌ |
| P4 (dynamic import) | 007: Pass | **Fail** ❌ |
| S11 (rate limiting) | — | **Fail** ❌ |
| E4 (error.tsx) | — | **Fail** ❌ |
| E5 (not-found.tsx) | — | **Fail** ❌ |

Only 2 of 11 fixes transferred to full-app generation. The rest work in isolation but are drowned out when the AI juggles 36K tokens of guidelines + full app implementation.

### 3. Items that regressed

| Item | 008-C | 009-C | Likely cause |
|------|:---:|:---:|------|
| S8 | Pass | NA | C didn't implement email at all (console.log) |
| V8 | Pass | Fail | search.max(200) was present in 008-C but lost |
| D3 | — | Fail | No components/ui/ in 009-C |

## Trend Across All Tests

| Test | A Score | C Score | C−A | Curated tokens |
|------|:---:|:---:|:---:|:---:|
| 001 run-1 | 79.6 | 81.6 | +2.0 | ~24K |
| 001 run-2 | 86.8 | 90.4 | +3.6 | ~24K |
| 001 run-3 | 87.9 | 82.7 | -5.2 | ~24K |
| 008 | 86.1 | 83.2 | -2.9 | ~24K |
| **009** | **82.7** | **77.8** | **-4.9** | **~36K** |

The trend is clear: **as curated tokens increase, C's advantage over A decreases and eventually reverses.**

## Conclusions

1. **The curated set should stay at 10 files (~24K tokens).** Adding routing.md, performance.md, ui.md caused more attention dilution than the specificity fixes could overcome.

2. **Specificity fixes are necessary but not sufficient for full-app generation.** They work perfectly in isolated tasks (Tests 004-007) but don't reliably compose when the AI processes 36K+ tokens.

3. **The optimal strategy is: fewer files + maximum specificity within those files.** Not more files with more rules.

## Recommended Next Steps

1. **Revert to 10-file curated set.** Remove routing.md, performance.md, ui.md from the curated set.
2. **Move E4/E5 rules into an existing curated file** (e.g., server-actions.md or project-structure.md) instead of adding routing.md.
3. **Move P4 rules into code.md** (already in curated set) instead of adding performance.md.
4. **Move AC2 rules into naming.md or code.md** instead of adding ui.md.
5. **Re-run with optimized 10-file set** to verify the token reduction restores C > A.
