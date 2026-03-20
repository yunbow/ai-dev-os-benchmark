# Test 009: Phase 2 Re-score — Full specificity improvements (11 items fixed)

## Background

Test 008 showed that 4 fixes alone didn't move the overall score. This test applies **all 11 specificity fixes** and adds 3 more guideline files (routing.md, performance.md, ui.md) to cover E4/E5, P4, and AC2.

## What Changed (cumulative)

| Item | Fix | Source File |
|------|-----|------------|
| V9 | Date range: MUST use `.refine()` | validation.md |
| N7 | Event handlers: MUST use handle+noun+verb | naming.md |
| T5 | Exhaustive: MUST use `never` in default | code.md |
| P4 | Dynamic import: SHOULD + candidate list | performance.md |
| S11 | Rate limit: MUST apply to auth Server Actions | security.md |
| E4 | error.tsx: MUST in every route group | routing.md |
| E5 | not-found.tsx: MUST at root | routing.md |
| V3 | Client validation: MUST use zodResolver | validation.md |
| N1 | File names: kebab-case for components too | naming.md |
| T4 | Minimal `as`: MUST NOT on formData.get() | code.md |
| AC2 | Icon buttons: MUST have aria-label | ui.md |

## Conditions

| Condition | Files | Tokens |
|-----------|:---:|:---:|
| A: No guidelines | requirements only | ~2K |
| C: Curated 13 (phase 2) | requirements + 13 guideline files | ~36K |

Note: Curated set expanded from 10 → 13 files (added routing.md, performance.md, ui.md).

## Result

| Condition | Score | vs 001 avg |
|-----------|:---:|:---:|
| A: No guidelines | **82.7** | 84.1 (−1.4) |
| C: Curated 13 (phase 2) | **77.8** | 84.9 (−7.1) |

**Adding 3 more files made things worse.** The curated set went from 10 files (~24K tokens) to 13 files (~36K tokens). The 50% token increase caused more attention dilution than the 11 specificity fixes could overcome.

| What improved (2/11) | What still failed (9/11) |
|---|---|
| V3: Client-side validation ✅ | S11, E4, E5, V9, N1, N7, T4, T5, P4 |
| AC2: aria-label ✅ | |

**Key lesson:** The "Less is More" principle applies to the curated set too. Fixes should be added to existing files, not by adding new files.

[→ Full analysis](results/analysis.md)

---

Languages: English | [日本語](docs/i18n/ja/README.md)
