# AI Dev OS Benchmark

Same prompt, same model, different rules — measuring AI code quality impact

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

> Does giving your AI coding rules actually improve output? This benchmark measures the impact of [AI Dev OS](https://github.com/yunbow/ai-dev-os) guidelines on AI-generated code quality.

## The Key Finding: Generate → Check → Fix

| Architecture | Score | vs Baseline |
|-------------|:---:|:---:|
| No guidelines (baseline) | ~84 | — |
| Static 10 files in CLAUDE.md | ~85-91 | **≈ 0** (within variance) |
| Check+fix only (no CLAUDE.md) | 95.2 | **+9.9** |
| **3 files in CLAUDE.md + check+fix** | **96.9** | **+12.5** |

Static guidelines alone don't improve total score. **Post-generation verification** is the real quality mechanism. The optimal architecture:

```
CLAUDE.md: 3 project-specific files (~8K tokens)
  → AI generates code
  → /ai-dev-os-check verifies against checklist
  → AI fixes all violations
  → Score: 96.9/100
```

## The "Less is More" Principle — Confirmed 3 Times

| Test | What was added | Result | Details |
|------|---------------|--------|---------|
| [001: Guideline Impact](tests/001_guideline-impact/) | +28 guideline files (+73K tokens) | **Worse** than baseline (−4.8 pts) | Attention dilution |
| [002: Before/After Examples](tests/002_before-after-effect/) | +280 lines of code examples (+55%) | **No improvement** | Prose already sufficient |
| [003: YAML Checklist](tests/003_checklist-format/) | +165 lines of YAML/Quick Rules (+33%) | **No improvement** | Metadata adds no value |

## Specificity Fixes — 0% → 100% on All 4 Items

Items that failed in every run of Test 001 were fixed by making guidelines **more specific** (not longer):

| Test | Item | Before (0% Pass) | After (100% Pass) | What changed |
|------|------|-------------------|-------------------|-------------|
| [004](tests/004_v9-date-range-fix/) | V9: Date range | "Cross-field constraints" | "MUST validate using `.refine()`" | Named the method |
| [005](tests/005_n7-event-handler-naming/) | N7: Handler naming | No rule | "MUST use `handle` + noun + verb" | Added ❌/✅ examples |
| [006](tests/006_t5-exhaustive-union-check/) | T5: Exhaustive check | No rule | "MUST use `never` in default case" | Showed the exact pattern |
| [007](tests/007_p4-dynamic-import/) | P4: Dynamic import | 1-line example only | SHOULD + candidate list (> 50KB) | Added decision criteria |

**Key insight:** The AI already *knows* these patterns. What it needs is **where and how** to apply them — not what they are.

## Test Results

### 001: Guideline Impact (3 runs × 3 conditions)

| Condition | Avg Score | vs Baseline |
|-----------|:---:|:---:|
| A: No guidelines | 84.1 | — |
| B: All 28 files (~75K tokens) | 79.3 | **−4.8** |
| C: Curated 10 files (~24K tokens) | 84.9 | **+0.8** |

[→ Details & analysis](tests/001_guideline-impact/)

### 002: Before/After Examples (5 tasks × 2 conditions)

| | D (no examples) | E (with examples) |
|---|:---:|:---:|
| Wins | 3 | 0 |
| Ties | 2 | 2 |
| Total Pass | 18/18 | 17/18 |

[→ Details & analysis](tests/002_before-after-effect/)

### 003: YAML Checklist Format (5 tasks × 2 conditions)

| | A (prose-only) | C (YAML+QR) |
|---|:---:|:---:|
| Total Pass | 18/18 | 17/18 |

[→ Details & analysis](tests/003_checklist-format/)

### 011: Dynamic Check Effect (generate → check → fix)

| Condition | Score | Delta |
|-----------|:---:|:---:|
| baseline-only | 85.3 | — |
| **baseline-then-check** | **95.2** | **+9.9** |

Post-generation check+fix produced the **largest improvement** of any test. [→ Details](tests/011_dynamic-check-effect/)

### 012: Minimal Static + Check (the optimal architecture)

| Condition | Score | Delta |
|-----------|:---:|:---:|
| check-only (0 files) | 87.4 | — |
| **3 files + check** | **96.9** | **+9.5** |

**96.9 — highest score ever.** 3 project-specific files + check+fix is the optimal architecture. [→ Details](tests/012_minimal-static-plus-check/)

## Reproduce

```bash
git clone https://github.com/yunbow/ai-dev-os-benchmark.git
cd ai-dev-os-benchmark

# Each test has its own assets and prompts
cat tests/001_guideline-impact/assets/prompts/curated-guidelines.md
```

<details>
<summary>Repository Structure</summary>

```
ai-dev-os-benchmark/
├── spec/
│   └── benchmark_design.md
├── tests/
│   ├── 001_guideline-impact/
│   │   ├── README.md                  # Summary (EN + JA)
│   │   ├── assets/                    # Prompts, guidelines, eval sheet
│   │   └── results/                   # 3 runs × 3 conditions + analysis.md
│   ├── 002_before-after-effect/
│   │   ├── README.md
│   │   ├── assets/                    # 10 prompts (D/E × 5 tasks)
│   │   └── results/                   # 5 tasks × 2 conditions + analysis.md
│   ├── 003_checklist-format/
│   │   ├── README.md
│   │   ├── assets/                    # 30 prompts (A/B/C × 10 tasks)
│   │   └── results/                   # 5 tasks × 2 conditions + analysis.md
│   └── 004_xxx/                       # Future tests...
└── LICENSE
```

</details>

## Related

| Repository | Description |
|---|---|
| [ai-dev-os](https://github.com/yunbow/ai-dev-os) | Framework specification and theory |
| [rules-typescript](https://github.com/yunbow/ai-dev-os-rules-typescript) | TypeScript / Next.js / Node.js guidelines |
| [rules-python](https://github.com/yunbow/ai-dev-os-rules-python) | Python / FastAPI guidelines |
| [plugin-claude-code](https://github.com/yunbow/ai-dev-os-plugin-claude-code) | Skills, Hooks, and Agents for Claude Code |
| [plugin-kiro](https://github.com/yunbow/ai-dev-os-plugin-kiro) | Steering Rules and Hooks for Kiro |
| [plugin-cursor](https://github.com/yunbow/ai-dev-os-plugin-cursor) | Cursor Rules (.mdc) |
| [cli](https://github.com/yunbow/ai-dev-os-cli) | `npx ai-dev-os init` |

## License

[MIT](./LICENSE)

---

Languages: English | [日本語](docs/i18n/ja/README.md)
