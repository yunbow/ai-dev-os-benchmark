Review the code you just generated against the following coding guidelines. For each guideline violation found:
1. List the violation (file, line, rule violated)
2. Fix the violation in the code

Check ALL of the following areas systematically:

### Security
- [ ] Passwords hashed with bcrypt (cost 12+)
- [ ] CSRF protection (SameSite=lax on cookies)
- [ ] Session cookies have Secure, HttpOnly, SameSite=Lax
- [ ] Password reset tokens have expiration (1 hour)
- [ ] No SQL injection (Prisma parameterized queries only)
- [ ] IDOR prevention: ownership check on ALL mutating operations
- [ ] XSS prevention: HTML escape user input in email templates
- [ ] Invitation tokens use crypto.randomBytes(32), not cuid/uuid
- [ ] API errors return generic messages, no stack traces
- [ ] Rate limiting on ALL auth Server Actions (register, login, reset)
- [ ] Secrets via environment variables only

### Error Handling
- [ ] Server Actions return ActionResult pattern ({ success, data, error })
- [ ] try-catch at appropriate granularity (not wrapping entire functions)
- [ ] User-facing vs log error messages separated
- [ ] error.tsx in EACH route group (root, auth, protected, tasks, teams)
- [ ] not-found.tsx at app root
- [ ] Database error fallback
- [ ] Optimistic update has rollback on failure
- [ ] API error format unified

### Validation
- [ ] Zod schema on server side
- [ ] SAME Zod schema shared client/server (use zodResolver with react-hook-form)
- [ ] Client-side form validation with zodResolver BEFORE server submission
- [ ] Email format check (z.string().email())
- [ ] Password strength (min 8, uppercase, lowercase, number, special)
- [ ] Color code validation (hex regex)
- [ ] Pagination parameter validation (limit min 1, max 100)
- [ ] Search query max length (z.string().max(200))
- [ ] Date range: dueDate MUST use .refine() to check future date

### Naming
- [ ] File names kebab-case (including component files: task-card.tsx, not TaskCard.tsx)
- [ ] Component exports PascalCase
- [ ] Variables/functions camelCase
- [ ] DB columns snake_case (use @@map in Prisma)
- [ ] API endpoints kebab-case
- [ ] Boolean vars start with is/has/can
- [ ] Event handlers: handle + noun + verb (handleTaskDelete, NOT handleDelete)
- [ ] Server Actions start with verb

### Directory Structure
- [ ] Features separated by features/ directory
- [ ] Shared UI components in components/ui/
- [ ] Zod schemas co-located with Server Actions

### Type Safety
- [ ] No `any` usage
- [ ] MUST NOT use `as string` on formData.get() — use Zod parse instead
- [ ] Union types have exhaustive checks (switch + default: never)
- [ ] Proper null/undefined handling with ?. and ??

### Performance
- [ ] No N+1 queries (use Prisma include/select)
- [ ] `use client` only on interactive components
- [ ] Heavy components (charts, editors, dialogs) use next/dynamic

### Accessibility
- [ ] Form elements have associated <label>
- [ ] ALL icon-only buttons have aria-label
- [ ] Modals have role="dialog" and aria-modal
- [ ] Keyboard accessible

After listing all violations, fix them all in the code.
