# Test 007: P4 Dynamic Import Fix — Analysis

> Date: 2026-03-21

## Result

| Condition | P4 (dynamic import) | Components |
|-----------|:---:|------|
| Before-fix | **Fail** (0/4) | All static imports (TaskChart, RichTextEditor, CreateTaskDialog, TaskList) |
| After-fix | **Pass** (3/3) | Dynamic: TaskChart (`ssr: false`), RichTextEditor (`ssr: false`), CreateTaskDialog. Static: TaskList, StatsCards (correct) |

## What Made the Difference

**Before:** Single code example only: `const Editor = dynamic(() => import('./Editor'), { ssr: false });`. No rule about when to use it.

**After:** SHOULD rule with explicit candidate list:
```
Candidates for dynamic import:
* Rich text editors, code editors, markdown renderers
* Chart/graph components (recharts, chart.js)
* Modal/dialog content not visible on initial load
* Any component importing a dependency > 50KB
```

The AI correctly identified all 3 candidates (chart with recharts, rich text editor, dialog) and left lightweight components (TaskList, StatsCards) as static imports. It also applied `ssr: false` correctly to browser-only components and added loading placeholders.

## Guideline Writing Principle

The **candidate list** was the key differentiator. The before-fix had the syntax (how to use `dynamic()`) but not the decision criteria (when to use it). The after-fix told the AI exactly which component types are candidates, enabling correct judgment.

| Guideline element | Effect |
|-------------------|--------|
| SHOULD keyword | Signals importance without being absolute |
| Candidate list | Enables pattern matching: "recharts → chart component → dynamic import" |
| Threshold (> 50KB) | Quantitative decision boundary |
| Loading placeholder example | Shows the complete pattern (not just the import) |
