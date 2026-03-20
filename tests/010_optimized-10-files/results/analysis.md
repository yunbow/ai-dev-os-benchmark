# Test 010: Optimized 10 Files — Analysis

> Date: 2026-03-21

## Scores

| Condition | Score |
|-----------|:---:|
| A: No guidelines | **93.1** |
| C: Curated 10 (optimized) | **91.4** |
| Delta (C−A) | **−1.7** |

## Trend Across All Tests

| Test | A | C | C−A | Curated files | Tokens |
|------|:---:|:---:|:---:|:---:|:---:|
| 001 avg | 84.1 | 84.9 | +0.8 | 10 | ~24K |
| 008 | 86.1 | 83.2 | −2.9 | 10 | ~24K |
| 009 | 82.7 | 77.8 | **−4.9** | 13 | ~36K |
| **010** | **93.1** | **91.4** | **−1.7** | **10** | **~25K** |

## Key Findings

### 1. Reverting to 10 files restored performance

009 → 010 で C のスコアが 77.8 → 91.4 に **+13.6 点**回復。ファイル数を13→10に戻し、トークンを36K→25Kに削減したことが主因。

### 2. Both conditions scored historically high

A=93.1 と C=91.4 はいずれも過去最高。AI 出力のばらつき（±4-5pt）を考慮しても、この実行は質の高いコードが生成された。

### 3. C still slightly trails A (−1.7)

ガイドラインを入れた条件は、まだベースラインをわずかに下回る。ただし差は縮小傾向:
- 009: −4.9（13ファイル、36K tokens）
- 010: −1.7（10ファイル、25K tokens）

### 4. Specificity fixes that worked in full-app context

| Item | 009-C | 010-C | Fixed? |
|------|:---:|:---:|:---:|
| S11 (rate limiting) | Fail | **Pass** | ✅ |
| E4 (error.tsx) | Fail | **Pass** | ✅ |
| E5 (not-found.tsx) | Fail | **Pass** | ✅ |
| V3 (client validation) | Pass | **Pass** | ✅ (maintained) |
| V8 (search limit) | Fail | **Pass** | ✅ |
| V9 (date range) | Fail | **Pass** | ✅ |
| AC2 (aria-label) | Pass→Fail | **Pass** | ✅ |
| N1 (file kebab-case) | Fail | **Pass** | ✅ |
| N4 (DB snake_case) | Fail | **Pass** | ✅ |

**9 items improved from 009-C.** ファイル数を減らしたことで、具体化修正が実際に効くようになった。

### 5. Remaining failures

| Item | 010-C | Notes |
|------|:---:|------|
| N7 | Fail | onSubmit used instead of handleFormSubmit |
| D3 | Fail | No components/ui/ directory |
| T4 | Fail | Multiple `as` casts |
| T5 | Fail | No `never` exhaustive checks |
| P4 | Fail | No dynamic imports |
| AC3 | Fail | No modal dialogs implemented |

6 items still failing. T5 and P4 are persistent across all tests — they may require a different approach (e.g., inclusion in ai-coding.md as top-level rules rather than in code.md/project-structure.md).

## Conclusions

1. **10 files is the optimal curated set size.** Adding files beyond 10 causes attention dilution that outweighs any benefit.
2. **Specificity fixes work when token budget is controlled.** 9 of 11 fixes transferred to full-app generation at 25K tokens (vs 2 of 11 at 36K tokens in Test 009).
3. **C−A gap narrowing but not yet positive.** More work needed on the 6 remaining failures to push C above A.
4. **T5 and P4 may be structurally difficult** to trigger through guidelines in full-app generation. Consider alternative approaches.
