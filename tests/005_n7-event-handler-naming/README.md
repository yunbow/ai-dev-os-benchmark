# Test 005: N7 Event Handler Naming Fix

## Background

N7 (event handler naming pattern `handle` + noun + verb) had **0% pass rate** in Test 001. The AI consistently used `handleDelete`, `handleSubmit` instead of `handleTaskDelete`, `handleFormSubmit`.

## What Changed

**Before:** No event handler naming rule in naming.md.

**After:** Added §8 "Event Handlers and Callbacks" with MUST rule:
```
* MUST use handle + noun + verb: handleTaskDelete, handleFormSubmit, handleStatusToggle
* ❌ handleDelete, handleSubmit, onSubmit
* ✅ handleTaskDelete, handleProfileUpdate, handleInvitationAccept
```

## Result

**Fix confirmed.** Adding explicit MUST rule with ❌/✅ examples changed handler naming from 0/3 to 5/5.

| Condition | N7 (handle + noun + verb) | Examples |
|-----------|:---:|------|
| Before-fix | **Fail** (0/3) | `handleDelete`, `handleEdit` |
| After-fix | **Pass** (5/5) | `handleTaskDeleteConfirm`, `handleTaskEdit`, `handleStatusToggle` |

[→ Full analysis](results/analysis.md)

---

Languages: English | [日本語](docs/i18n/ja/README.md)
