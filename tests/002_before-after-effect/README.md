# Test 002: Before/After Example Effect — Do code examples improve AI compliance?

## Result

**No improvement.** Adding Before/After code examples (+280 lines, +55%) to security.md did not improve AI compliance on any target item.

| Task | D (no examples) | E (with examples) | Winner |
|------|:---:|:---:|:---:|
| 1. Profile update | All Pass | All Pass (V2 Partial) | D |
| 2. Invitation email | All Pass | All Pass | Tie |
| 3. Login + rate limit | All Pass (+timing prot.) | All Pass | D |
| 4. Task search API | 6/6 | 6/6 | Tie |
| 5. Password reset | 5/5 (+token hash) | 4/5 | **D** |

The model already generates secure code from prose guidelines alone. In Task 5, condition E defined `escapeHtml()` but forgot to call it — superficial pattern copying instead of principle understanding.

**Decision:** Do NOT add Before/After sections to guidelines. Keep inline ❌/✅ examples minimal (1-3 lines).

[→ Full analysis](results/analysis.md)

---

Languages: English | [日本語](docs/i18n/ja/README.md)
