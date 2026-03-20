# Checklist Format Benchmark Results — Final

> Date: 2026-03-21
> Test: Does adding YAML frontmatter + Quick Rules summary to security.md improve AI compliance?
> Conditions: A (prose-only, 505 lines) vs C (YAML + Quick Rules, 670 lines)
> Tasks: 5 security-focused implementation tasks (reduced from 10)
> Note: Condition B (YAML-only) was skipped based on prior findings that adding content causes attention dilution

## Summary

| Task | A (prose) | C (yaml+QR) | Winner |
|------|:---:|:---:|:---:|
| 1. Login API | 5/5 | 5/5 | Tie |
| 2. Task CRUD | 4/4 | 3/4 | **A** |
| 3. Team invitation email | 3/3 | 3/3 | Tie |
| 4. Webhook handler | 3/3 | 3/3 | Tie |
| 5. Middleware security headers | 3/3 | 3/3 | Tie |
| **Total** | **18/18** | **17/18** | **A** |

## Detailed Results

### Task 1: Login API

**Targets:** S1 (bcrypt), S2 (CSRF/SameSite), S3 (cookie flags), S10 (rate limiting), S11 (error leak)

| Item | A | C |
|------|:---:|:---:|
| S1: bcrypt | Pass | Pass |
| S2: CSRF/SameSite | Pass | Pass |
| S3: Cookie flags | Pass | Pass |
| S10: Rate limiting | Pass | Pass |
| S11: Error leak prevention | Pass | Pass |

Both conditions achieved perfect scores. No difference.

### Task 2: Task CRUD

**Targets:** S3 (Zod validation), S6 (IDOR), S8 (RBAC), S10 (error leak)

| Item | A | C |
|------|:---:|:---:|
| S3: Zod validation | Pass | Pass |
| S6: IDOR prevention | Pass | Pass |
| S8: RBAC | **Pass** | **Fail** |
| S10: Error leak prevention | Pass | Pass |

The only failure across all 10 evaluations. Condition A implemented `requireTaskWriteAccess()` with OWNER/ADMIN role checks for destructive operations. Condition C's `requireTaskAccess()` only checked team membership — any team member could update/delete tasks regardless of role.

### Task 3: Team Invitation Email

**Targets:** S4 (no secrets in code), S8 (HTML escaping), S9 (crypto token)

| Item | A | C |
|------|:---:|:---:|
| S4: No secrets in code | Pass | Pass |
| S8: HTML escaping | Pass | Pass |
| S9: Crypto token | Pass | Pass |

Both used `crypto.randomBytes(32)` and `escapeHtml()`. No difference.

### Task 4: Webhook Handler

**Targets:** S11 (signature verification), S12 (replay prevention), S13 (timestamp validation)

| Item | A | C |
|------|:---:|:---:|
| S11: Signature verification | Pass | Pass |
| S12: Replay prevention | Pass | Pass |
| S13: Timestamp validation | Pass | Pass |

Both implemented HMAC-SHA256 verification, idempotency checks, and 5-minute timestamp windows. No difference.

### Task 5: Middleware Security Headers

**Targets:** S6 (Origin/Referer), S7 (clickjacking), S14 (CSP nonce)

| Item | A | C |
|------|:---:|:---:|
| S6: Origin/Referer checks | Pass | Pass |
| S7: Clickjacking prevention | Pass | Pass |
| S14: CSP nonce | Pass | Pass |

Both generated per-request nonces with `crypto.randomUUID()`, set `X-Frame-Options: DENY`, and used `strict-dynamic` in CSP. No difference.

## Decision

Based on the evaluation criteria from benchmark_design.md §11.6:

| Threshold | Condition | Result |
|-----------|-----------|--------|
| C ≥ A+10% → Adopt YAML + Quick Rules | | ❌ |
| C ≥ A+5% → Adopt YAML only | | ❌ |
| C < A+5% → **Do not adopt** | | **✅ This outcome** |
| B ≈ C → Adopt YAML only | | (B was skipped) |

**YAML frontmatter + Quick Rules did NOT improve AI compliance.** The prose-only format scored higher (18/18 vs 17/18).

## Why YAML + Quick Rules Didn't Help

1. **The model already parses prose guidelines effectively.** Both conditions achieved near-perfect scores (17-18 out of 18), indicating that the prose format is already well-understood by the AI.

2. **Additional structure adds tokens without adding information.** The YAML frontmatter and Quick Rules repeat information already present in the prose body. The +33% token increase (505 → 670 lines) provides no new rules — only reformatted duplicates.

3. **Consistent with prior benchmark findings.** This is the third test confirming the "less is more" principle:
   - guideline-impact: All guidelines (75K tokens) < No guidelines
   - before-after-effect: With examples (785 lines) ≤ Without examples (505 lines)
   - checklist-format: YAML+QR (670 lines) ≤ Prose-only (505 lines)

## Recommendations

1. **Do NOT add YAML frontmatter or Quick Rules to guideline files.** The maintenance cost (keeping YAML in sync with prose) is not justified by any improvement.

2. **Focus on prose clarity.** The model responds to clear, specific rule wording — not to structural formatting.

3. **The optimal guideline format is: concise prose + minimal inline ❌/✅ examples.** No YAML, no Before/After sections, no Quick Rules summaries.
