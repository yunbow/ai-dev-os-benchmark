# Test 007: P4 Dynamic Import Fix

## Background

P4 (heavy components use `React.lazy` / `next/dynamic`) had **0% pass rate** in Test 001. The AI never used dynamic imports for heavy client components.

## What Changed

**Before:** Single line example only: `const Editor = dynamic(() => import('./Editor'), { ssr: false });`

**After:** Expanded to SHOULD rule with specific candidates list:
```
Candidates for dynamic import:
* Rich text editors, code editors, markdown renderers
* Chart/graph components (recharts, chart.js)
* Modal/dialog content not visible on initial load
* Any component importing a dependency > 50KB
```

## Result

**Fix confirmed.** Candidate list + SHOULD rule drove 0/4 → 3/3 correct dynamic imports.

| Condition | P4 (dynamic import) | Details |
|-----------|:---:|------|
| Before-fix | **Fail** (0/4) | All static imports |
| After-fix | **Pass** (3/3) | TaskChart, RichTextEditor, CreateTaskDialog → `dynamic()`. TaskList, StatsCards → static (correct) |

[→ Full analysis](results/analysis.md)

---

Languages: English | [日本語](docs/i18n/ja/README.md)
