# Test 005: N7 Event Handler Naming Fix — Analysis

> Date: 2026-03-21

## Result

| Condition | N7 (handle + noun + verb) | Handler Names |
|-----------|:---:|------|
| Before-fix | **Fail** (0/3) | `handleDelete`, `handleEdit`, `handleToggleStatus` |
| After-fix | **Pass** (5/5) | `handleStatusToggle`, `handleTaskDeleteConfirm`, `handleDeleteDialogOpen`, `handleDeleteDialogClose`, `handleTaskEdit` |

## What Made the Difference

**Before:** No event handler naming rule in naming.md. The AI defaults to `handle` + verb (the most common pattern in React tutorials).

**After:** Added explicit MUST rule with ❌/✅ examples:
```
* MUST use handle + noun + verb: handleTaskDelete, handleFormSubmit, handleStatusToggle
* ❌ handleDelete, handleSubmit, onSubmit
* ✅ handleTaskDelete, handleProfileUpdate, handleInvitationAccept
```

The AI not only adopted the pattern but applied it consistently to all 5 handlers — including splitting complex actions into separate handlers (`handleDeleteDialogOpen`, `handleDeleteDialogClose`) with proper nouns.

## Guideline Writing Principle

The ❌/✅ inline examples were critical here. The AI needs to see both the wrong pattern (which it would naturally produce) and the correct pattern. This is different from Before/After sections (which Test 002 showed don't help) — inline examples are 1-2 lines and directly adjacent to the rule.
