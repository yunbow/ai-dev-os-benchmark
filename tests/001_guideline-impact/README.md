# Test 001: Guideline Impact — Does the quantity of guidelines affect AI code quality?

## Result

**Curated 10 files > No guidelines > All 28 files.** More guidelines ≠ better code.

| Condition | Avg Score | vs Baseline |
|-----------|:---:|:---:|
| A: No guidelines | 84.1 | — |
| B: All 28 files (~75K tokens) | 79.3 | **−4.8** |
| C: Curated 10 files (~24K tokens) | 84.9 | **+0.8** |

**Attention dilution confirmed:** Loading all guidelines caused Error Handling to drop from 13.7 → 10.0. The AI lost focus on things it could do better without guidelines.

This validates AI Dev OS's [Two-Tier Context Strategy](https://github.com/yunbow/ai-dev-os#key-concepts) — load 10-15 high-impact rules in static context, check all 30+ dynamically on demand.

## Setup

- **App:** Task management app (5 features: auth, CRUD, categories, teams, API)
- **Model:** Claude Opus 4.6
- **Runs:** 3 per condition
- **Scoring:** 66 items across 9 dimensions (100 points)

## Hypotheses Verified

| # | Hypothesis | Result |
|---|-----------|:---:|
| H1 | C > A (curated > baseline) | **Confirmed** (+0.8, marginal) |
| H2 | C ≥ B (curated ≥ all) | **Confirmed** (+5.6) |
| H3 | B < A (attention dilution) | **Confirmed** (−4.8, strongest) |

[→ Full analysis](results/analysis.md)

---

Languages: English | [日本語](docs/i18n/ja/README.md)
