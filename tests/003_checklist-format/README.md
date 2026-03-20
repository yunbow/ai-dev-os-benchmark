# Test 003: YAML Checklist Format — Does structured metadata improve AI compliance?

## Result

**No improvement.** Adding YAML frontmatter + Quick Rules summary (+165 lines, +33%) to security.md did not improve compliance.

| Task | A (prose-only) | C (YAML+QuickRules) | Winner |
|------|:---:|:---:|:---:|
| 1. Login API | 5/5 | 5/5 | Tie |
| 2. Task CRUD | 4/4 | 3/4 | **A** |
| 3. Team invitation | 3/3 | 3/3 | Tie |
| 4. Webhook handler | 3/3 | 3/3 | Tie |
| 5. Middleware headers | 3/3 | 3/3 | Tie |
| **Total** | **18/18** | **17/18** | **A** |

The prose-only condition scored higher. YAML and Quick Rules duplicate information already in the prose body — adding tokens without adding information.

**Decision:** Do NOT add YAML frontmatter or Quick Rules to guidelines. Focus on prose clarity.

[→ Full analysis](results/analysis.md)

---

Languages: English | [日本語](docs/i18n/ja/README.md)
