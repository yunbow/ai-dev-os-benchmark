Please implement the following task management application based on the requirements below. Follow the coding guidelines provided after the requirements.

### Requirements

# TaskFlow - Task Management Application

## Product Requirements Document

### Overview

TaskFlow is a collaborative task management application for small-to-medium teams. Users can organize personal tasks with categories, share workspaces with teammates, and manage projects through a clean, responsive interface.

### Tech Stack

| Technology | Version |
|------------|---------|
| Next.js | 15 (App Router) |
| TypeScript | 5.x (strict mode) |
| Prisma | 6.x + PostgreSQL |
| NextAuth.js | v5 |
| Tailwind CSS | 4.x + shadcn/ui |
| Zod | 3.x |

---

## Functional Requirements

### F1: User Authentication

Implement a complete authentication system using NextAuth.js v5.

- **Registration** - Email/password sign-up with the following validations:
  - Email must be valid format and unique
  - Password minimum 8 characters, must include uppercase, lowercase, number, and special character
  - Passwords must be securely hashed before storage
- **Login / Logout** - Session-based authentication with proper CSRF protection
- **Password Reset** - Email-based reset flow:
  - Generate a single-use token with a 1-hour expiry
  - Send a reset link via email
  - Invalidate the token after use or expiry
- **Session Management** - Cookies must be configured with `SameSite`, `Secure`, and `HttpOnly` flags

### F2: Task Management (CRUD)

Core task operations with the following fields: `title` (required, max 200 chars), `description` (optional, max 2000 chars), `status` (TODO / IN_PROGRESS / DONE), `priority` (LOW / MEDIUM / HIGH), `dueDate` (optional), `categoryId` (optional), `assigneeId` (optional).

- **Create Task** - Use Server Actions with the ActionResult pattern. Return structured success/error responses rather than throwing exceptions.
- **List Tasks** - Support filtering by status, priority, category, and assignee. Support sorting by createdAt, dueDate, and priority. Implement cursor-based pagination (20 items per page). Ensure queries avoid N+1 problems when loading related category and assignee data.
- **Edit / Delete Task** - Only the task creator or a team admin may modify or delete a task. Verify resource ownership on every mutating request to prevent IDOR vulnerabilities.
- **Status Toggle** - Implement optimistic UI updates on the client. Handle concurrent edits gracefully (e.g., via an `updatedAt` field check).
- **Search** - Full-text search across task title and description. All user input must be parameterized to prevent SQL injection.

### F3: Category Management

Users can organize tasks into color-coded categories.

- **CRUD Operations** - Each category has a `name` (required, max 50 chars) and a `color` (required, must be a valid 6-digit hex code such as `#FF5733`). Validate the color format on both client and server.
- **Color Display** - Render category colors as visual badges or labels alongside tasks. Sanitize user-supplied color values before rendering to prevent XSS through style injection.
- **Scoping** - Categories are scoped per-user for personal tasks and per-team for team tasks.

### F4: Team Collaboration

Support team-based workflows with role-based access control.

- **Create Team** - Any authenticated user can create a team and becomes its Owner.
- **Roles** - Three permission levels:
  - **Owner** - Full control (manage members, delete team, all task operations)
  - **Member** - Create, edit, and delete own tasks; view all team tasks; change task status
  - **Viewer** - Read-only access to team tasks
- **Invite Members** - Send email invitations with a secure, single-use token (expires in 7 days). Invitation emails must use safe HTML rendering with no raw user input.
- **Task Sharing and Assignment** - Tasks within a team workspace are visible to all team members based on their role. Tasks can be assigned to any team member. Every mutating operation must verify that the requesting user is an active member of the relevant team with sufficient permissions.

### F5: API Design

Expose a RESTful API for all core resources under `/api/v1/`.

- **Endpoints** - Follow standard REST conventions:
  - `GET /api/v1/tasks` - List tasks (with query params for filter, sort, pagination)
  - `POST /api/v1/tasks` - Create task
  - `GET /api/v1/tasks/:id` - Get task detail
  - `PATCH /api/v1/tasks/:id` - Update task
  - `DELETE /api/v1/tasks/:id` - Delete task
  - Similar patterns for `/categories`, `/teams`, `/teams/:id/members`
- **Error Responses** - Use a consistent JSON error format across all endpoints:
  ```json
  { "error": { "code": "VALIDATION_ERROR", "message": "Human-readable message", "details": [] } }
  ```
  Never expose stack traces, internal paths, or database details in error responses.
- **Pagination** - Use cursor-based pagination. Response shape: `{ "data": [], "nextCursor": "string | null", "hasMore": boolean }`.
- **Rate Limiting** - Apply rate limits per endpoint category:
  - Authentication endpoints: 5 requests/minute
  - Write operations: 30 requests/minute
  - Read operations: 100 requests/minute

---

## Non-Functional Requirements

### Responsive Design

The application must be fully usable on mobile (320px+), tablet (768px+), and desktop (1024px+). Use Tailwind CSS breakpoints consistently throughout the application. Navigation should collapse into a mobile-friendly menu on small screens.

### Loading and Error States

- Use React Suspense boundaries with meaningful skeleton loaders for async data
- Implement error boundaries at the route segment level using Next.js `error.tsx` conventions
- Show inline error messages for form validation failures
- Display toast notifications for async operation results (success/failure)

### Input Validation

All user input must be validated on both client and server using Zod schemas. Share validation schemas between client and server to ensure consistency. The server must never trust client-side validation alone.

### Accessibility

- All interactive elements must be keyboard-navigable
- Use semantic HTML elements (`nav`, `main`, `section`, `button`, etc.)
- Include appropriate ARIA attributes for dynamic content (live regions, modal dialogs, status messages)
- Maintain a minimum color contrast ratio of 4.5:1 for normal text

### Coding Guidelines

# All Guidelines (Condition B)

> Concatenated from ai-dev-os-rules-typescript/03_guidelines/


---
# ai-coding.md (common/)
---

# AI-Assisted Coding Guidelines

This guideline defines the **standards for working with AI coding assistants** to maximize quality and minimize rework.

# 1. Key Principles

* **Rules over instructions**
  Do not rely on natural language instructions alone. Codify expectations as explicit rules in guidelines.
* **Verify, don't trust**
  AI-generated code must be reviewed with the same rigor as human-written code. AI output confidence does not equal correctness.
* **Structure for AI readability**
  Write code in patterns that AI can consistently reproduce. Predictable structures reduce hallucination.
* **Less is more**
  Too many rules degrade AI performance. A poorly written or overly verbose context file can produce worse results than no context file at all. Only include rules that address real, observed problems.

# 2. Prompting and Context

## 2.1 Context Management
* MUST reference AI Dev OS guidelines from CLAUDE.md / .cursorrules / AGENTS.md — do not inline rules in prompts
* MUST keep the context file (CLAUDE.md, etc.) under 500 lines — split into referenced files if longer
* MUST NOT include sensitive information (API keys, credentials, PII) in prompts or context files
* SHOULD NOT list all guideline files in the context file — only include the 10-15 most impactful guidelines (or approximately 300-500 lines total)
* SHOULD prioritize guidelines for areas where AI frequently makes mistakes (security, error handling, naming)
* MUST NOT include vague rules ("write clean code", "handle errors appropriately") — these override the model's good defaults with ambiguity

### Why fewer rules can be better
Research shows that AI models perform worse when given too many context rules. The model's attention is diluted across all rules, causing it to miss important ones. A focused set of 10-15 high-impact rules (approximately 300-500 lines) consistently outperforms an exhaustive set of 30+ rules. Add rules only when you observe a recurring problem that the AI fails to solve on its own.

### Two-tier context strategy: Static context + Dynamic checks

| Tier | What | How | Purpose |
|------|------|-----|---------|
| **Static context** | CLAUDE.md / .cursorrules / AGENTS.md | Always loaded by AI | Guide real-time code generation with 10-15 high-impact rules (~300-500 lines) |
| **Dynamic checks** | `ai-dev-os-check`, `ai-dev-os-scan`, `ai-dev-os-review` | Invoked on demand | Verify against ALL guidelines (30+) at review time |

**Static context (CLAUDE.md) should include:**
- Framework-specific overview (architecture, patterns)
- Security rules (always critical, even if rarely violated)
- Error handling patterns (most common AI mistake area)
- Naming conventions (consistency across codebase)
- Project structure (AI needs this for correct file placement)

**Static context should NOT include:**
- Every guideline file (causes attention dilution)
- Rules the AI already follows by default (e.g., "use const instead of let" — modern models know this)
- Rarely relevant rules (rate-limiting, CORS, CI/CD — check these via `ai-dev-os-scan` instead)

**Why not auto-remove low-frequency rules from CLAUDE.md?**
Low violation frequency does not mean low importance. Security rules with zero violations are *working* — removing them would cause immediate regression. Instead, curate the static context manually at setup time, and rely on dynamic checks for comprehensive coverage.

### Token cost awareness
The static context (8-10 guideline files referenced in CLAUDE.md) typically adds approximately 3,000-5,000 tokens to each request. This is a small fraction of modern model context windows (128K-1M tokens) but can accumulate across many requests. To minimize overhead:
* Keep CLAUDE.md references to 10-15 files (the two-tier strategy above)
* Use `ai-dev-os-report` to measure your actual token footprint
* Dynamic checks (`ai-dev-os-check`, `ai-dev-os-scan`) do not add to per-request cost — they run on demand

## 2.2 Task Scoping
* MUST break large tasks into small, focused requests (one file or one function per request)
* MUST specify the exact file path and function name when requesting changes to existing code
* SHOULD provide a Before/After example when explaining a pattern you want the AI to follow

## 2.3 Effective Prompting Patterns
* **Do**: "Add auth check using the ActionResult pattern defined in server-actions.md"
* **Don't**: "Add authentication" (too vague — AI will guess the implementation pattern)
* **Do**: "Refactor this function following the early-return pattern in code.md section 2.3"
* **Don't**: "Clean up this code" (no specific standard referenced)

# 3. AI-Generated Code Review

## 3.1 Mandatory Review Checklist
When reviewing AI-generated code, MUST check:

* [ ] **Security**: No hardcoded secrets, proper input validation, no SQL injection vectors
* [ ] **Error handling**: Follows the project's error handling pattern (not generic try-catch)
* [ ] **Naming**: Follows naming.md conventions (not AI's default naming preferences)
* [ ] **Imports**: No phantom imports (libraries that don't exist or aren't installed)
* [ ] **Types**: No `any` type introduced, proper type narrowing used
* [ ] **Consistency**: Matches existing code patterns in the same file/module
* [ ] **Tests**: If the change is testable, tests are included or updated

## 3.2 Common AI Pitfalls
AI coding assistants frequently make these mistakes. Be especially vigilant:

| Pitfall | What to Check | Guideline Reference |
|---------|--------------|---------------------|
| **Phantom imports** | Library exists in package.json | code.md |
| **Outdated API usage** | API matches the installed version | code.md |
| **Overly generic error handling** | Uses project-specific error patterns | error-handling.md |
| **Hardcoded values** | Uses environment variables for config | env.md, security.md |
| **Missing auth checks** | Server Actions include auth() call | server-actions.md (if Next.js) |
| **Inconsistent naming** | Follows project naming conventions | naming.md |
| **Unnecessary abstraction** | Justified by actual reuse, not hypothetical | code.md |
| **Missing edge cases** | Null checks, empty arrays, boundary values | validation.md |

## 3.3 Review Depth by Risk Level

| Risk Level | Scope | Review Depth |
|-----------|-------|-------------|
| **High** | Auth, payment, data deletion, security | Line-by-line review, test coverage required |
| **Medium** | Business logic, API endpoints, data models | Functional review, spot-check implementation |
| **Low** | UI components, formatting, documentation | Quick scan for obvious issues |

# 4. Code Structure for AI Consistency

## 4.1 Predictable File Structure
* MUST follow the project structure defined in project-structure.md — AI generates more consistent code when file locations are predictable
* MUST use barrel exports (index.ts) for feature modules — AI can import correctly without guessing paths
* MUST NOT create deeply nested directories (max 4 levels) — AI struggles with deeply nested paths

## 4.2 Function Design for AI
* MUST keep functions ≤ 30 lines — AI generates better code when functions are focused
* MUST use early returns — AI is more likely to handle edge cases correctly with early-return patterns
* MUST define types explicitly for function parameters and return values — AI uses them as contracts
* SHOULD use JSDoc for complex business logic — AI reads JSDoc as additional context

```ts
// GOOD: AI can reproduce this pattern consistently
/** Validates and processes a payment refund */
export async function processRefund(
  refundRequest: RefundRequest
): Promise<ActionResult<Refund>> {
  const session = await auth()
  if (!session) return { success: false, error: "Unauthorized" }

  const validation = refundSchema.safeParse(refundRequest)
  if (!validation.success) return { success: false, error: validation.error.message }

  // ... business logic
}

// BAD: AI will generate inconsistent patterns
export async function processRefund(req: any) {
  try {
    // ... everything in one big try-catch
  } catch (e) {
    console.log(e)
  }
}
```

## 4.3 Pattern Consistency
* MUST use the same pattern for similar operations across the codebase (e.g., all CRUD operations follow the same structure)
* MUST NOT mix patterns in the same module (e.g., callbacks and async/await, different error handling approaches)
* SHOULD create a reference implementation for each pattern, then tell AI "follow the pattern in [file]"

# 5. AI Dev OS Integration

## 5.1 Rule Harvesting Workflow
After every code review where AI-generated code was corrected:
1. Identify what the AI got wrong
2. Ask: "Is this a one-off mistake or a recurring pattern?"
3. If recurring, extract it as a rule using `ai-dev-os-extract` (or equivalent)
4. Add the rule to the appropriate L3 guideline

## 5.2 Guideline Effectiveness Tracking
* SHOULD track which guidelines are most frequently violated by AI — these may need clearer wording or examples
* SHOULD track which guidelines AI follows perfectly — these confirm the rule format is effective
* Use `ai-dev-os-report` periodically to identify patterns

## 5.3 When AI Cannot Follow a Rule
If AI consistently fails to follow a specific guideline:
1. Add a concrete code example (Before/After) to the guideline
2. Add the rule to the project's checklist template
3. If still failing, consider adding a pre-commit hook or linter rule for automated enforcement

## 5.4 Rule Suppression (Escape Hatch)
When a specific guideline rule is not applicable to a particular module or file, suppress it explicitly rather than ignoring it silently:

* **Project-level suppression**: Add a `project-specific/` guideline that overrides the rule for specific directories or modules. The Specificity Cascade ensures project-specific rules take precedence over common rules.
* **File-level suppression**: Add a comment at the top of the file explaining why a rule does not apply:
  ```
  // ai-dev-os-ignore: rule-name — reason for suppression
  ```
* **Documentation**: All suppressions MUST include a reason. Undocumented suppressions should be flagged by `ai-dev-os-scan`.

This is analogous to `// eslint-disable-next-line` or `# noqa` — every project has legitimate exceptions.

## 5.5 Rule Maturity Labels

Tag each L3 guideline rule with a maturity label to indicate confidence level:

| Label | Meaning | Action |
|-------|---------|--------|
| `[draft]` | Newly extracted rule, not yet validated across projects | Review after 2-4 weeks of use |
| `[proven]` | Validated through multiple code reviews, AI consistently follows it | Promote to static context (CLAUDE.md) if high-impact |
| `[deprecated]` | Rule is outdated, superseded, or no longer applicable | Remove in next guideline update cycle |

Use these labels in guideline files as inline markers:

```markdown
* MUST: Always validate user input at API boundaries `[proven]`
* MUST: Use structured logging with request trace IDs `[draft]`
* ~~MUST: Use moment.js for date formatting~~ `[deprecated]` — replaced by native Intl API
```

The `ai-dev-os-evolve` command can propose label changes based on violation patterns.

---
# cicd.md (common/)
---

# CI/CD Guidelines

This document defines the CI/CD pipeline design policy for Next.js applications.

**Target Cloud:** Vercel / GitHub Actions

---

## 1. Core Principles

- **Staged pipeline**: Safe rollout through CI → Preview → Production. "Safe" means: every stage must pass automated checks (lint, type-check, tests, build) before proceeding, with auto-rollback on post-deployment validation failure.
- **Post-Deployment Validation**: Execute health checks and Smoke Tests after deployment. Smoke Tests verify: the app starts, the home page renders, authentication flow completes, and at least one API route returns a 200 response.

---

## 2. GitHub Actions-Based CI

### Recommended Workflow

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main, develop]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20

      # Leverage caching
      - uses: actions/cache@v4
        with:
          path: ~/.npm
          key: ${{ runner.os }}-node-${{ hashFiles('package-lock.json') }}

      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
      - run: npm run build

      # Upload build artifacts for reuse during deployment
      - uses: actions/upload-artifact@v4
        with:
          name: build-artifact
          path: .next/

  # Separate E2E tests into a dedicated job (to avoid blocking fast feedback from unit tests)
  e2e:
    runs-on: ubuntu-latest
    needs: verify
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run e2e
```

---

## 3. Preview Deployment

### Vercel

- On PR creation, **Vercel PR Preview is automatically generated**
- Preview URL is displayed in PR comments
- Used for UI/UX design review and final review

### Reusing Build Artifacts

```yaml
- uses: actions/download-artifact@v4
  with:
    name: build-artifact
```

Reuse build artifacts created during CI to reduce duplicate build time.

---

## 4. Production Deployment

### Vercel Production

- Auto-deploy after merging into the main branch
- Manual Approval required (Protected Branch settings)
- Supports Edge Functions / ISR / Server Actions

### Post-Deployment Validation

Execute external health checks / Smoke Tests after deployment completion. Auto-rollback on failure:

- **Vercel**: Revert to the previous version from deployment history

---

## 5. Release Strategy

- **Semantic Versioning**: `MAJOR.MINOR.PATCH`
- **GitHub Release integration**
- **Automatic CHANGELOG generation**: `release-please` / `changesets` / `semantic-release`
- **Deployment gate**: Manual Approval required before main → Production deployment

---

## 6. Database Migration (Prisma Migrate)

- **CI**: `prisma validate` + `prisma format`
- **Production migrate**: Manual or safe CD stage
  - Non-destructive migrations → Auto-execute within the CD pipeline
  - Changes requiring downtime → Execute manually during a maintenance window
- Manage execution order considering **version mismatches between application and DB schema**

---

## 7. Secrets / Environment Variable Management

| Platform | Management Location |
|----------------|---------|
| GitHub Actions | Actions secrets |
| Vercel | Project Environment Variables |

- Do not handle `.env` files directly; inject from Secrets
- Protect production secrets so they are not exposed in PRs

---

## 8. Rollback Strategy

| Platform | Method |
|----------------|------|
| Vercel | Instant Rollback with one click in the UI |
| GitHub | Release Revert → Auto-deploy PR to main |

**Always execute auto-rollback when Post-Deployment Validation fails.**

---

## 9. Performance Measurement / Monitoring

- Vercel Analytics / Speed Insights
- Sentry (incident monitoring)
- Logtail / Datadog (logs)
- Automated Lighthouse checks

---

## 10. Pipeline Optimization

- **Leverage dependency caching**: `actions/cache@v4`
- **Use npm ci** (fast install from package-lock.json)
- **Test parallelization**: Run tests in parallel
- **Next.js incremental build**: Differential builds on Vercel

---

## 11. Monorepo Support (As Needed)

Leverage NX / Turborepo:

- Split caching
- Parallel execution
- Affected scope detection (Affected Graph)

---

## Summary

| Item | Policy |
|------|------|
| CI | Unified with GitHub Actions |
| Frontend | Vercel |
| Quality Assurance | PR Preview + Post-Deployment Validation |
| Release | Semantic Versioning + Manual Approval |
| Rollback | Automated + One-click |
| Secrets | Strict management (via Secrets) |

## Before/After Example

```typescript
// ❌ Before: Running all checks in a single step with no caching
const ci = {
  steps: [
    "npm install",     // Full install every time
    "npm run lint && npm test && npm run build && npm run e2e",
  ],
};
```

```typescript
// ✅ After: Staged pipeline with caching and parallel jobs
const ci = {
  verify: {
    cache: "actions/cache@v4",
    steps: ["npm ci", "npm run lint", "npm run typecheck", "npm test", "npm run build"],
  },
  e2e: { needs: "verify", steps: ["npm ci", "npm run e2e"] },
};
```

---
# code.md (common/)
---

# Coding Standards & Static Analysis Guidelines

This guideline defines the **TypeScript coding standards and static analysis tool policies** to be enforced across the entire project.

# 1. Key Principles
* **Prioritize readability and maintainability**
  Write code that communicates intent, rather than being concise or abbreviated.
* **Enforce type safety**
  Express intent through types rather than relying solely on inference.
* **Ensure quality through static analysis**
  Enforce formatting and code quality through tooling, not manual effort.

# 2. TypeScript Coding Standards

## 2.1 Type Definition Placement
* Project type definitions **must be separated into dedicated files**
* Use `type` for data structures, `interface` for contracts expected to change

```ts
type User = {
  id: string
  name: string
}

interface UserRepository {
  findById(id: string): Promise<User>
}
```

## 2.2 Handling Side Effects

* Functions with side effects must use naming conventions that signal mutation or I/O. Specifically:
  * **Prefix with a verb that implies external interaction**: `fetch`, `save`, `send`, `delete`, `upload`, `sync`, `notify`, `enqueue`
  * **Pure functions use computational verbs**: `calculate`, `format`, `parse`, `transform`, `validate`, `build`, `merge`
  * **Never use generic names** like `handle`, `process`, `do`, `run` for functions with side effects unless the name also includes the specific resource (e.g., `processPayment` is acceptable, `processData` is not)
* Do not create ambiguous utility functions

```ts
fetchUser()      // Has side effects - "fetch" signals network I/O
calculatePrice() // Pure function - "calculate" signals computation only
saveOrder()      // Has side effects - "save" signals persistence
buildQuery()     // Pure function - "build" signals construction
```

## 2.3 Prohibit Enum → Use Union Literals

```ts
type Theme = 'dark' | 'light'
```

Use Enum **only when external API compatibility is required**.

# 3. Lint Standards

## 3.1 Rule Sets

Recommended sets:

```
@typescript-eslint/recommended
import/order
no-unused-vars
no-redeclare
eqeqeq
```

Rules to enforce:

| Rule | Reason |
| --- | --- |
| strict:true + TS type rules | Foundation of type safety |
| no-explicit-any | Maintains type safety |
| no-unused-vars | Reduces unnecessary code |
| import/order | Improves readability |
| no-console | Prevents leftover debug statements |

## 3.2 unused-imports

```
eslint-plugin-unused-imports
```

Auto-removal is required.

## 3.3 Import Order Rules

```
builtin → external → internal → relative
```

# 4. Prettier

## 4.1 Configuration

```js
// prettier.config.js
/** @type {import('prettier').Config} */
const config = {
  semi: true,
  singleQuote: false,
  tabWidth: 2,
  trailingComma: "es5",
  printWidth: 100,
  plugins: ["prettier-plugin-tailwindcss"],
};
```

| Setting | Value | Reason |
|------|-----|------|
| `semi` | `true` | Follows TypeScript / Next.js standard conventions |
| `singleQuote` | `false` | Prioritizes consistency with JSON and JSX |
| `trailingComma` | `"es5"` | Adds trailing commas within ES5 compatibility (excludes function arguments) |
| `printWidth` | `100` | Ensures readability during code review |
| `tabWidth` | `2` | Standard indentation width |
| `prettier-plugin-tailwindcss` | - | Auto-sorts Tailwind classes |

# 5. CI / Git Hooks Integration

Static analysis and formatting **must not rely on manual execution**.
Always automate the following:

* Lint & format checks on commit
* CI as first line of defense on push / PR

---

# 6. Comment Standards

* Do not use comments to explain logic
* Only document intent, side effects, and exceptional conditions

```ts
/**
 * Calculate order amount
 * @throws ValueError
 */
```

---

# 7. Code Reuse Patterns

## 7.1 Server Actions Factory Pattern

**Purpose**: Centralize authentication, validation, and error handling

### Base Pattern: withAction

```ts
// lib/actions/action-helpers.ts
export function withAction<TInput, TOutput>(
  schema: z.ZodSchema<TInput>,
  handler: (input: TInput, userId: string) => Promise<TOutput>
): (input: TInput) => Promise<ActionResult<TOutput>> {
  return async (input) => {
    try {
      const session = await requireAuth();
      const validated = schema.parse(input);
      const result = await handler(validated, session.user.id);
      return { success: true, data: result };
    } catch (error) {
      return handleActionError(error);
    }
  };
}
```

### Resource Save Factory

```ts
// features/{domain}/server/resource-save-helper.ts
export function createResourceSaveAction<T extends ResourceBase>(
  options: ResourceSaveOptions<T>
) {
  return withAction(options.schema, async (input, userId) => {
    await requireProjectOwnership(input.projectId, userId);
    await checkQuota(userId, options.quotaCost);
    return options.save(input);
  });
}

// Usage example
export const saveProduct = createResourceSaveAction({
  schema: productSchema,
  quotaCost: 10,
  save: (data) => prisma.product.upsert({ ... })
});
```

### Image Generation Factory

```ts
// features/{domain}/server/ai-generation-helper.ts
export function createImageGenerationAction<T>(
  options: ImageGenerationOptions<T>
) {
  return withAction(options.schema, async (input, userId) => {
    const remaining = await checkQuota(userId, options.quotaCost);
    const jobId = await enqueueJob({ ...input, type: options.type });
    return { jobId, quotaRemaining: remaining };
  });
}
```

## 7.2 Authentication & Authorization Helpers

```ts
// lib/actions/auth-helpers.ts

// Simple authentication check
export async function requireAuth(): Promise<Session> {
  const session = await getSession();
  if (!session) throw new UnauthorizedError();
  return session;
}

// Project ownership check
export async function requireProjectOwnership(
  projectId: string,
  userId: string
): Promise<Project> {
  const project = await prisma.project.findUnique({
    where: { id: projectId, userId }
  });
  if (!project) throw new ForbiddenError();
  return project;
}

// Ownership check via relation
export async function requireRelationOwnership<T>(
  config: RelationConfig<T>
): Promise<T> {
  const record = await config.findRecord();
  if (!record || record.userId !== config.userId) {
    throw new ForbiddenError();
  }
  return record;
}
```

## 7.3 API Client Centralization

```ts
// lib/api/fetch-client.ts
export async function fetchWithAuth<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    }
  });

  if (!res.ok) {
    throw new ApiError(res.status, await res.text());
  }

  return res.json();
}

// Usage example: eliminating duplication
// ❌ Writing fetch directly in each component
const res = await fetch('/api/generate/auto-config', { ... });

// ✔ Using the shared client
const result = await fetchWithAuth<AutoConfigResult>(
  '/api/generate/auto-config',
  { method: 'POST', body: JSON.stringify(data) }
);
```

## 7.4 Hooks Centralization

### Generic CRUD Hook

```ts
// features/{domain}/hooks/useResourceCRUD.ts
export function useResourceCRUD<T extends { id?: string }>(
  options: UseResourceCRUDOptions<T>
) {
  const [items, setItems] = useState<T[]>(options.initialItems);

  const addItem = useCallback((item: T) => {
    setItems(prev => [...prev, { ...item, id: item.id || generateId() }]);
  }, []);

  const updateItem = useCallback((id: string, updates: Partial<T>) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ));
  }, []);

  const deleteItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  return { items, addItem, updateItem, deleteItem };
}
```

## 7.5 Component Reuse Patterns

### Base Component + Specialized Component

```tsx
// Base: shared/BaseResourceDialog.tsx
export function BaseResourceDialog({
  title,
  onSubmit,
  renderOptions,
  ...props
}: BaseProps) {
  return (
    <Dialog {...props}>
      <DialogHeader>{title}</DialogHeader>
      <FileUpload />
      {renderOptions?.()}
      <StatusBanner />
      <SubmitButton onClick={onSubmit} />
    </Dialog>
  );
}

// Specialized: ProductEditDialog.tsx
export function ProductEditDialog(props) {
  return (
    <BaseResourceDialog
      title="Edit Product"
      onSubmit={handleProductSubmit}
      renderOptions={() => (
        <>
          <CategorySelector />
          <PriceInput />
        </>
      )}
    />
  );
}
```

## 7.6 Criteria for Code Reuse

| Condition | Action |
|------|------|
| Same logic in 2+ places | Extract into a helper function |
| Same pattern in 3+ places | Extract into a factory function |
| Similar components in 5+ places | Consider creating a base component |
| Authentication/authorization patterns | Consolidate in auth-helpers.ts |
| Error handling | Consolidate in action-helpers.ts |

## 7.7 Anti-Patterns

```ts
// ❌ Premature abstraction
// Abstracting when only used in one place
const useSingleUseHook = () => { ... };

// ❌ Bloated configuration objects
createAction({
  option1, option2, option3, option4, option5, // Too many
  ...
});

// ✔ Extract only the common parts, implement special cases individually
const baseAction = createBaseAction(commonOptions);
const specialAction = async (input) => {
  // Special logic
  return baseAction(transformedInput);
};
```

---
# cors.md (common/)
---

# CORS Design Guidelines

This document defines the design policy and implementation patterns for **CORS (Cross-Origin Resource Sharing)** in Next.js App Router.
It provides a unified CORS utility for securely accepting requests from external origins in API Routes.

---

## 1. Core Policy

- **Configurable via environment variables**: Permitted origins can vary by deployment environment
- **Wildcard subdomain support**: Use `*.example.com` format to allow multiple subdomains at once
- **Webhook protection**: Replay attack prevention via timestamp validation
- **Referer validation**: Referer header validation as a CSRF countermeasure

---

## 2. Directory Structure

```
src/
  lib/
    api/
      cors.ts              # CORS utility (scope of this guideline)
  app/
    api/
      webhook/
        [service]/route.ts # Webhook endpoints (CORS usage example)
```

---

## 3. Allowed Origin Management

### Configuration via Environment Variables

```ts
// lib/api/cors.ts

const getAllowedOrigins = (): string[] => {
  const envOrigins = process.env.ALLOWED_ORIGINS?.split(",").map((o) =>
    o.trim()
  );

  // Default allowlist: used when ALLOWED_ORIGINS env var is not set.
  // Includes localhost for development and auto-detected deployment URLs.
  const defaultOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  ].filter((o): o is string => Boolean(o));

  return envOrigins ?? defaultOrigins;
};
```

**Key points:**
- Specify via comma-separated `ALLOWED_ORIGINS` environment variable (e.g., `https://app.example.com,https://admin.example.com`)
- When `ALLOWED_ORIGINS` is not set, falls back to: localhost:3000, localhost:3001, `NEXT_PUBLIC_APP_URL`, and auto-detected `VERCEL_URL`
- Automatically allow `VERCEL_URL` during Vercel deployments

---

## 4. Origin Validation

### Validation Function

```ts
export function validateOrigin(
  req: Request,
  options: { allowedOrigins?: string[] } = {}
): { valid: boolean; origin: string | null } {
  const origin = req.headers.get("origin");
  const allowedOrigins = options.allowedOrigins ?? getAllowedOrigins();

  // Allow requests without an origin (same-origin requests, etc.)
  if (!origin) {
    return { valid: true, origin: null };
  }

  // Wildcard support (*.example.com)
  const isAllowed = allowedOrigins.some((allowed) => {
    if (allowed.startsWith("*.")) {
      const domain = allowed.slice(2);
      return origin.endsWith(domain);
    }
    return origin === allowed;
  });

  return { valid: isAllowed, origin };
}
```

### Wildcard Subdomains

```
ALLOWED_ORIGINS=https://app.example.com,*.example.com
```

Specifying `*.example.com` allows all subdomains such as `staging.example.com`, `preview-123.example.com`, etc.

---

## 5. CORS Response Header Generation

```ts
export function corsHeaders(
  req: Request,
  options: {
    allowedMethods?: string[];
    allowedHeaders?: string[];
    maxAge?: number;
    credentials?: boolean;
  } = {}
): HeadersInit {
  const {
    allowedMethods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders = ["Content-Type", "Authorization", "X-Request-ID"],
    maxAge = 86400,
    credentials = true,
  } = options;

  const origin = req.headers.get("origin");
  const allowedOrigins = getAllowedOrigins();

  // Only return the origin if it's in the allowlist
  const allowOrigin = origin && allowedOrigins.some((allowed) => {
    if (allowed.startsWith("*.")) {
      return origin.endsWith(allowed.slice(2));
    }
    return origin === allowed;
  })
    ? origin
    : allowedOrigins[0] ?? "";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": allowedMethods.join(", "),
    "Access-Control-Allow-Headers": allowedHeaders.join(", "),
    "Access-Control-Max-Age": maxAge.toString(),
    ...(credentials && { "Access-Control-Allow-Credentials": "true" }),
  };
}
```

**Key points:**
- `Access-Control-Allow-Origin` returns the request's origin as-is (not `*`)
- When `credentials: true`, `*` cannot be used (browser will reject it)
- `Max-Age` caches preflight results (default: 24 hours)

---

## 6. Preflight Request Handling

```ts
export function handleCorsPreflightRequest(req: Request): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(req),
  });
}
```

### Usage Example in API Routes

```ts
// app/api/webhook/route.ts
import { validateOrigin, corsHeaders, handleCorsPreflightRequest } from "@/lib/api/cors";

export async function OPTIONS(req: Request) {
  return handleCorsPreflightRequest(req);
}

export async function POST(req: Request) {
  const originCheck = validateOrigin(req);
  if (!originCheck.valid) {
    return new Response("Forbidden", {
      status: 403,
      headers: corsHeaders(req),
    });
  }

  // ... business logic

  return Response.json(result, {
    headers: corsHeaders(req),
  });
}
```

---

## 7. Timestamp Validation (Replay Attack Prevention)

Prevent replay attacks from old request resends in Webhook and external API integrations.

```ts
export function validateTimestamp(
  timestamp: string | number,
  maxAgeMs: number = 5 * 60 * 1000 // Default: 5 minutes
): { valid: boolean; error?: string } {
  const eventTime =
    typeof timestamp === "number"
      ? timestamp
      : new Date(timestamp).getTime();

  if (isNaN(eventTime)) {
    return { valid: false, error: "Invalid timestamp format" };
  }

  const now = Date.now();
  const age = now - eventTime;

  // Reject requests that are too old
  if (age > maxAgeMs) {
    return {
      valid: false,
      error: `Timestamp too old: ${Math.round(age / 1000)}s ago`,
    };
  }

  // Also reject future timestamps
  if (age < -maxAgeMs) {
    return {
      valid: false,
      error: `Timestamp in future: ${Math.round(-age / 1000)}s ahead`,
    };
  }

  return { valid: true };
}
```

**Key points:**
- Reject not only past but also future timestamps (timestamp tampering prevention)
- Default tolerance is 5 minutes (accounting for network latency)
- Supports both ISO 8601 strings and Unix milliseconds

---

## 8. Referer Validation

Validate Referer headers as a CSRF countermeasure.

```ts
export function validateReferer(
  req: Request,
  options: { allowedDomains?: string[] } = {}
): { valid: boolean; referer: string | null } {
  const referer = req.headers.get("referer");
  const allowedDomains =
    options.allowedDomains ?? getAllowedOrigins().map((o) => new URL(o).host);

  if (!referer) {
    return { valid: true, referer: null };
  }

  try {
    const refererUrl = new URL(referer);
    const isAllowed = allowedDomains.some(
      (domain) =>
        refererUrl.host === domain || refererUrl.host.endsWith(`.${domain}`)
    );
    return { valid: isAllowed, referer };
  } catch {
    return { valid: false, referer };
  }
}
```

---

## 9. Webhook Signature Verification

Type definitions for implementing service-specific signature verification:

```ts
export interface WebhookValidationResult {
  valid: boolean;
  error?: string;
}
```

### Webhook Signature Verification Implementation Example

```ts
// lib/external/webhook-verify.ts
export async function verifyWebhookSignature(
  headers: Headers,
  body: string,
  webhookSecret: string
): Promise<WebhookValidationResult> {
  // 1. Certificate URL validation (SSRF prevention) ※when the service uses certificate URLs
  const certUrl = headers.get("x-cert-url");
  if (certUrl && !isValidCertUrl(certUrl, allowedHosts)) {
    return { valid: false, error: "Invalid certificate URL" };
  }

  // 2. Timestamp validation
  const timestamp = headers.get("x-webhook-timestamp");
  if (timestamp) {
    const tsCheck = validateTimestamp(timestamp);
    if (!tsCheck.valid) return tsCheck;
  }

  // 3. Service-specific signature verification
  // ※Refer to project-specific guidelines
  // ...
}
```

**SSRF prevention**: When accessing URLs received via Webhook, always validate the domain.

---

## 10. Best Practices

### DO (Recommended)

```ts
// ✅ Use origin validation + CORS headers as a set
const originCheck = validateOrigin(req);
if (!originCheck.valid) {
  return new Response("Forbidden", { status: 403, headers: corsHeaders(req) });
}

// ✅ Restrict allowed methods per endpoint
corsHeaders(req, { allowedMethods: ["POST"] })

// ✅ Manage allowed origins via environment variables
// ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com

// ✅ Add timestamp validation for webhooks
const tsResult = validateTimestamp(req.headers.get("x-webhook-timestamp"));
```

### DON'T (Not Recommended)

```ts
// ❌ Return CORS headers without origin validation
return Response.json(data, { headers: corsHeaders(req) });

// ❌ Access webhook certificate URL without validation (SSRF)
const cert = await fetch(headers.get("cert-url")); // Dangerous
```

---

## 11. Summary

| Feature | Implementation | Purpose |
|------|---------|------|
| Origin validation | `validateOrigin()` | Only allow permitted origins |
| CORS header generation | `corsHeaders()` | Standards-compliant response headers |
| Preflight handling | `handleCorsPreflightRequest()` | Unified OPTIONS request processing |
| Timestamp validation | `validateTimestamp()` | Replay attack prevention |
| Referer validation | `validateReferer()` | CSRF countermeasure |
| Wildcard | `*.example.com` | Batch subdomain allowance |

---
# env.md (common/)
---

# Environment Variables Guidelines
This document defines a design based on **server-only environment variables** for large-scale Next.js applications, ensuring no confidential information is ever passed to the client side. The deployment environment assumes **Vercel**, maximizing its security features.

---

# 1. Management Policy (Core Principles)
## 1. Enforce Server-Only
* `process.env.xxx` is used **only in Server Components / Route Handlers / Server Actions**
* Never directly expose to Client Components
* When Client needs data, **return only the minimum required via API Route** — "minimum" means: only public identifiers (e.g., payment Client ID) and non-sensitive configuration. Never return secrets, internal IDs, or data the client does not directly render.

---

## 2. .env Files for Local Only
* `.env.local`: Local use only (excluded from Git)
* `.env.production`: Generally not used; configure on the cloud side
* `.env.example`: List only the required key names (no values)

---

## 3. Application Code Separation
* Consolidate all external service configurations in `/src/lib/config/env.ts`
* **Validate with Zod**, outputting clear error messages on missing values

```ts
// lib/config/env.ts - Zod validation pattern (recommended)
import { z } from "zod";

const envSchema = z.object({
  // {AI_SERVICE}_API_KEY: AI API key used by the project
  AI_API_KEY: z.string().min(1, "AI_API_KEY is required"),
  OAUTH_CLIENT_ID: z.string().min(1, "OAUTH_CLIENT_ID is required"),
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),
});

// Validate at startup (fail immediately on error)
export const env = envSchema.parse(process.env);
```

---

# 2. Primary Environment Variables

```
# Authentication (NextAuth)
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Database (Prisma)
DATABASE_URL=
DIRECT_URL=

# {Payment Service} (e.g., PayPal, Stripe, etc.)
{PAYMENT_SERVICE}_CLIENT_ID=
{PAYMENT_SERVICE}_CLIENT_SECRET=
{PAYMENT_SERVICE}_WEBHOOK_SECRET=

# OAuth
OAUTH_CLIENT_ID=
OAUTH_CLIENT_SECRET=

# {AI Service} (e.g., OpenAI, Gemini, etc.)
{AI_SERVICE}_API_KEY=
```

---

# 3. Development Environment (Local)
## Use .env.local
* DB = SQLite connection information
* Use sandbox keys / OAuth keys for testing
* `.env.local` must **never be committed to Git**

---

# 4. Production Environment (Vercel)
## Use Secure Environment Variables
* Encrypted, restricted to server-only during build and runtime
* **Environment Variables locking** (access permission management) recommended
* Configure from Project Settings → Environment Variables

### Features
* Automatically applied as server-only for Edge Functions
* Webhook Secrets are stored in the **Vercel Dashboard** (never exposed to Client)

### Additional Policies
* Separate variables for Previews / Production
* Rotate Secrets (periodic key rotation)

---

# 5. Secure Secret Usage Rules

## 1. Never Pass Directly to Client Components
* Example: Passing a payment service's Client Secret as props → **absolutely prohibited**

## 2. Provide Only Minimum Information via Route Handlers
* Only Public Keys may be exposed (e.g., payment service's Client ID)

## 3. Keep Webhook Secrets Server-Only
* Configure in the Vercel dashboard
* Hardcoding in code is prohibited

## 4. Never Output Keys in Logs
* `console.log(process.env.X)` is also prohibited

---

# 6. Leveraging Next.js Built-in Variable Loading

* Next.js exposes variables prefixed with `NEXT_PUBLIC_` to the client by default
* To enforce server-only, **never use the NEXT_PUBLIC_ prefix** except for intentionally public variables
* When loading via env.ts, handle all without prefix

---

# 7. Secret and Production Key Rotation Strategy

* Secret rotation is a mandatory security measure
* Document the following as operational rules:

  1. Who updates the keys
  2. When they are updated (e.g., quarterly)
  3. How they are updated (set new keys in Vercel, update dependent services)

---

# 8. Directory Structure (Environment Variable Related)

```
src/
  lib/
    config/
      env.ts        # server-only env loader
      env.schema.ts # Zod validation
  app/
    api/...
  features/
    billing/
    calendar/
```

---

# 9. Improvements and Operational Notes
### Reconsidering Non-Null Assertion Usage in env.ts
* `PAYMENT_CLIENT_SECRET: process.env.PAYMENT_CLIENT_SECRET!` — the `!` is unnecessary
* Since Zod has already validated, remove `!` and export the Zod result directly

### Reviewing Environment Variables (Section 2)
* Clearly distinguish public and server-only variables in the list
* Classify with comments or prefixes (e.g., `NEXT_PUBLIC_{PAYMENT_SERVICE}_CLIENT_ID`)

---

# 10. Summary
* **All environment variables are operated as server-only**
* Type-safe env loading via `env.ts + Zod`
* **Use Vercel Secure Environment Variables**
* `.env.local` is local only, never included in Git
* Webhooks and API keys are processed securely on the Route Handler side
* Use the NEXT_PUBLIC_ prefix only for intentionally public variables
* Key rotation is clearly documented as operational rules
* Fail-fast design ensures immediate process termination on missing environment variables

## Before/After Example

```typescript
// ❌ Before: Accessing env vars directly without validation
const apiKey = process.env.AI_API_KEY!;
const dbUrl = process.env.DATABASE_URL!;
// Crashes at runtime with cryptic errors if missing
```

```typescript
// ✅ After: Validating env vars at startup with Zod
import { z } from "zod";
const envSchema = z.object({
  AI_API_KEY: z.string().min(1, "AI_API_KEY is required"),
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),
});
export const env = envSchema.parse(process.env);
// Fails immediately with a clear message on startup
```

---
# error-handling.md (common/)
---

# Error Handling Guidelines
This document covers **only content that does not overlap with other documents**, focusing on error design, notification, user-facing experience, log levels, and error classification.

It also **systematizes error classification and handling methods**, defining what messages to display and how to log for each error type: validation errors, authentication errors, system errors, etc.

---

# 1. Error Taxonomy
### 1.1 System Errors (Server Internal)
* DB connection failures
* Uncaught exceptions
* Runtime exceptions
* External API outages

**Characteristics:**
Unpredictable / unrecoverable → Notify administrators + monitor
**Logging:** Record at FATAL level, do not include sensitive information

---

### 1.2 Application Errors (Expected Errors)
* Validation errors
* Domain logic errors (e.g., 409 Conflict)
* Authorization errors (insufficient permissions)
* Rate limit reached

**Characteristics:**
Predictable / handling required → Provide clear feedback to users
**Logging:** Record at ERROR or WARN level

---

### 1.3 User Operation Errors (User Mistakes)
* Missing input
* Unexpected operations (double clicks, etc.)
* **Input format errors preventable on the UI side** — specifically:
  * Errors caught by HTML input attributes (`type`, `min`, `max`, `maxLength`, `pattern`)
  * Errors caught by Zod schemas bound to React Hook Form via `zodResolver`
  * Errors prevented by UI controls (dropdowns instead of free text, date pickers instead of text input)
  * Criteria: if the UI can make the invalid state unrepresentable or provide instant feedback before submission, it qualifies

**Characteristics:**
Display messages and guide retry on the client side (UI)
※ Cases where the server returns error codes (e.g., 409 Conflict) are reclassified as 1.2

---

### 1.4 Error Propagation Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                        Error Source                               │
├──────────────────────────────────────────────────────────────────┤
│  External API  │   Prisma DB    │  Zod Validation │  Domain Logic │
│  (Integration) │   (Query)      │  (Input)        │  (Business    │
│                │                │                 │   Rules)      │
└─────┬──────────┴───────┬────────┴──────┬──────────┴──────┬───────┘
      │                  │               │                 │
      ▼                  ▼               ▼                 ▼
┌──────────────────────────────────────────────────────────────────┐
│              handleActionError() / classifyExternalError()        │
│              Error Classification & ActionError Conversion         │
│              → ※Project-specific integration guidelines,          │
│                frameworks/nextjs/server-actions.md                │
└───────────────────────────────┬──────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                      ActionResult Return                          │
│         { success: false, error: { code, message } }             │
│              → frameworks/nextjs/server-actions.md               │
└───────────────────────────────┬──────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                      UI Display Layer                             │
│   - toast.error() - Temporary notification                       │
│   - form.setError() - Field-level error                          │
│   - ErrorBoundary - Critical error                               │
│              → frameworks/nextjs/form.md, frameworks/nextjs/ui.md │
└──────────────────────────────────────────────────────────────────┘
```

**Related Documents:**

- External API error classification → ※Refer to project-specific integration guidelines
- ActionResult pattern → frameworks/nextjs/server-actions.md
- Form error display → frameworks/nextjs/form.md
- Toast/UI errors → frameworks/nextjs/ui.md
- Logging → common/logging.md

---

# 2. UI / UX Error Handling
### 2.1 Global Error Page (Layout Level)
* Unexpected exceptions → `app/error.tsx`
* Provide automatic recovery (reset)

### 2.2 Page-Level Error Display
* Provide fallback content
* Example: Feed fetch failure → Display retry button

### 2.3 Component-Level Fallback
* Combine Suspense + ErrorBoundary (client-side)
* Prevent small UI breakages from cascading to the entire page
* Forward client-side errors to server/external logging services
  * Typically treated as ERROR level
  * Forwarding methods: Fetch / Beacon API / dedicated SDK

---

# 3. API Error Policy (Next.js Route Handler)
### 3.1 Unified Response Format
```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "The input is invalid."
  }
}
```

### 3.2 HTTP Status Code Rules

| Condition | Status | Example |
| --- | --- | --- |
| Success | 200, 201 | Create, update succeeded |
| User operation error | 400 | Validation failed |
| Authentication | 401 | Login required |
| Authorization | 403 | Insufficient permissions |
| Resource not found | 404 | Data does not exist |
| Conflict | 409 | Duplicate registration / domain logic violation |
| Temporary load / external service outage | 503 | Client should retry |
| Server | 500 | Internal error |

### 3.3 Indicate Retry Eligibility

* Specify via response headers or JSON fields

---

# 4. Log Levels and Recording Criteria (Non-overlapping with Observability)

### 4.1 Log Levels

| Level | Usage |
| --- | --- |
| DEBUG | Debugging only (minimize in production) |
| INFO | Normal operations (startup, completion, etc.) |
| WARN | Expected exceptions, retryable issues |
| ERROR | Application errors |
| FATAL | System-stopping events (notification target) |

### 4.2 Do Not Include Sensitive Information in Logs

* Passwords / tokens / raw email addresses

---

# 5. Tracing ID on Error Occurrence

> **Reference:** See common/logging.md for Trace ID implementation details

### 5.1 Assign `requestId` per Request

* Facilitates user support inquiries
* Example:

```
x-request-id: abc123
```

### 5.2 Return requestId to the UI

* "Please provide this ID when contacting support"
* Enables easy cross-referencing with logs
* Reference: Can be used alongside traceparent or x-b3-traceid used by OpenTelemetry
  → Reason for adopting x-request-id: simple and easy to trace across microservices

---

# 6. User-Facing Message Strategy

### 6.1 Error Message Attributes

Each user-facing error message should address three dimensions:

* **Specificity** — State what failed in user terms, not technical terms. Bad: "Validation error". Good: "The email address format is invalid."
* **Action suggestion** — Tell the user what to do next. Include a concrete action: "Please check the email format and try again" or "Please try again in a few minutes."
* **Impact scope** — Clarify what was affected. "Your changes were not saved" or "The image was uploaded but processing failed — it will appear once processing completes."

---

# 7. Retry Strategy

### 7.1 Cases for Automatic Retry

* Network failures (offline → recovery)
* Temporary 500 / 503

### 7.2 Cases Where Retry Must Not Occur

* Validation errors
* 403 / 404
* Conflicts (409)

---

# 8. Handling Business Logic Errors (Domain Exceptions)

### 8.1 Handle Domain Rule Violations with Exception Classes

```ts
class DomainError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}
```

### 8.2 Convert Domain Errors to HTTP in the API

* `DomainError` → 400 or 409
* Handle as a separate layer from PrismaError

---

# 9. Error Visualization (UI)

### 9.1 Lightweight Error Display via Toast

* Communicate in a brief message, not lengthy text

### 9.2 Display Form Errors Per Field

* Presented from a UX perspective

---

# 10. Fail-Safe / Graceful Degradation

### 10.1 Non-Essential Feature Failures Should Maintain UI

* Page should still render even if sidebar notifications are down
* Alternative UI (skeleton / placeholder)

### 10.2 Cache Fallback on API Failure

* Local cache
* Use the most recent successful response

---

# 11. Debug / Developer-Facing Errors During Development

### 11.1 Dev Mode Displays Detailed Errors

* Suppressed in production

### 11.2 Error Testing in Storybook / Isolated Mode

* Enables testing error scenarios at the component level

---

# 12. QA / Testing (Non-overlapping Perspectives)

### 12.1 Error Scenario Tests Should Comprise 30-50%

* Success cases alone are insufficient

### 12.2 Chaos Testing (Limited Scope)

* Simulate API failures / latency

## Before/After Example

```typescript
// ❌ Before: Leaking internal error details to the user
catch (error) {
  return Response.json(
    { error: { message: error.stack } },
    { status: 500 }
  );
}
```

```typescript
// ✅ After: Returning a safe user-facing message with a request ID
catch (error) {
  logger.error({ error, requestId }, "Unhandled error");
  return Response.json(
    { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred", requestId } },
    { status: 500 }
  );
}
```

---
# i18n.md (common/)
---

# Internationalization (i18n) Guidelines

This document defines the design policy and implementation patterns for internationalization in Next.js App Router.

---

## 1. Core Policy

### Adopted Library
- **next-intl**: i18n library optimized for App Router
- Works with both Server Components and Client Components
- Type-safe translation keys

### Default Language Detection

The default language should be determined dynamically based on the application type:

| Application Type | Detection Method | Fallback |
|------------------|-----------------|----------|
| Web application | Browser `Accept-Language` header | en |
| CLI tool / Desktop app | OS locale (`LANG`, `LC_ALL`, or system API) | en |

- **Web application**: Use the browser's `Accept-Language` header (or `navigator.language`) to detect the user's preferred language at first visit. Store the preference in a cookie or user settings for subsequent visits.
- **CLI tool / Desktop application**: Read the OS locale environment variables (`LANG`, `LC_ALL` on Unix, `GetUserDefaultUILanguage` on Windows) to determine the default language at startup.

### Supported Languages (Initial)
| Code | Language | Priority |
|--------|------|--------|
| en | English | Fallback default |
| ja | Japanese | Required |
| zh | Chinese (Simplified) | Optional |
| ko | Korean | Optional |

---

## 2. Directory Structure

```
src/
  messages/
    en.json           # English messages
    ja.json           # Japanese messages
  i18n/
    config.ts         # i18n configuration
    request.ts        # next-intl request configuration
  app/
    [locale]/         # Locale-based routing
      layout.tsx
      page.tsx
      (features)/
        ...
  middleware.ts       # Locale detection and redirect
```

---

## 3. Configuration Files

### i18n/request.ts

```ts
import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale } from './config';

export default getRequestConfig(async ({ locale }) => {
  // Validation
  if (!locales.includes(locale as any)) {
    locale = defaultLocale;
  }

  return {
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone: 'UTC',
    now: new Date(),
  };
});
```

### middleware.ts

```ts
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/config';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed', // Don't include default locale in URL
  localeDetection: true,     // Detect from Accept-Language header
});

export const config = {
  // Exclude static files and API
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
```

---

## 4. Message Files

### messages/en.json

```json
{
  "common": {
    "loading": "Loading...",
    "error": "An error occurred",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "confirm": "Confirm",
    "back": "Back",
    "next": "Next",
    "submit": "Submit"
  },
  "auth": {
    "login": "Log in",
    "logout": "Log out",
    "register": "Sign up",
    "email": "Email",
    "password": "Password",
    "forgotPassword": "Forgot password?"
  },
  "errors": {
    "required": "{field} is required",
    "invalid": "{field} is invalid",
    "notFound": "{item} not found",
    "serverError": "A server error occurred"
  },
  "project": {
    "title": "Title",
    "description": "Description",
    "createProject": "Create New Project",
    "generate": "Generate"
  }
}
```

### messages/ja.json

```json
{
  "common": {
    "loading": "読み込み中...",
    "error": "エラーが発生しました",
    "save": "保存",
    "cancel": "キャンセル",
    "delete": "削除",
    "edit": "編集",
    "confirm": "確認",
    "back": "戻る",
    "next": "次へ",
    "submit": "送信"
  },
  "auth": {
    "login": "ログイン",
    "logout": "ログアウト",
    "register": "新規登録",
    "email": "メールアドレス",
    "password": "パスワード",
    "forgotPassword": "パスワードをお忘れですか？"
  },
  "errors": {
    "required": "{field}は必須です",
    "invalid": "{field}が無効です",
    "notFound": "{item}が見つかりません",
    "serverError": "サーバーエラーが発生しました"
  },
  "project": {
    "title": "タイトル",
    "description": "説明",
    "createProject": "新規プロジェクト作成",
    "generate": "生成"
  }
}
```

---

## 5. Type-Safe Translation Keys

### types/i18n.d.ts

```ts
import en from '@/messages/en.json';

type Messages = typeof en;

declare global {
  // next-intl type extension
  interface IntlMessages extends Messages {}
}
```

---

## 6. Usage Patterns

### Usage in Server Components

```tsx
// app/[locale]/page.tsx
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';

// Method 1: useTranslations (also works in Server Components)
export default function HomePage() {
  const t = useTranslations('common');

  return (
    <div>
      <h1>{t('loading')}</h1>
    </div>
  );
}

// Method 2: getTranslations (async retrieval)
export async function generateMetadata({ params: { locale } }: Props) {
  const t = await getTranslations({ locale, namespace: 'project' });

  return {
    title: t('createProject'),
  };
}
```

### Usage in Client Components

```tsx
// components/LoginForm.tsx
"use client";

import { useTranslations } from 'next-intl';

export function LoginForm() {
  const t = useTranslations('auth');

  return (
    <form>
      <label>{t('email')}</label>
      <input type="email" />

      <label>{t('password')}</label>
      <input type="password" />

      <button type="submit">{t('login')}</button>
    </form>
  );
}
```

### Variable Interpolation (ICU MessageFormat)

```tsx
const t = useTranslations('errors');

// messages: { "required": "{field} is required" }
t('required', { field: 'Email' });
// → "Email is required"

// Plural support
// messages: { "items": "{count, plural, =0 {No items} one {# item} other {# items}}" }
t('items', { count: 5 });
// → "5 items"
```

### Date & Number Formatting

```tsx
import { useFormatter } from 'next-intl';

export function PriceDisplay({ price, date }: Props) {
  const format = useFormatter();

  return (
    <div>
      {/* Currency format */}
      <p>{format.number(price, { style: 'currency', currency: 'USD' })}</p>
      {/* → "$1,000.00" */}

      {/* Date format */}
      <p>{format.dateTime(date, { dateStyle: 'long' })}</p>
      {/* → "January 15, 2024" */}

      {/* Relative time */}
      <p>{format.relativeTime(date)}</p>
      {/* → "3 days ago" */}
    </div>
  );
}
```

---

## 7. Language Switching UI

```tsx
// components/common/LocaleSwitcher.tsx
"use client";

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { locales, localeNames, type Locale } from '@/i18n/config';

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (newLocale: Locale) => {
    // Replace the locale part of the current path
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  };

  return (
    <Select value={locale} onValueChange={handleChange}>
      <SelectTrigger className="w-32" aria-label="Select language">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {locales.map((loc) => (
          <SelectItem key={loc} value={loc}>
            {localeNames[loc]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

---

## 8. Routing Configuration

### app/[locale]/layout.tsx

```tsx
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { locales, type Locale } from '@/i18n/config';

interface Props {
  children: React.ReactNode;
  params: { locale: string };
}

export default async function LocaleLayout({ children, params: { locale } }: Props) {
  // Locale validation
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Retrieve messages
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

// For static generation
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
```

---

## 9. Server-Side Locale Retrieval

### Usage in Server Actions

```ts
// features/project/server/project-actions.ts
import { getLocale, getTranslations } from 'next-intl/server';

export async function createProject(data: CreateProjectInput) {
  const locale = await getLocale();
  const t = await getTranslations('errors');

  try {
    // Project creation logic
  } catch (error) {
    return {
      success: false,
      error: t('serverError'),
    };
  }
}
```

### Usage in API Routes

```ts
// app/api/resource/route.ts
import { getLocale } from 'next-intl/server';

export async function POST(request: Request) {
  const locale = await getLocale();

  // Locale-based processing
  const response = await processWithLocale(locale);

  return Response.json(response);
}
```

---

## 10. Message Management Best Practices

### Namespace Structure

```
messages/
  ja.json
    common      # Common UI (buttons, labels, etc.)
    auth        # Authentication related
    errors      # Error messages
    validation  # Validation messages
    project     # Project feature (※adjust per domain)
    billing     # Billing feature
    admin       # Admin feature
```

### Key Naming Rules

A key is "ambiguous" if it does not tell you **where it appears** or **what it does** without reading the code. Keys must encode both the UI location (or domain) and the action/content:

```json
{
  // ❌ Ambiguous: "button1" doesn't say where or what; "msg" could be anything
  "button1": "Save",
  "msg": "Error",

  // ✔ Clear: namespace.element pattern tells you location + purpose
  "form.submit": "Submit",
  "form.cancel": "Cancel",
  "error.validation.required": "{field} is required",
  "error.api.timeout": "Connection timed out"
}
```

### Translating Dynamic Content

```tsx
// ❌ Dynamically generating translation keys (loses type safety)
t(`status.${status}`);

// ✔ Use a mapping
const statusMessages = {
  pending: t('status.pending'),
  completed: t('status.completed'),
  failed: t('status.failed'),
} as const;

return statusMessages[status];
```

---

## 11. SEO Support

### Per-Language Metadata

```tsx
// app/[locale]/page.tsx
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params: { locale } }: Props) {
  const t = await getTranslations({ locale, namespace: 'meta' });

  return {
    title: t('home.title'),
    description: t('home.description'),
    alternates: {
      languages: {
        ja: '/ja',
        en: '/en',
        zh: '/zh',
        ko: '/ko',
      },
    },
  };
}
```

### hreflang Tags

```tsx
// app/[locale]/layout.tsx
export default function Layout({ params: { locale } }: Props) {
  return (
    <html lang={locale}>
      <head>
        <link rel="alternate" hrefLang="ja" href="https://example.com/ja" />
        <link rel="alternate" hrefLang="en" href="https://example.com/en" />
        <link rel="alternate" hrefLang="x-default" href="https://example.com" />
      </head>
      <body>{/* ... */}</body>
    </html>
  );
}
```

---

## 12. Testing

### Translation Key Existence Check

```ts
// __tests__/i18n/messages.test.ts
import en from '@/messages/en.json';
import ja from '@/messages/ja.json';

function getAllKeys(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null) {
      return getAllKeys(value, fullKey);
    }
    return [fullKey];
  });
}

describe('i18n messages', () => {
  const enKeys = getAllKeys(en);
  const jaKeys = getAllKeys(ja);

  it('should have all English keys in Japanese', () => {
    const missingInJa = enKeys.filter((key) => !jaKeys.includes(key));
    expect(missingInJa).toEqual([]);
  });

  it('should have all Japanese keys in English', () => {
    const missingInEn = jaKeys.filter((key) => !enKeys.includes(key));
    expect(missingInEn).toEqual([]);
  });
});
```

---

## 13. Notes

| Item | Recommendation |
|------|------|
| Default locale | en (English) |
| Missing translations | Auto-check in CI |
| Long text | Verify UI doesn't break in each language |
| Right-to-left (RTL) | Address when adding Arabic, etc. |

---

## Summary

- Adopt **next-intl** for type-safe translations across both Server and Client
- Manage messages as JSON in `messages/`
- Locale-based routing via `app/[locale]/`
- Provide language switching through the `LocaleSwitcher` component
- Set hreflang tags for SEO

---
# logging.md (common/)
---

# Logging Guidelines

This document outlines the **monitoring / logging / tracing (observability) strategy** for large-scale Next.js applications. Cloud service: **Vercel**

---

## Purpose of Observability

Observability in this project means the ability to answer "why is this request slow/failing?" within 5 minutes using logs, traces, and metrics. Specifically:

* Early detection and automated alerting for incidents
* Identify performance degradation trends
* Rapidly pinpoint the source of API, DB, and external API issues
* Safely visualize production environment behavior
* Monitor user impact in real-time

Build a system capable of observing performance issues that arise in
Next.js (Server Components / Edge Functions / Route Handlers).

---

## 1. Monitoring
### Vercel Monitoring
**The monitoring platform with the highest integration with Next.js.**
* **Vercel Analytics**
  * Web Vitals measurement (TTFB / FCP / LCP / CLS / FID)
  * Real user measurements from user devices (RUM)
  * Per-page performance visualization
* **Speed Insights**
  * Lighthouse-based measurements
  * Auto-suggests improvements (image optimization, script minification, webfont optimization)
* **Edge / Serverless Function Logs & Metrics**
  * Error rates
  * Processing time
  * Cold start detection

**Monitoring targets:**
* Route Handlers (API)
* Edge Middleware
* ISR regeneration (revalidate) timing
* **Server Components (RSC)** execution time and data fetch latency monitoring (often overlooked, requires attention)

---

## 2. Logging

### Next.js: Server Log Standards

```ts
console.info("[route] creating user", { email });
console.warn("[route] slow response", { ms });
console.error("[route] external api error", { provider, message });
```

**Classification:**

* info: Normal flow (metrics support)
* warn: Latency, retries, slow external API responses
* error: Handled failures

### Recommended Log Management Tools

| Purpose | Tool |
| --- | --- |
| Error monitoring | Sentry |
| Request logs / JSON structured logs | Logtail / DataDog |

---

## 3. Tracing

### Purpose of Distributed Tracing

* Identify the source of latency from API → DB → external API
* Track by specific user request
* Flexible alert configuration

### Trace ID / Request ID Propagation Strategy

Trace ID propagation is what enables correlating a user-visible error with the exact server-side log entry, DB query, and external API call that caused it. Without it, debugging production issues requires manually searching logs by timestamp — which is slow and error-prone at scale.

* Attach Trace IDs to all API / Server Components / Edge Functions / Prisma / external API calls
* Insufficient propagation makes it difficult to correlate logs and traces, hindering rapid problem identification

### 3.1 Trace ID Generation and Propagation (Implementation Examples)

#### Logger Factory

```ts
// src/lib/logger.ts
import pino from "pino";

const baseLogger = pino({
  level: process.env.LOG_LEVEL || "info",
  formatters: {
    level: (label) => ({ level: label }),
  },
});

// Logger for Server Actions
export function createActionLogger(actionName: string) {
  return baseLogger.child({
    service: "server-action",
    action: actionName,
  });
}

// Logger for API Routes
export function createApiLogger(routeName: string) {
  return baseLogger.child({
    service: "api-route",
    route: routeName,
  });
}

// Logger with request context
export function createRequestLogger(
  base: pino.Logger,
  requestId: string,
  userId?: string
) {
  return base.child({
    requestId,
    userId,
  });
}
```

#### Request ID Middleware

```ts
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { nanoid } from "nanoid";

export function middleware(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || nanoid();

  // Also attach to response headers
  const response = NextResponse.next();
  response.headers.set("x-request-id", requestId);

  return response;
}
```

#### Log Usage in Server Actions

```ts
// src/features/project/server/project-actions.ts

const logger = createActionLogger("project-actions");

export async function createProject(
  title?: string
): Promise<ActionResult<{ projectId: string }>> {
  const requestId = headers().get("x-request-id") ?? nanoid();
  const reqLogger = createRequestLogger(logger, requestId);

  reqLogger.info({ title }, "Creating project");

  try {
    const authResult = await requireAuth();
    if (!authResult.success) {
      reqLogger.warn("Authentication failed");
      return authResult.error;
    }

    const project = await prisma.project.create({
      data: { userId: authResult.user.id, title },
    });

    reqLogger.info({ projectId: project.id }, "Project created successfully");

    return createActionSuccess({ projectId: project.id });
  } catch (error) {
    reqLogger.error({ error }, "Failed to create project");
    throw error;
  }
}
```

#### Logging External API Calls

```ts
// src/lib/api/external-api-client.ts

export async function callExternalApi<T>(
  url: string,
  options: RequestInit,
  context: { requestId: string; logger: pino.Logger }
): Promise<T> {
  const { requestId, logger } = context;
  const startTime = performance.now();

  logger.info({ url, requestId }, "External API call started");

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        "x-request-id": requestId, // Propagate to external API
      },
    });

    const durationMs = performance.now() - startTime;

    if (!response.ok) {
      logger.error(
        { url, status: response.status, durationMs, requestId },
        "External API call failed"
      );
      throw new ExternalApiError(response.status);
    }

    logger.info(
      { url, status: response.status, durationMs, requestId },
      "External API call completed"
    );

    return response.json();
  } catch (error) {
    const durationMs = performance.now() - startTime;
    logger.error(
      { url, error, durationMs, requestId },
      "External API call error"
    );
    throw error;
  }
}
```

### 3.2 Structured Log Format Standard

#### Recommended Fields

| Field | Description | Example |
|-----------|------|-----|
| `userId` | User ID | "user_xyz" |
| `action` | Action name | "createProject" |
| `durationMs` | Processing time | 150 |
| `error` | Error information | { code, message, stack } |

#### Log Output Examples

```json
{
  "level": "info",
  "service": "server-action",
  "action": "createProject",
  "requestId": "req_abc123",
  "userId": "user_xyz",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "message": "Project created successfully",
  "projectId": "proj_456",
  "durationMs": 150
}
```

```json
{
  "level": "error",
  "service": "api-route",
  "route": "/api/resource",
  "requestId": "req_def456",
  "userId": "user_xyz",
  "timestamp": "2024-01-15T10:31:00.000Z",
  "message": "External API call failed",
  "error": {
    "code": "RATE_LIMITED",
    "message": "API rate limit exceeded",
    "retryAfter": 60
  }
}
```

### 3.3 External API Call Logs

Record calls to external services such as AI APIs and payment APIs in a dedicated log format.

```ts
// lib/api/external-api-logger.ts

export interface ExternalApiLogParams {
  provider: string; // e.g., "ai-api", "payment", "vision"
  operation: string;
  latencyMs: number;
  status: "success" | "error";
  // API-specific metrics
  promptTokens?: number;
  responseTokens?: number;
  model?: string;
  errorCode?: string;
}

export function logExternalApiCall(
  logger: pino.Logger,
  params: ExternalApiLogParams,
  context?: { requestId?: string; userId?: string }
): void {
  const logData = {
    ...params,
    ...context,
    type: "external_api_call",
  };

  if (params.status === "success") {
    logger.info(logData, `${params.provider}:${params.operation} completed`);
  } else {
    logger.error(logData, `${params.provider}:${params.operation} failed`);
  }
}
```

#### Usage Example

```ts
const startTime = Date.now();

try {
  const result = await aiClient.generateText(prompt);

  logExternalApiCall(logger, {
    provider: "ai-api",
    operation: "generateText",
    latencyMs: Date.now() - startTime,
    status: "success",
    model: "model-name",
    promptTokens: result.usageMetadata?.promptTokenCount,
    responseTokens: result.usageMetadata?.candidatesTokenCount,
  }, { requestId, userId });

  return result;
} catch (error) {
  logExternalApiCall(logger, {
    provider: "ai-api",
    operation: "generateText",
    latencyMs: Date.now() - startTime,
    status: "error",
    errorCode: error.code,
  }, { requestId, userId });

  throw error;
}
```

### 3.4 Fire-and-Forget Log Pattern

For cases where you want to avoid blocking API calls, record logs asynchronously.

```ts
// lib/api/api-call-file-logger.ts

/**
 * Fire-and-Forget log recording
 * Does not block API responses
 */
export function logApiCallAsync(
  params: ApiCallLogParams,
  context: ApiCallContext
): void {
  // Return immediately, process in background
  setImmediate(async () => {
    try {
      await writeLogToFile(params, context);
    } catch (error) {
      // Don't swallow log write failures, only console.error
      console.error("Failed to write API call log:", error);
    }
  });
}

// Usage example
const response = await generateText(prompt);

// Non-blocking log recording
logApiCallAsync({
  prompt,
  response: response.text,
  tokens: response.usageMetadata,
}, { requestId, userId });

return response;  // Return without waiting for log completion
```

#### JSONL File Logging (For Development)

```ts
// Detailed logging for development environment debugging
const LOG_DIR = path.join(process.cwd(), "logs", "api-calls");

interface ApiCallLog {
  timestamp: string;
  requestId: string;
  provider: string;
  operation: string;
  prompt: string;
  response: string;
  latencyMs: number;
  tokens?: { input: number; output: number };
}

async function writeLogToFile(log: ApiCallLog): Promise<void> {
  if (process.env.NODE_ENV !== "development") return;

  const filename = `${new Date().toISOString().slice(0, 10)}.jsonl`;
  const filepath = path.join(LOG_DIR, filename);

  await fs.mkdir(LOG_DIR, { recursive: true });
  await fs.appendFile(filepath, JSON.stringify(log) + "\n");
}
```

### 3.5 Performance Measurement Pattern

```ts
// Performance measurement utility
export async function withPerformanceLog<T>(
  logger: pino.Logger,
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();

  try {
    const result = await fn();
    const durationMs = performance.now() - startTime;

    logger.info({ operation, durationMs }, `${operation} completed`);

    // Warn when threshold is exceeded
    if (durationMs > 1000) {
      logger.warn(
        { operation, durationMs },
        `${operation} exceeded 1s threshold`
      );
    }

    return result;
  } catch (error) {
    const durationMs = performance.now() - startTime;
    logger.error({ operation, durationMs, error }, `${operation} failed`);
    throw error;
  }
}

// Usage example
const project = await withPerformanceLog(
  reqLogger,
  "createProject",
  () => prisma.project.create({ data })
);
```

### Next.js × OpenTelemetry (OTEL)

**Tracing targets:**

* Route Handlers / Server Actions / Edge Functions
* DB access (Prisma middlewares)
* Payment API / AI API / RSS / External APIs
* **Server Components execution time and data fetch latency** — measure at the page-level RSC boundary (each `page.tsx` or layout data fetch), not individual components. Use `withPerformanceLog()` wrapping the top-level data fetch calls in each Server Component page.

**Tracing architecture example:**

```
User Request
  → Next.js Route Handler
    → Server Component (RSC)
    → Prisma (DB)
    → External API (Payment / AI, etc.)
    → Export to Sentry / DataDog
```

**Export destinations:**

| Purpose | Recommended Service |
| --- | --- |
| Frontend & Server unified tracing | Sentry |
| Server-centric distributed tracing | DataDog |

---

## 4. Alert Configuration
### Vercel

* Edge / Serverless error rate increase
* Response time threshold exceeded
* Build failure
* ISR regeneration error loops

### Sentry

* Exception occurrence
* Performance anomalies (Transactions)
* Version regression detection

---

## 5. SLO/SLA Definition and Metrics Mapping

* **Clarify what constitutes normal operation**
* Clarify the basis for incident detection and alerting
* Example: Define API latency 95th percentile < 300ms as SLO, error rate < 1% as SLA

---

## 6. Cost Optimization Strategy

* Log volume and trace volume for Logtail / Sentry / DataDog can lead to cost escalation
* **Mitigations:**

  * Sampling configuration (e.g., trace 10% of requests)
  * Clear log retention periods
  * Suppress unnecessary detailed logs

---

## 7. Observability Standardization Guidelines

### Logging

* JSON structured logs
* requestId / traceId required
* Error logs include stacktrace

### Tracing

* Attach Trace ID to all APIs
* Track DB queries via Prisma middleware
* External APIs (payment services / AI APIs, etc.) also generate spans
* Add Server Component measurements at page-level RSC boundaries — wrap top-level data fetch calls in `page.tsx` with `withPerformanceLog()` to capture RSC rendering + data fetch latency per page

### Monitoring

* Continuous Web Vitals measurement
* Enable RUM in staging environments as well
* Preserve performance comparisons for each deployment

---

## 8. Client-Side Logging

### Client Logger

```ts
// lib/client-logger.ts

type LogContext = Record<string, unknown>;

/**
 * Log warnings on the client side
 */
export function logClientWarn(message: string, context?: LogContext): void {
  if (process.env.NODE_ENV === "development") {
    console.warn(`[Client Warn] ${message}`, context);
  }
}
```

### Usage Examples

```tsx
// Error logging within components
import { logClientError, logClientWarn } from "@/lib/client-logger";

function ImageUploader() {
  const handleUpload = async (file: File) => {
    try {
      await uploadImage(file);
    } catch (error) {
      logClientError("Image upload failed", error, {
        fileName: file.name,
        fileSize: file.size,
      });
      toast.error("Upload failed");
    }
  };
}

// Logging within custom hooks
function useJobPolling() {
  const pollJobs = async () => {
    try {
      const result = await getJobStatus(jobId);
      // ...
    } catch (error) {
      logClientError("Failed to check job status", error);
    }
  };
}
```

### Sentry Integration (Future)

```ts
// lib/client-logger.ts (Sentry integration version)

import * as Sentry from "@sentry/nextjs";

export function logClientError(message: string, error?: unknown, context?: LogContext): void {
  if (process.env.NODE_ENV === "development") {
    console.error(`[Client Error] ${message}`, { error, ...context });
    return;
  }

  // Production: Send to Sentry
  if (error instanceof Error) {
    Sentry.captureException(error, {
      extra: { message, ...context },
    });
  } else {
    Sentry.captureMessage(message, {
      level: "error",
      extra: { error, ...context },
    });
  }
}
```

### Client/Server Log Usage Guidelines

| Situation | Logger to Use |
|------|---------------|
| Within Server Actions | `createActionLogger()` + `createRequestLogger()` |
| Within API Routes | `createApiLogger()` + `createRequestLogger()` |
| Client Components | `logClientError()` / `logClientWarn()` |
| Custom Hooks | `logClientError()` |
| React Error Boundary | `logClientError()` + Sentry |

---

## 9. PII Redaction (Pino redact Rules)

Use Pino logger for server-side logs and automatically redact sensitive information.

```typescript
// src/lib/logger.ts
const baseLogger = pino({
  redact: {
    paths: [
      "password", "*.password",
      "secret", "*.secret",
      "token", "*.token",
      "accessToken", "*.accessToken",
      "refreshToken", "*.refreshToken",
      "creditCard", "*.creditCard",
      "authorization", "*.authorization",
    ],
    censor: "[REDACTED]",
  },
});
```

**Rules:**
- Use `logger.error` instead of `console.error`
- `console.log(process.env.XXX)` is prohibited
- Error object stack traces are server logs only (never return to client)

---

## 10. Log Retention Policy

| Log Type | Retention Period | Storage |
|---------|---------|--------|
| Application logs | 30 days | Vercel Logs |
| API call logs (DB) | 90 days | `api_call_logs` table (auto-deleted via cron) |
| Audit logs | 1 year | `audit_logs` table |
| Security logs (auth failures, etc.) | 90 days | Vercel Logs + DB |
| Webhook event logs | 90 days | `webhook_events` table |

---

## 11. Cron Job Failure Alerts

Send email alerts on cron job failures.

```typescript
// src/lib/email.ts
export async function sendCronFailureAlert(
  cronName: string,
  error: unknown
): Promise<void> {
  // Send failure notification to admin email
}
```

**Usage pattern:**

```typescript
// /api/cron/xxx/route.ts
try {
  // ... cron processing ...
} catch (error) {
  await sendCronFailureAlert("cleanup", error);
  return NextResponse.json({ error: "Failed" }, { status: 500 });
}
```

All cron routes (cleanup, daily-report, process-jobs, etc.) should uniformly send alerts in the catch block.

---

## Summary

* **Vercel**: Next.js observability (Web Vitals, Serverless Logs, Preview)
* **Sentry / OTEL**: Error & tracing foundation
* **Logs are unified in JSON format**
* **Trace from API → Server Components → DB → External API** to pinpoint issues
* Trace ID / Request ID propagation and Server Component observation are the keys to observability
* SLO/SLA-based alert configuration and cost optimization should also be considered
* **Client-side**: Unify with `logClientError()` and prepare for Sentry integration

## Before/After Example

```typescript
// ❌ Before: Unstructured logging without request context
console.log("User created");
console.error("DB failed", error);
```

```typescript
// ✅ After: Structured JSON logging with request ID and context
const reqLogger = createRequestLogger(logger, requestId, userId);
reqLogger.info({ email }, "User created");
reqLogger.error({ error, durationMs }, "DB query failed");
```

---
# naming.md (common/)
---

# Naming Convention Guidelines
This document defines **unified naming conventions** for large-scale Next.js applications.

Scope:
* Prisma models and field names
* Database physical names (table and column names)
* URL paths
* Component names
* API routes
* Type / Interface / Enum
* File and directory names

Prioritizes readability, searchability, and scalability.

---

# 1. General Principles
### Consistency
Unify naming within each domain. Do not mix different naming conventions.

### English Naming Thresholds
* **Variable/field names**: 1-3 words, max 30 characters (e.g., `createdAt`, `orderItemCount`)
* **Function names**: verb + noun, 2-4 words, max 40 characters (e.g., `fetchUserProfile`, `calculateTotalPrice`)
* **Type/interface names**: 1-3 words describing the shape (e.g., `UserProfile`, `OrderSummary`)
* **Avoid abbreviations** unless universally understood (`id`, `url`, `api`, `db` are acceptable; `usr`, `msg`, `btn`, `cfg` are not)
* **When a name exceeds thresholds**, it signals the concept should be split or the scope narrowed

---

# 2. Prisma Relation Names
* **1:1 / N:1 → singular**
* **1:N / N:M → plural (to clearly indicate arrays)**
* lowerCamelCase
* Use names that clearly convey the role

Examples:

```prisma
// N:1
user    User     @relation(fields: [userId], references: [id])
userId  String

// 1:N
orderItems  OrderItem[]
```

---
# 3. Database Physical Names (SQLite)
## Table Names

* **snake_case**
* **Plural**

Examples:

```
users
blog_posts
order_items
```

## Column Names
* **snake_case**
* Singular

Examples:

```
created_at
user_id
is_active
```

## Constraint Names
This guideline adopts the convention of prefixing with the constraint type (pk, fk, idx) for readability and searchability.

Rationale:
* **Constraints are visually grouped by type when listed**
* **Easy to filter by prefix in tools and logs**
* Can be more readable than the common "orders_user_id_fk" format

Naming rules:
* Primary key: `pk_<table>`
* Foreign key: `fk_<table>_<ref_table>`
* Index: `idx_<table>_<column>`

Examples:

```
pk_users
fk_orders_users
idx_blog_posts_author_id
```

---

# 4. URL Path Naming (Next.js App Router)
* **kebab-case**
* Resources in **plural**
* No verbs (REST)

Examples:

```
/users
/users/[id]
/blog/posts
/blog/posts/[slug]
```

---

# 5. API Route Naming (/api)
* Follow REST principles
* Resource names in **plural**
* Operations expressed through HTTP methods
* No verbs in paths

Examples:

```
/api/users
/api/users/[id]
/api/orders
/api/orders/[orderId]/items
```

---

# 6. Service / Repository
* `[domain].service.ts`
* `[domain].repository.ts`

Examples:

```
user.service.ts
order.repository.ts
```

---

# 7. Validation Schema (Zod)
* Schema names: **PascalCase**
* File names: **unified to kebab-case + -schema.ts**

Example:

```ts
export const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});
```

File name examples:

```
user-schema.ts
order-schema.ts
form-schema.ts
```

---

# 8. Forms (React Hook Form)

* `[Domain]Form.tsx`
* `use[Domain]Form.ts`

---

# 9. WebSocket / Realtime Names

* Event names: **snake_case**
* Channel names: **plural**

---

# Summary

| Target | Naming Convention |
| --- | --- |
| Prisma model | PascalCase (singular) |
| Prisma field | lowerCamelCase |
| Prisma relation (1:N / N:M) | **plural (emphasizing arrays)** |
| DB table physical name | snake_case (plural) |
| DB column | snake_case (singular) |
| URL path | kebab-case (plural) |
| API path | REST / plural |
| React component | PascalCase (file name also PascalCase) |
| Other files/directories | kebab-case |
| Type / Enum | PascalCase |
| Zod schema | PascalCase / file name is kebab-case (-schema.ts) |

## Before/After Example

```typescript
// ❌ Before: Inconsistent naming and unclear abbreviations
const usrMgr = new UserMgr();
const get_data = () => fetch("/api/User");
interface order_item { qty: number; }
```

```typescript
// ✅ After: Consistent conventions with clear names
const userManager = new UserManager();
const fetchUserProfile = () => fetch("/api/users");
interface OrderItem { quantity: number; }
```

---
# performance.md (common/)
---

# Performance Guidelines

This document covers only performance optimization items that **do not clearly overlap** with content covered in other documents.

**Related documents:**

- DB query optimization (N+1, indexes, take) → frameworks/nextjs/database.md
- API caching → frameworks/nextjs/api.md
- Server Actions + custom hook state management → frameworks/nextjs/state.md

---

## 1. Rendering & Server Components Optimization
### Use Server Components by Default
* Implement as Server Components whenever possible to minimize bundle size.
* Only add `use client` when UI interaction is required.

### RSC → CC "Hole Punching" Pattern
Decision rule for where to place the RSC/CC boundary:
* **Use RSC** when the component only displays data (no onClick, onChange, useState, useEffect)
* **Use CC** when the component needs browser APIs or user interaction
* At the boundary: fetch data in RSC, pass only the **minimal serializable props** to child Client Components
* Do not fetch from CC (to prevent duplicate fetches and bundle bloat)
* If a CC needs server data, lift the fetch to the nearest RSC ancestor and pass it down

---

## 2. Client Bundle Optimization (Client Components)
### Dynamic Import of Dependencies
```ts
const Editor = dynamic(() => import('./Editor'), { ssr: false });
```

### Use Tree-Shakable Imports Consistently
* `import { X } from 'lodash'` — avoid (imports entire library)
* `import debounce from 'lodash/debounce'` — preferred (imports only the function)

### Avoid Large Libraries Like Moment.js
* Day.js / date-fns are recommended.

---

## 3. Image Optimization (Next.js Image)

### External Domain Image Optimization Settings (Important)

Even when using Next.js `<Image>`, external images **will not be optimized without domain configuration in next.config.js**.

```js
// next.config.js
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'example.com',
      },
    ],
  },
};
```

Forgetting this can cause build errors or disable optimization.

### Design With CDN (Vercel / Amplify) Caching in Mind
* Static images: bundle at build time
* Dynamic images: set Cache-Control headers

---

## 4. Font Optimization

### Use Next.js `next/font`

```ts
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"], weight: ["400", "700"] });
```

### Use SVGs Instead of Icon Fonts

* shadcn/ui + lucide-react is recommended.

---

## 5. CSS / Sass Optimization (Enhanced Bundle Optimization)

### Recommend Static CSS-Based Approaches

* Tailwind CSS
* CSS Modules
* Vanilla Extract
  → **Runtime CSS-in-JS is discouraged due to increased bundle size and client-side JS bloat**

### Reduce Unused CSS

* Use Tailwind's `content` configuration to eliminate unused classes
* For Sass/CSS Modules, use PurgeCSS or similar tools to remove unused CSS

---

## 6. Caching Strategy (Non-Overlapping Items Only)

### Leverage fetch Cache

```ts
fetch(url, { next: { revalidate: 60 } })
```

### Cache-Control for Route Handlers

```ts
return new Response(JSON.stringify(data), {
  headers: { "Cache-Control": "s-maxage=60" }
});
```

---

## 7. Re-render Optimization (Client Components)

### Proper Use of useCallback / useMemo

* Use only when the computation takes **>2ms per render** or the component renders lists of **100+ items** — profile with React DevTools before adding memoization
* **Ensure dependency array accuracy**

```tsx
// ❌ Creates a new object every render
const options = { page: 1, limit: 10 };
useEffect(() => {
  fetchData(options);
}, [options]); // Infinite loop

// ✔ Stabilize with useMemo
const options = useMemo(() => ({ page: 1, limit: 10 }), []);
useEffect(() => {
  fetchData(options);
}, [options]);
```

### Prevent Props Drilling
* Overusing Context can be counterproductive; **local context pattern** is recommended.

### Stabilize Keys
* Prohibit index keys
* Use unique IDs

---

## 8. List / Table / Infinite Scroll Optimization
### Use Virtualization
* react-window / react-virtualized

### Partial Suspense Splitting

```tsx
<Suspense fallback={<LoadingSkeleton />}>
  <LargeTable />
</Suspense>
```

---

## 9. Memory / CPU Cost Optimization

### Avoid Excessive Use of JSON.parse / JSON.stringify

### Use Web Workers for Heavy Processing
* Markdown parsing
* Image processing
* Audio processing

---

## 10. Network Optimization
### Chunk Prefetching
### Reduce Excessive API Calls
* Minimize fetching in Client Components; aggregate on the RSC side.

---

## 11. SEO + Web Vitals
### Measure Web Vitals in CI
* Monitor LCP / FID / CLS

### CLS Countermeasures
* Display skeletons
* Fix heights for images, cards, and ads

---

## 12. Mobile Optimization
### Ensure Tap Targets Meet Minimum Size (44px+)
### Prohibit Hover-Dependent UI
* Reduce unnecessary client-side JS.

---

## 13. Edge Functions / CDN Placement
### Use Edge APIs for Parts That Don't Require Authentication
### Static HTML Generation (SSG / ISR)
* Maximize Edge cache utilization.

---

## 14. Profiling
### React Profiler
### Chrome Performance Panel
### Next.js Bundle Analyzer

```bash
npm run analyze
```

---
# rate-limiting.md (common/)
---

# Rate Limiting Guidelines

This document defines the implementation patterns for API and action rate limiting.

---

## 1. Core Policy

- **Serverless-compatible**: Use a memory-based store by default. Migrate to Redis when any of these conditions are met:
  * Running 2+ server instances (memory stores are per-instance, so limits are not shared)
  * Sustained traffic exceeds 100 requests/second (memory cleanup overhead becomes significant)
  * Rate limit accuracy is business-critical (e.g., billing-related quotas where approximate counts are unacceptable)
- **Preset configurations**: Provide default settings by use case
- **User identification**: Limit by IP address or user ID

---

## 2. Implementation Patterns

### 2.1 Memory-Based Store

```ts
// lib/api/rate-limit.ts

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Memory store (each instance is independent in serverless environments)
const store = new Map<string, RateLimitEntry>();

// Periodic cleanup (every 1 minute)
const CLEANUP_INTERVAL = 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetTime < now) {
      store.delete(key);
    }
  }
}, CLEANUP_INTERVAL);
```

### 2.2 Preset Configurations

```ts
export const RateLimitPresets = {
  /** Auth: 10 requests/minute (brute force prevention) */
  auth: { limit: 10, windowMs: 60 * 1000 },

  /** AI generation: 30 requests/hour */
  generation: { limit: 30, windowMs: 60 * 60 * 1000 },

  /** General API: 100 requests/minute */
  api: { limit: 100, windowMs: 60 * 1000 },

  /** Webhook: 50 requests/minute */
  webhook: { limit: 50, windowMs: 60 * 1000 },

  /** Strict: 5 requests/minute (password reset, etc.) */
  strict: { limit: 5, windowMs: 60 * 1000 },
} as const;

export type RateLimitPreset = keyof typeof RateLimitPresets;
```

### 2.3 Rate Limit Check

```ts
export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;  // Unix timestamp (seconds)
  retryAfter?: number; // seconds
}

export function checkRateLimit(
  identifier: string,
  preset: RateLimitPreset | { limit: number; windowMs: number }
): RateLimitResult {
  const config = typeof preset === "string" ? RateLimitPresets[preset] : preset;
  const now = Date.now();
  const key = `${identifier}:${config.limit}:${config.windowMs}`;

  let entry = store.get(key);

  // Reset if no entry exists or window has elapsed
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    };
    store.set(key, entry);
  }

  const allowed = entry.count < config.limit;
  if (allowed) {
    entry.count++;
  }

  return {
    allowed,
    limit: config.limit,
    remaining: Math.max(0, config.limit - entry.count),
    resetTime: Math.ceil(entry.resetTime / 1000),
    retryAfter: allowed ? undefined : Math.ceil((entry.resetTime - now) / 1000),
  };
}
```

---

## 3. Client IP Retrieval

### 3.1 Proxy Support

```ts
// lib/api/client-ip.ts

export function getClientIp(request: Request): string {
  const headers = request.headers;

  // Vercel
  const xForwardedFor = headers.get("x-forwarded-for");
  if (xForwardedFor) {
    return xForwardedFor.split(",")[0].trim();
  }

  // Cloudflare
  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // AWS ALB / API Gateway
  const xRealIp = headers.get("x-real-ip");
  if (xRealIp) {
    return xRealIp;
  }

  // Fallback
  return "unknown";
}
```

### 3.2 Identifier Generation

```ts
/**
 * Generate an identifier for rate limiting.
 * Prioritize user ID if available, otherwise use IP address.
 */
export function getRateLimitIdentifier(
  request: Request,
  userId?: string
): string {
  if (userId) {
    return `user:${userId}`;
  }
  return `ip:${getClientIp(request)}`;
}
```

---

## 4. HTTP Headers

### 4.1 Setting Standard Headers

```ts
export function setRateLimitHeaders(
  headers: Headers,
  result: RateLimitResult
): void {
  headers.set("X-RateLimit-Limit", result.limit.toString());
  headers.set("X-RateLimit-Remaining", result.remaining.toString());
  headers.set("X-RateLimit-Reset", result.resetTime.toString());

  if (result.retryAfter) {
    headers.set("Retry-After", result.retryAfter.toString());
  }
}
```

### 4.2 Usage in Route Handlers

```ts
// app/api/generate/route.ts

import { checkRateLimit, getRateLimitIdentifier, setRateLimitHeaders } from "@/lib/api/rate-limit";
import { getClientIp } from "@/lib/api/client-ip";

export async function POST(request: Request) {
  const identifier = getRateLimitIdentifier(request);
  const rateLimitResult = checkRateLimit(identifier, "generation");

  if (!rateLimitResult.allowed) {
    const response = Response.json(
      {
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests. Please try again later.",
          retryAfter: rateLimitResult.retryAfter,
        },
      },
      { status: 429 }
    );

    setRateLimitHeaders(response.headers, rateLimitResult);
    return response;
  }

  // Normal processing...
  const response = Response.json({ success: true });
  setRateLimitHeaders(response.headers, rateLimitResult);
  return response;
}
```

---

## 5. Usage in Server Actions

```ts
// features/generation/server/actions.ts

import { checkRateLimit, getRateLimitIdentifier } from "@/lib/api/rate-limit";
import { headers } from "next/headers";

export async function generateImage(
  input: GenerateInput
): Promise<ActionResult<GenerationResult>> {
  return withAction({ logger }, async ({ errors }) => {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult.error;

    // Rate limit by user ID
    const rateLimitResult = checkRateLimit(
      `user:${authResult.user.id}`,
      "generation"
    );

    if (!rateLimitResult.allowed) {
      return {
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: `Rate limit reached. Please retry after ${rateLimitResult.retryAfter} seconds.`,
        },
      };
    }

    // Generation processing...
  });
}
```

---

## 6. Protecting Authentication Endpoints

```ts
// app/api/auth/login/route.ts

export async function POST(request: Request) {
  const ip = getClientIp(request);

  // Rate limit login attempts
  const rateLimitResult = checkRateLimit(`login:${ip}`, "auth");

  if (!rateLimitResult.allowed) {
    logger.warn({ ip }, "Login rate limit exceeded");

    return Response.json(
      { error: { code: "TOO_MANY_ATTEMPTS", message: "Too many login attempts" } },
      { status: 429 }
    );
  }

  // Login processing...
}
```

---

## 7. Scaling: Migration to Redis

### 7.1 Migration Criteria

| Metric | Continue with memory store | Consider Redis |
|------|-----------------|-----------|
| Number of instances | 1 | 2+ |
| Requests/second | < 100 | > 100 |
| Accuracy requirements | Approximate is acceptable | Strict accuracy needed |

### 7.2 Redis Implementation Example (Upstash)

```ts
// lib/api/rate-limit-redis.ts

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Create instances per preset
export const rateLimiters = {
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "60 s"),
    analytics: true,
    prefix: "ratelimit:auth",
  }),

  generation: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, "1 h"),
    analytics: true,
    prefix: "ratelimit:generation",
  }),

  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "60 s"),
    analytics: true,
    prefix: "ratelimit:api",
  }),
};

export async function checkRateLimitRedis(
  identifier: string,
  preset: keyof typeof rateLimiters
): Promise<RateLimitResult> {
  const limiter = rateLimiters[preset];
  const { success, limit, remaining, reset } = await limiter.limit(identifier);

  return {
    allowed: success,
    limit,
    remaining,
    resetTime: Math.ceil(reset / 1000),
    retryAfter: success ? undefined : Math.ceil((reset - Date.now()) / 1000),
  };
}
```

### 7.3 Environment Variables

```env
# Upstash Redis (optional)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
```

---

## 8. Testing

```ts
describe("Rate Limiting", () => {
  beforeEach(() => {
    // Clear the store
    store.clear();
  });

  it("allows requests within the limit", () => {
    const result = checkRateLimit("test-user", { limit: 5, windowMs: 60000 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("rejects requests exceeding the limit", () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit("test-user", { limit: 5, windowMs: 60000 });
    }

    const result = checkRateLimit("test-user", { limit: 5, windowMs: 60000 });
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it("counts independently for different users", () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit("user-a", { limit: 5, windowMs: 60000 });
    }

    const result = checkRateLimit("user-b", { limit: 5, windowMs: 60000 });
    expect(result.allowed).toBe(true);
  });
});
```

---

## 9. Monitoring and Alerting

```ts
// Log rate limit exceeded events
if (!rateLimitResult.allowed) {
  logger.warn({
    identifier,
    preset,
    remaining: rateLimitResult.remaining,
    resetTime: rateLimitResult.resetTime,
  }, "Rate limit exceeded");
}

// Metrics (optional)
// Upstash Analytics or custom aggregation
```

---

## 10. Summary

| Pattern | Usage |
|---------|------|
| Memory store | Development environment, single instance |
| Redis (Upstash) | Production environment, multiple instances |
| Presets | Default settings by use case |
| HTTP headers | Information provision to clients |

| Preset | Limit | Use Case |
|-----------|------|-------------|
| auth | 10/min | Login, password reset |
| generation | 30/hour | AI generation |
| api | 100/min | General API |
| webhook | 50/min | Webhook reception |
| strict | 5/min | Critical operations |

## Before/After Example

```typescript
// ❌ Before: No rate limiting on sensitive endpoint
export async function POST(request: Request) {
  const body = await request.json();
  return Response.json(await resetPassword(body.email));
}
```

```typescript
// ✅ After: Rate limiting applied before processing
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const result = checkRateLimit(`password-reset:${ip}`, "strict");
  if (!result.allowed) {
    return Response.json({ error: { code: "RATE_LIMIT_EXCEEDED" } }, { status: 429 });
  }
  const body = await request.json();
  return Response.json(await resetPassword(body.email));
}
```

---
# security.md (common/)
---

# Security Guidelines
This document summarizes the **security and privacy strategy** for large-scale Next.js applications.
Cloud service used: **Vercel**

---

# Purpose of the Security Strategy
* Handle sensitive data securely
* Prevent authentication and authorization vulnerabilities
* Minimize attack vectors for APIs, databases, and external integrations
* Implement privacy measures in compliance with applicable laws (e.g., data protection regulations, GDPR)
* Prevent misconfigurations and secret leaks during operations

---

# 1. Fundamental Principles (Zero Trust Architecture)
* Default deny: grant only the necessary permissions
* Separate responsibilities across each layer: Client -> Server -> DB
* Minimize scope of sessions, cookies, and tokens
* Require validation (Zod) for all input data
* Never include secrets in code
* Use minimal scopes for external API integrations (payment services, AI APIs, etc.)

---

# 2. Client-Side Security

## CSRF Prevention
* SameSite=Lax or stricter
* Enforce HTTPS
* Perform **Origin / Referer checks** in API Routes
* Allow only POST/PUT/DELETE for state-changing APIs

## Clickjacking Prevention
HTTP Headers:

```
X-Frame-Options: DENY
Content-Security-Policy: frame-ancestors 'none';
```

---

# 3. API / Route Handler Security

## Authorization
* Introduce RBAC/ABAC (role-based or attribute-based access control)
* Perform authorization checks at the Route Handler layer
* **Require IDOR prevention**: When accessing resources (e.g., `GET /api/users/:id`), always verify that the requesting user is the owner of that resource
* Verify through unit tests and integration tests that horizontal and vertical privilege escalation does not occur in authorization logic

## Rate Limiting
* Apply IP-based rate limiting via Vercel Edge Middleware
* When using an API Gateway, apply WAF + Throttling
* For external APIs (payment services, AI APIs, etc.), leverage each service's built-in rate limiting

---

# 3.1 IDOR Prevention Pattern (Implementation Examples)

> **Reference:** See frameworks/nextjs/server-actions.md for details on the ActionResult pattern and requireOwnership()

## Basic Pattern: Ownership Verification Helper

```ts
// src/lib/actions/auth-helpers.ts

export async function requireProjectOwnership(
  projectId: string
): Promise<AuthResult & { project: Project }> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return {
      success: false,
      error: ActionErrors.notFound("Project"),
    };
  }

  // IDOR prevention: verify ownership
  if (project.userId !== authResult.user.id) {
    logger.warn(
      { userId: authResult.user.id, projectId, ownerId: project.userId },
      "IDOR attempt detected: user tried to access another user's project"
    );
    return {
      success: false,
      error: ActionErrors.forbidden(),
    };
  }

  return { ...authResult, project };
}
```

## Usage Example in Server Actions

```ts
// ❌ BAD: No ownership verification
export async function updateProject(projectId: string, data: UpdateData) {
  await prisma.project.update({
    where: { id: projectId }, // Can update other users' projects
    data,
  });
}

// ✅ GOOD: With ownership verification
export async function updateProject(projectId: string, data: UpdateData) {
  const ownershipResult = await requireProjectOwnership(projectId);
  if (!ownershipResult.success) return ownershipResult.error;

  await prisma.project.update({
    where: { id: projectId },
    data,
  });
}
```

## Query Filter Pattern

```ts
// Query pattern to retrieve only the user's own resources
export async function getUserProjects(): Promise<ActionResult<Project[]>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult.error;

  // ✅ Filter by userId in the WHERE clause
  const projects = await prisma.project.findMany({
    where: { userId: authResult.user.id },
  });

  return createActionSuccess(projects);
}
```

---

# 3.2 Rate Limiting

> **Reference:** See common/rate-limiting.md for complete implementation patterns

## Presets

| Preset | Limit | Use Case |
|--------|-------|----------|
| auth | 10/min | Login, password reset |
| generation | 30/hour | AI generation |
| api | 100/min | General API |
| strict | 5/min | Critical operations |

## Implementation Approach

- **Development / single instance**: Memory-based store
- **Production / multiple instances**: Redis (Upstash)
- **Standard headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`

---

# 3.3 Webhook Security

## Signature Verification Pattern

```ts
// Webhook signature verification (generic pattern)
export async function verifyWebhookSignature(
  req: Request
): Promise<{ valid: boolean; body?: WebhookEvent }> {
  const body = await req.text();
  const headers = Object.fromEntries(req.headers.entries());

  // Signature verification using each service's SDK
  // * Refer to project-specific guidelines for implementation details
  const isValid = await webhookService.verifySignature(
    headers,
    body,
    process.env.WEBHOOK_SECRET!
  );

  if (!isValid) {
    logger.warn({ headers }, "Invalid webhook signature");
    return { valid: false };
  }

  return { valid: true, body: JSON.parse(body) };
}
```

## Replay Attack Prevention

```ts
export async function processWebhook(eventId: string): Promise<boolean> {
  // Check if already processed
  const existing = await prisma.webhookEvent.findUnique({
    where: { externalId: eventId },
  });

  if (existing) {
    logger.info({ eventId }, "Webhook already processed, skipping");
    return false; // Ensure idempotency
  }

  // Record the start of processing
  await prisma.webhookEvent.create({
    data: {
      externalId: eventId,
      status: "processing",
    },
  });

  return true;
}
```

## Timestamp Validation

```ts
// Reject webhooks that are too old (replay attack prevention)
const WEBHOOK_MAX_AGE = 5 * 60 * 1000; // 5 minutes

function validateTimestamp(timestamp: string): boolean {
  const eventTime = new Date(timestamp).getTime();
  const now = Date.now();

  if (now - eventTime > WEBHOOK_MAX_AGE) {
    logger.warn({ timestamp, age: now - eventTime }, "Webhook too old");
    return false;
  }

  return true;
}
```

---

# 3.4 CSP Nonce Header

Generate a CSP nonce per request to control inline script execution.

```typescript
// middleware.ts
const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
const csp = `script-src 'nonce-${nonce}' 'strict-dynamic'; ...`;
response.headers.set("Content-Security-Policy", csp);
response.headers.set("x-nonce", nonce);
```

- Prohibit the use of `'unsafe-inline'`
- Establish a trust chain with `'strict-dynamic'`
- Inline scripts such as next-themes require nonce propagation

---

# 3.5 Webhook Certificate URL SSRF Prevention

When using certificate URLs for webhook signature verification, prevent SSRF attacks.

```typescript
// src/lib/external/webhook-utils.ts
function isValidWebhookCertUrl(certUrl: string, allowedHosts: string[]): boolean {
  const url = new URL(certUrl);
  if (url.protocol !== "https:") return false;
  // allowedHosts example: ["api.example.com", "api.sandbox.example.com"]
  return allowedHosts.some(
    (host) => url.hostname === host || url.hostname.endsWith(`.${host}`)
  );
}
```

- Use a domain allowlist approach (safer than IP blocklists)
- Call at the beginning of `verifyWebhookSignature()`

---

# 3.6 Email Template HTML Injection Prevention

Always escape user-derived data when embedding it in HTML emails.

```typescript
// src/lib/email.ts
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
```

- Trusted values such as translation results, plan names, UUIDs, and numbers do not need escaping
- Free-text fields such as admin-entered notes must always be escaped

---

# 3.7 Error Page Information Leakage Prevention

- Never display stack traces in `error.tsx` / `global-error.tsx`
- Only `error.digest` (a safe hash) may be displayed
- Exclude `error.message` / `error.stack` from API Route error responses

---

# 3.8 Session Management

- Maximum concurrent sessions: 5 (per user)
- Session list UI: display device, IP, and location information
- Bulk logout functionality
- TOTP 2FA: lock for 15 minutes after 5 failed attempts, send lock notification email

### Suspicious Login Detection and Notification

```typescript
// src/lib/security/suspicious-login-detector.ts
export async function detectSuspiciousLogin(params: {
  userId: string;
  currentCountry: string | null;
}): Promise<SuspiciousLoginResult>
// Returns: { isSuspicious, reasons, currentCountry, knownCountries }
```

- Compare the current country against successful login history from the past 30 days
- Return `isSuspicious: true` when a login is from a new country
- `LoginHistory` model has a `country` column (ISO 3166-1 alpha-2)
- Country information is obtained from `x-user-country` / `x-vercel-ip-country` / `cf-ipcountry` headers
- On detection, send email notification via `sendSuspiciousLoginEmail()` (including IP, country, browser, and OS information)
- **Asynchronous sending**: do not block the login flow
- **Fail-safe**: on error, assume "not suspicious" (do not block legitimate users)
- First login (no history) is not treated as suspicious

---

# 3.9 OSS License Policy

> **Reference:** Refer to project-specific legal and compliance guidelines

- **Prohibited**: AGPL, GPL-2.0, GPL-3.0 (SaaS source code disclosure obligation)
- **Permitted**: MIT, Apache-2.0, ISC, BSD variants, CC0, Unlicense, MPL-2.0
- Run `npx license-checker` when adding dependency packages

---

# 3.10 Admin Panel IP Restriction

```typescript
// src/lib/security/admin-ip-restriction.ts
export function isAdminIpAllowed(clientIp: string | null): boolean
```

- Set IP allowlist via the `ADMIN_ALLOWED_IPS` environment variable
- Multiple IPs can be specified with comma separation (e.g., `203.0.113.1,192.168.1.0/24`)
- **CIDR notation support**: subnet-level authorization (mask comparison via bitwise operations)
- **IPv6 normalization**: `::1` is converted to `127.0.0.1`
- If undefined, no restriction is applied (all IPs can access)
- Block access if IP cannot be determined
- Check in `src/middleware.ts` when accessing `/admin` paths

---

# 3.11 Maintenance Mode

```typescript
// src/middleware.ts
if (
  process.env.MAINTENANCE_MODE === "true" &&
  pathname !== "/maintenance" &&
  !isAdminIpAllowed(clientIp)
) {
  return NextResponse.redirect(new URL("/maintenance", req.url));
}
```

- Enable with the environment variable `MAINTENANCE_MODE=true`
- Redirect all users to the `/maintenance` page
- **Admin IP bypass**: IPs listed in `ADMIN_ALLOWED_IPS` can access normally
- Maintenance page: `/app/maintenance/page.tsx`
- GCP downtime guide: `docs/setup/gcp/12_downtime-and-maintenance.md`

---

# 4. Database Security
## Prisma + DB Protection
* Use minimum privileges for DB users (consider introducing read-only users). "Minimum privileges" means:
  * Application DB user: only `SELECT`, `INSERT`, `UPDATE`, `DELETE` on application tables — no `CREATE`, `DROP`, `ALTER`, or `GRANT`
  * Read-only DB user (for analytics/reporting): only `SELECT`
  * Migration DB user (CI only): full DDL permissions, never used at runtime
* Store DB credentials in `.env` or cloud secret management

## Data Encryption
* Set appropriate **file access permissions** for the database (SQLite)
* Consider application-layer encryption for personal data (e.g., AES-256)
* **Encryption key management**: Manage keys in a dedicated secret management service rather than Vercel environment variables, retrieving them only at runtime
* **Key rotation**: Require periodic key rotation

---

# 5. Secrets / Environment Variable Management
## Vercel
* Project Settings -> Environment Variables
* Manage separately for Development / Preview / Production
* Never include in Git
* Recommended: introduce Protected Environments

## GitHub
* Manage with GitHub Actions Secrets
* Rule: do not pass production environment variables to PR environments

---

# 6. HTTPS / Communication Security
* **Vercel provides HTTPS automatically**
* Enforce wss:// when using WebSockets
* API calls must use HTTPS only
* Set the Secure attribute on cookies

---

# 7. External Service Integration Security
## Payment Services
* Protect webhooks with Vercel Serverless Functions
* Always verify webhook signatures (see Section 3.3)
* Strictly separate Client ID and Secret

## AI API / OAuth
* Minimize OAuth authorization scopes
* Use short-lived Access Tokens (encrypt Refresh Tokens for storage)

## RSS / Markdown
* Validate external RSS URLs with Zod
* Fetch on SSR and render with sanitization to prevent XSS
* Recommended: GitHub Flavored Markdown + `remark-gfm`

---

# 8. Session Management (NextAuth.js)
* Cookie-based sessions (Secure / HttpOnly / SameSite)
* Store encryption keys as Secrets even when using JWT mode
* Do not include sensitive data in session information
* Always enable OAuth Provider state parameter validation

---

# 9. Privacy Protection (Privacy by Design)
## Minimize Collected User Data

* Collect only data with a clear purpose and necessity
* Establish data retention period policies
* Recommend anonymization / pseudonymization

## Cookie & Tracking Management
* Implement Cookie Policy / Consent Banner
* Use anonymized analytics (Vercel Analytics)

## GDPR / Data Protection Law Compliance
* Support data deletion requests (Right to Erasure)
* Support user data export (Right to Access)
* Maintain a privacy policy

---

# 10. CI/CD Security

* Inject secrets securely in GitHub Actions
* All PRs must go through review and CI
* Detect vulnerabilities with Dependabot / npm audit / Snyk
* **Vulnerability response SLA**: Patch Critical (CVSS 9.0+) within 24 hours, High (CVSS 7.0+) within 7 days
* When patching is difficult, introduce mitigation measures at the WAF / API Gateway level
* Do not include sensitive data in containers or build artifacts

---

# 11. Security Audit / Automated Checks

* Static analysis with CodeQL (GitHub)
* Vulnerability checks with npm audit / Snyk
* Regularly review Vercel Security Insights

---

# 12. Security Monitoring and Response

* **Log collection**: Record authentication failures, authorization failures (IDOR, etc.), and Zod validation errors at ERROR/CRITICAL level in Sentry / CloudWatch
* **Alert operations**:

  * Abnormal login attempts (e.g., 100+ in 10 minutes)
  * API authorization failures (e.g., 50+ in 5 minutes)
    -> Immediately notify the responsible team
* **Operational rules**: Establish regular reviews and incident response procedures

---

# Summary

* Authentication and authorization based on **Zero Trust principles**
* **Require input validation for all inputs** (Zod)
* Manage secrets securely with **Vercel / GitHub**
* Define explicit permission boundaries for API / DB / external API access; require IDOR prevention
* Manage encryption keys with a dedicated service and rotate them regularly
* Respond to CI/CD vulnerabilities promptly based on SLAs
* Ensure attack detection and response through logging, monitoring, and alerting
* Comply with privacy laws and minimize user data collection

---
# testing.md (common/)
---

# Testing Guidelines
This document defines testing strategy for large-scale Next.js applications, focusing on project-specific decisions and non-obvious patterns.

---

# 1. Testing Core Policy
## 1. Prioritize Testing Critical Logic
Critical logic = code where a bug has **high business cost or security impact**:
- **Financial**: Pricing calculations, subscription billing, payment flows ({Payment Service})
- **Security**: Authentication (NextAuth), authorization decisions, IDOR prevention
- **Data integrity**: DB queries (Prisma) that modify state, cascade deletes
- **Core business rules**: Date calculations, scheduling logic, domain-specific validation
  → If a bug in this code would require immediate hotfix or cause revenue loss, it is critical.

## 2. Server-side logic uses **unit tests + API integration tests** as the baseline
- Server Actions / Route Handler logic is unit-testable
- **Note DB environment differences**
  - Both production and test environments use SQLite. Use a separate SQLite file (or in-memory DB) for testing.
  - Add a migration dry run to CI/CD to verify schema consistency.

## 3. UI testing priority: **E2E > Integration > Unit**
- UI tests are costly, so only guarantee "critical user experience areas" with E2E

## 4. Introduce Contract Tests for external service integrations
- For external APIs like payment APIs, AI APIs, and RSS,
  adopt Contract Tests that are resilient to specification changes in real services
- **Note**: Contract Tests serve a different purpose from MSW (detecting external service specification changes)
  - Implementation method needs clarification (e.g., Pact + Webhook payload verification, SDK type definition comparison, OpenAPI specification comparison)

---

# 2. Layer-Specific Testing Strategy
## 1. Domain Logic (Unit Test)
- Zod schemas must always have standalone schema tests

### Example: Pricing logic / data transformation
```
features/billing/domain/
features/calendar/domain/
```

---

## 2. API / Server Actions (Integration Test)
### Key Points
- Switch Prisma to **a test-specific SQLite / in-memory DB**
- Mock external APIs (payment / AI API, etc.) with MSW or mocks
- Add migration dry runs to CI/CD

### Server Actions Test Pattern

```ts
// tests/unit/server-actions/project-actions.test.ts

import { createProject, deleteProject } from "@/features/project/server/project-actions";
import { prisma } from "@/lib/prisma";

// Mock authentication context
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

describe("Project Actions", () => {
  beforeEach(() => {
    // Reset DB for each test
    await prisma.project.deleteMany();
  });

  describe("createProject", () => {
    it("allows authenticated users to create a project", async () => {
      // Mock authentication
      (auth as jest.Mock).mockResolvedValue({
        user: { id: "user_123" },
      });

      const result = await createProject({ name: "Test Project" });

      expect(result.success).toBe(true);
      expect(result.data?.id).toBeDefined();
    });

    it("returns UNAUTHORIZED for unauthenticated users", async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const result = await createProject({ name: "Test" });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("UNAUTHORIZED");
    });

    it("returns fieldErrors on validation error", async () => {
      (auth as jest.Mock).mockResolvedValue({ user: { id: "user_123" } });

      const result = await createProject({ name: "" }); // Empty string

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("VALIDATION_ERROR");
      expect(result.error?.fieldErrors?.name).toBeDefined();
    });
  });

  describe("deleteProject - IDOR Prevention", () => {
    it("returns FORBIDDEN for another user's project", async () => {
      // Create another user's project
      const otherProject = await prisma.project.create({
        data: { name: "Other", userId: "other_user" },
      });

      (auth as jest.Mock).mockResolvedValue({ user: { id: "user_123" } });

      const result = await deleteProject(otherProject.id);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("FORBIDDEN");
    });
  });
});
```

### ActionResult Pattern Test Helper

```ts
// tests/helpers/action-helpers.ts

import type { ActionResult } from "@/lib/actions/action-helpers";

export function expectSuccess<T>(result: ActionResult<T>): asserts result is { success: true; data: T } {
  expect(result.success).toBe(true);
  if (!result.success) throw new Error("Expected success");
}

export function expectFailure(result: ActionResult<unknown>, code: string) {
  expect(result.success).toBe(false);
  if (result.success) throw new Error("Expected failure");
  expect(result.error.code).toBe(code);
}

// Usage example
it("project creation succeeds", async () => {
  const result = await createProject({ name: "Test" });
  expectSuccess(result);
  expect(result.data.id).toBeDefined();
});
```

---

## 3. UI / Pages (E2E Test)
### Critical Path Criteria
An E2E test is "critical path" if it covers a flow where **failure blocks the user from completing their primary goal** or **causes financial/security harm**:
- Authentication flow (login / sign up) — users cannot access the app without it
- Payment flow — revenue-impacting
- Dashboard main navigation — primary entry point after auth
- Critical CRUD operations (e.g., task create → update → delete) — core value proposition

### Security Test Playbook
- Attempt to access other users' data by ID replacement after login
- CSRF token exploitation
- XSS / Injection via form input

---

## 4. Contract Test (External Services)
### Payment API / AI API, etc.
- Payment/subscription API contracts, Webhook payloads, SDK type definition consistency
- Implement Consumer-Driven Contracts with Pact, etc.
- Purpose: detect specification changes in external services
- MSW is for internal API mocking, not a substitute for Contract Tests

---

# 3. Performance & Quality Assurance
## 1. Performance Test
- API Route load testing with k6
- SSR response measurement on Vercel / Amplify

## 2. Automated Lighthouse Score Measurement
- Integrate into CI/CD, auto-measure on PR

## 3. Security Test
- Integrate static/dynamic analysis tools (ZAP, SonarQube) into CI/CD
- Detect vulnerabilities in authentication, authorization, and payment flows

---

# 4. Test Target Priority
1. Authentication (NextAuth)
2. Payments ({Payment Service})
3. DB (Prisma) + Route Handler
4. Logic (including Zod schemas)
5. Critical UI flows users must navigate
6. Key external API integrations
7. Edge cases (e.g., invalid tokens / expired sessions)

---

# 5. Directory Structure
```
tests/
  unit/
    calendar/
    billing/
    integration/
    api/
    server-actions/
  e2e/
    auth/
    dashboard/
    mocks/
    msw/
src/
  features/
    billing/
      domain/
      components/
      api/
    calendar/
      domain/
```

---

# 6. Summary
- Increase change resilience for external APIs (payment, AI API, etc.) with Contract Tests
- MSW-based internal API mocking strategy
- E2E covers only flows where failure blocks users or causes financial/security harm
- Integrate Security Tests into CI/CD for early vulnerability detection
- Run tests on test SQLite (file or in-memory) with production-identical schemas

## Before/After Example

```typescript
// ❌ Before: Testing only the success path
it("creates a project", async () => {
  const result = await createProject({ name: "Test" });
  expect(result.success).toBe(true);
});
```

```typescript
// ✅ After: Testing success, auth failure, and IDOR prevention
it("creates a project", async () => {
  const result = await createProject({ name: "Test" });
  expectSuccess(result);
});
it("rejects unauthenticated users", async () => {
  mockAuth(null);
  const result = await createProject({ name: "Test" });
  expectFailure(result, "UNAUTHORIZED");
});
it("prevents access to another user's project", async () => {
  const result = await deleteProject(otherUserProjectId);
  expectFailure(result, "FORBIDDEN");
});
```

---
# validation.md (common/)
---

# Validation Guidelines
This document outlines how to manage **Types** and **Validation** in a unified manner across large-scale Next.js applications, centered on Zod and Prisma.

---

# 1. Core Policy
* Build a structure where types naturally synchronize in the order **Zod → Prisma → TypeScript**.
* API schemas can be converted from **Zod → JSON Schema (for AI APIs, etc.)** for external sharing.

---

# 2. Business Logic Rules in Zod Schemas

Business logic rules that belong in Zod schemas (not just format validation):

* **Cross-field constraints**: e.g., `endDate` must be after `startDate`, `maxPrice` >= `minPrice`
* **Domain value boundaries**: e.g., quantity must be 1-999, discount percentage 0-100
* **Conditional required fields**: e.g., if `paymentMethod` is "card", `cardNumber` is required
* **Enumerated state transitions**: e.g., order status can only move from "pending" → "confirmed" → "shipped"
* **Composite uniqueness hints**: e.g., `slug` must match `^[a-z0-9-]+$` pattern (DB enforces actual uniqueness)

Rules that do NOT belong in Zod (handle in service/domain layer):
* Checks requiring DB lookups (e.g., "email must not already exist")
* Rules depending on external service state (e.g., "inventory must be available")
* Multi-aggregate consistency checks

---

# 3. Synchronizing Zod Schemas and Prisma Models

Recommended process:
1. **Write Zod first**
   UI requirements and business requirements are consolidated in Zod.
2. **Define Prisma models based on Zod**
   Enums and similar constructs are also mapped to the Prisma Schema.
3. Generate/update the DB via Prisma migrate.
4. Frontend, backend, and API all use Zod-derived types.

### Single Source of Truth for Types
* **Truth for input types: Zod**
* **Truth for DB: Prisma**
* **Truth for API Schema: Zod (→ JSON Schema generation)**

---

# 4. Directory Structure (Schema / Prisma / Types)

```
src/
 ├─ features/
 │   ├─ user/
 │   │   ├─ schema/          # Zod schemas (source of truth for input)
 │   │   ├─ types/           # Types generated via infer()
 │   │   ├─ services/        # Zod → Prisma transformation
 │   │   └─ server/          # Route Handler / Server Actions
 │
 ├─ lib/
 │   ├─ prisma/              # Prisma Client
 │
 └─ types/                   # Global types
```

---

# 5. API Schema (JSON Schema) Generation

* Zod schemas can be converted to JSON Schema,
  serving as **the foundation for AI API schemas, external APIs, and specification generation**.

Benefits:
* Prevents type mismatches
* Unifies the API ecosystem
* Facilitates automatic documentation generation

---

# 6. Guidelines for Zod and Prisma Definition Duplication Risk
Since Zod and Prisma define the same fields, there is a **risk of inconsistency when changes are made**.
Follow these principles to mitigate:

### Principles
1. **Input constraints (validation) → Zod is the sole source of truth**
2. **Structural constraints (DB integrity) → Prisma is the sole source of truth**
3. Shared domain rules (enum / MinMax / Regex) should be **defined in both Zod and Prisma** where possible

### Operational Rules

| Case | Where to Define | Reason |
| --- | --- | --- |
| UI/external input validation | Zod only | Changes frequently; Prisma changes are costly |
| DB integrity constraints | Prisma only | Cannot be guaranteed by Zod |
| Application-wide business rules | Zod → sync to Prisma | Single source management |
| Enum / fixed values | Both | Required to prevent type mismatches |

### Recommended Support Tools

| Tool | Effect |
| ---------------------- | ------------------ |
| `zod-prisma` type sync tool | Assists Zod → Prisma conversion |
| `@anatine/zod-openapi` | Generates OpenAPI from Zod |
| `@ts-safeql/prisma` | Improves type safety for Prisma queries |

> **Duplication is acceptable, but responsibilities must be clearly separated.**
> Maintain the structure where validation and transformation belong to Zod, and DB protection belongs to Prisma.

---

# 7. Summary (Zod + Prisma)

* Types from UI → API → DB naturally synchronize via Zod → Prisma
* JSON Schema generation unifies external API schemas as well
* **Definition duplication is tolerated from a responsibility separation perspective, but intentional synchronization management must be enforced**

## Before/After Example

```typescript
// ❌ Before: Inline validation without Zod, no type inference
function createUser(data: any) {
  if (!data.email || !data.email.includes("@")) throw new Error("Bad email");
  if (!data.name) throw new Error("Name required");
  return prisma.user.create({ data });
}
```

```typescript
// ✅ After: Zod schema as single source of truth with inferred types
const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});
type CreateUserInput = z.infer<typeof CreateUserSchema>;

function createUser(data: CreateUserInput) {
  return prisma.user.create({ data });
}
```

---
# api.md (frameworks/nextjs/)
---

# API Design Guidelines
This chapter summarizes how to design and divide responsibilities between **Route Handlers (app/api/)** and
Server Actions in Next.js large-scale applications.

---

# 1. API Design Basic Principles
In Next.js App Router, the following two types are used depending on the use case.

* **Route Handler (app/api/*/route.ts)**
  → For REST API / Webhook / receiving from external services / public endpoints
* **Server Actions**
  → Server methods called from pages and components (forms / internal processing)

As a general rule:
* External clients (mobile apps / Webhooks / other services)
  → **Use Route Handlers**
* Internal UI events (form submissions / Mutations)
  → **Use Server Actions**
* APIs requiring authentication → **Perform session checks within Server Actions or Route Handlers**

---

# 2. Route Handlers (REST API) Design Guidelines

Place APIs in `app/api/**/route.ts`.

## 2.1 Directory Structure (Example)

```
app/
└─ api/
   ├─ auth/
   │   └─ route.ts
   ├─ users/
   │   ├─ [id]/
   │   │   └─ route.ts
   │   └─ route.ts
   ├─ posts/
   └─ webhooks/
       └─ {service}/        # Example: stripe, paypal, etc.
           └─ route.ts
```

---

# 3. Role Separation: Route Handler vs Server Actions

| Use Case | Route Handler | Server Actions |
| --- | --- | --- |
| External API / Webhook | Recommended | Not applicable |
| Access from outside the site | Recommended | Not applicable |
| Internal UX optimization (form submissions, etc.) | Possible | Recommended |
| Secure processing requiring authentication | Recommended | Recommended |
| Data fetching via Server Actions | Possible | Recommended (called via useAsyncAction / useListData) |
| UI-dependent Mutation | Possible | Recommended |

---

# 4. Validation Policy (Zod)

Schema validation with **Zod** is required for both Route Handlers and Server Actions.

```ts
const schema = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
});
```

* Safely parse request body (json/form-data) with Zod
* Return 400/422 for errors
* Always pass **validated data** to Prisma / DB

---

# 5. Server Actions Characteristics and Implementation Guidelines
Server Actions are treated as **UI-coupled** server logic.

---

## 5.1 Security: Zod Validation is Required
> Since form values can be tampered with on the client side,
> **Zod validation immediately after Action function execution is required**

```ts
export async function createPostAction(prevState: any, formData: FormData) {
  const parsed = schema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return { error: "Invalid input" };
  }

  // DB operation...safe
}
```

---

## 5.2 UI Integration (form / useFormState / useFormStatus)
* Can be directly bound to `<form action={serverAction}>`
* With `useFormState` and `useFormStatus`,

  * **Loading state**
  * **Validation error display**
    are automatically reflected on the client side

→ **Client Components become simpler (no unnecessary fetch required)**

---

# 6. Route Handler Security

Route Handlers receive external access, so
**security header application is required**.

* **CORS** — restrict `Access-Control-Allow-Origin` to your own domains; prevents other websites from making authenticated requests on behalf of your users
* **CSP** — set `Content-Security-Policy` to control which scripts/styles/images can load; mitigates XSS by blocking inline scripts and unauthorized origins
* **XSS protection** — set `X-Content-Type-Options: nosniff` and sanitize any user-generated content rendered in responses

### Implementation Examples

* Global settings: `next.config.js`
* Specific endpoints: Add headers to `Response`

```ts
return new Response(JSON.stringify(data), {
  headers: {
    "Content-Security-Policy": "default-src 'none'",
    "Access-Control-Allow-Origin": "https://example.com",
  },
});
```

---

# 7. Authentication (NextAuth.js)

## 7.1 Route Handler Case

```ts
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });
}
```

* Role-based access control (RBAC) can be applied
* Authentication logic is consolidated in lib/auth

---

## 7.2 Server Actions Case

* `auth()` operates securely on the server
* Works well with UI-coupled mutations

---

# 8. Error Handling

> **Reference:** For error classification, HTTP status details, and user-facing messages, see common/error-handling.md
> **Reference:** For the Server Actions ActionResult pattern, see frameworks/nextjs/server-actions.md

### Route Handler (REST API) Format

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid Request"
  }
}
```

Determine success/failure by HTTP status code (200-299 = success, 4xx/5xx = error).

### Server Actions Format

```ts
// ActionResult pattern (discriminated union)
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: ActionError };
```

Determine success/failure by the `success` flag, not HTTP status.

### Usage Guidelines

| Target | Format | Reason |
|------|------|------|
| Route Handler | REST JSON + HTTP status | External client compatibility |
| Server Actions | ActionResult | Type safety, React integration |

---

# 9. External Integration (Webhook / External API / RSS)

### Payment Service Webhooks
* Use Route Handlers only (Server Actions not allowed)
* Place in `app/api/webhooks/{service}/route.ts`
* Signature verification must be implemented

### External APIs (AI services, etc.)
* Both Route Handlers and Server Actions are acceptable
* Authentication credentials are securely maintained on the server

### RSS
* fetch within Route Handler → CORS bypass

---

# 10. Cache / Revalidate
For public APIs:

```ts
export const revalidate = 60;
```

For authenticated APIs:

```ts
export const dynamic = "force-dynamic";
```

---

# 10.5 Pagination Pattern

> **Reference:** For the complete implementation of `executePaginatedQuery()`, see frameworks/nextjs/server-actions.md#7

Implement unified pagination for list retrieval APIs.

### Usage Example in Route Handler

```ts
// app/api/projects/route.ts
import { executePaginatedQuery } from "@/lib/actions/action-helpers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");

  const result = await executePaginatedQuery(prisma.project, {
    where: { isPublic: true },
    orderBy: { createdAt: "desc" },
    page,
    limit,
  });

  return Response.json(result);
}
```

### Response Format

```json
{
  "items": [...],
  "total": 50,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

---

# 11. Summary
* Use **Route Handlers** for external-facing APIs
* Use **Server Actions** for UI operations
* **Zod validation on all inputs**
* **Thorough authentication checks** with NextAuth
* Strict REST design + HTTP methods
* Webhooks (payment services, etc.) use Route Handlers only
* **Security headers are required** for Route Handlers
* Server Actions optimize UX through form integration

---
# auth.md (frameworks/nextjs/)
---

# Authentication Guidelines

> **[Replaceable]** This guide uses **NextAuth.js (Auth.js) v5**. If your project uses **Clerk**, **Lucia**, **Auth0**, or another auth provider, replace the authentication patterns accordingly. The principles (server-first authentication, RBAC, session security) remain the same.

This document defines the **NextAuth.js design policy** for large-scale Next.js applications.
It covers **authentication flow, session management, API protection, RSC support, role-based access control (RBAC), and deployment environments** for large-scale applications.

---

## 1. Core Principles (App Router + NextAuth.js v5)
- Adopt **Auth.js (NextAuth.js) v5**, the official recommendation for App Router
- **Excellent compatibility with Server Components, enabling secure session access via `auth()`**
- **Minimize front-end session management (Server-first approach)**: By performing auth checks on the server, you avoid exposing session tokens and role data to client-side JavaScript. This eliminates an entire class of XSS-based session theft attacks, prevents the UI "flash" of unauthenticated content, and ensures that authorization decisions cannot be bypassed by manipulating client-side state.
- `auth()` can be used uniformly across API Routes / Server Actions / RSC
- Use Prisma Adapter for the DB (SQLite)

---

## 2. Directory Structure

```
/src
  /lib/auth/
    config.ts          # NextAuth.js configuration (providers, callbacks)
    auth.ts            # Export-only for auth(), signIn(), signOut()
  /app/api/auth/[...nextauth]/route.ts  # NextAuth endpoint
  /middleware.ts       # Authentication guard
```

---

## 3. NextAuth.js Configuration (config.ts)
### Standard Configuration Using Prisma Adapter

```ts
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";

export const authConfig = {
  adapter: PrismaAdapter(db),
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: {},
        password: {}
      },
      authorize: async (cred) => {
        // Verify user against DB
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,   // 7 days
    updateAge: 24 * 60 * 60,    // 24 hours
  },
  callbacks: {
    // Fetch latest role from DB on JWT refresh
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.version = user.sessionVersion ?? 0;
      } else {
        // Fetch latest role information from DB and update token
        const dbUser = await db.user.findUnique({ where: { id: token.id } });
        if (dbUser) {
          token.role = dbUser.role;
          token.version = dbUser.sessionVersion ?? 0;
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role;
      session.user.sessionVersion = token.version;
      return session;
    },
    // Processing for new user registration or account linking
    async signIn({ user, account }) {
      // Define credential and OAuth linking policy here
      return true;
    },
  },
};
```

---

## 4. Authentication Flow (Server-first)
* Perform authentication in Server Components / Server Actions to prevent unauthenticated state "flash" on the client side.
* Example of a page requiring authentication:

```ts
import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return <Dashboard />;
}
```

---

## 5. Page Protection via Middleware (middleware.ts)

```ts
import { auth } from "@/lib/auth";

export default auth((req) => {
  return { authorized: !!req.auth };
});

export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*"],
};
```

---

## 6. Protecting API Routes / Server Actions
### API Route

```ts
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  return Response.json({ message: "ok" });
}
```

### Server Action

```ts
"use server";
import { auth } from "@/lib/auth";

export async function updateProfile(data: FormData) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  // Update processing
}
```

---

## 7. Role-Based Access Control (RBAC)
* Roles are consolidated in **session.user.role**
* Final check is done server-side; UI serves only as supplementary display

```ts
const session = await auth();
if (session?.user.role !== "admin") throw new Error("Forbidden");
```

* **Immediate role reflection via JWT version number mechanism**:
  The problem this solves: JWTs are stateless and valid until they expire. If an admin revokes a user's role, the user's existing JWT still contains the old role and remains valid. The `sessionVersion` counter in the DB is incremented whenever a user's role changes. On each JWT refresh, the callback compares the token's version against the DB version — if they differ, the token is updated with the new role. This provides near-real-time role revocation without requiring a full DB session strategy.

---

## 8. Session Strategy
* **JWT Strategy (Recommended)**: Easy to scale, suited for distributed environments
* DB Strategy: Consider when advanced session management is required

---

## 9. Deployment Environment Considerations
### Vercel
* Officially recommended environment for NextAuth.js
* Edge Runtime support
* Be mindful of Prisma connection limits (PlanetScale / Neon recommended)

---

## 10. Security Policy
* CSRF protection is auto-generated
* Cookie `secure`, `httpOnly`, `sameSite` are automatically configured per environment
* OAuth redirect URI is fixed per environment
* Passwords are hashed with argon2

---

## 11. Prohibited Practices (Anti-patterns)
* Directly parsing sessions in Routes without using auth()
* Tampering with role information on the front end
* Using DB session strategy for large-scale use cases

---

## 12. Summary

* **Server-first + NextAuth.js v5** is optimal for large-scale development
* Unify authentication, permissions, and sessions on the server side
* Use `auth()` securely in API Routes / Server Actions
* Stable operation on Vercel
* Systematized RBAC, session strategy, and API protection
* **JWT Callback-based role synchronization** with on-demand session invalidation for immediate response to permission changes
* Clear initial registration and linking policies for multi-provider usage
* Explicitly configure session `maxAge` / `updateAge`

---
# build.md (frameworks/nextjs/)
---

# Build Guidelines
This document formulates a Code Splitting strategy to maximize Next.js build optimization features (App Router + Turbopack + Server Components), with the goals of **fast initial load**, **reduced runtime cost**, and **improved maintainability**.

---

# 1 Build Strategy (Build Optimization)
## 1. Adopt Server Components by Default
- Server Components are the standard in App Router
- Server Components send **zero JavaScript to the client** — their output is streamed as serialized React elements (RSC payload), not executable JS. This means a page composed entirely of Server Components has no hydration cost and the browser only downloads HTML and the RSC runtime (~5KB). Each Client Component you add increases the JS bundle that must be downloaded, parsed, and hydrated.
- Extract only interactive parts into Client Components

### Processing Suited for Server Components
- DB/Prisma queries
- Authentication (NextAuth)
- External API calls
- SSG/SSR data fetching
- Static layouts

### Addendum: Caching Strategy for the Data Fetching Layer
- DB/API calls in Server Components should leverage **React's `cache` function and Next.js fetch extensions** to prevent duplicate calls
- Designing a caching strategy can reduce both build time and runtime cost

---

## 2. Minimize Client-Side Code
- Limit where `use client` is applied to the minimum
(Only for forms, interactions, and dynamic UI)
- Import only the necessary parts of third-party UI libraries
  - shadcn/ui has good compatibility as it supports tree-shaking

### The "Waterfall" Problem with imports and use client
- Directly importing many Server Components inside a Client Component risks including unnecessary code in the client bundle
- **Design principle:** Keep Server Components as "leaves" — meaning Server Components should be at the bottom of the component tree, not wrapped inside Client Components. When a Client Component imports a Server Component directly, the bundler cannot separate them and the Server Component's code gets included in the client bundle. Instead:
  - Only pass `children` props to Client Components (composition pattern)
  - Pass necessary data from parent Server Components as serializable props
  - This preserves the zero-JS benefit of Server Components while allowing interactivity where needed

---

## 3. Fast Builds with Turbopack (Development) / SWC (Production)
- Leverage the latest Next.js build toolchain
- The speed difference is especially notable for large applications

---

## 4. Leveraging Vercel Optimizations
- **Vercel**: Edge cache + On-demand ISR
→ Bundle separation directly translates to deployment unit optimization

### Addendum: Comprehensive Use of Next.js Caching
- Request Memoization
- Data Cache (fetch)
- Full Route Cache (App Router)
- Combining these with edge caching maximizes optimization

---

# 2 Code Splitting Guidelines (App Router)
## 1. App Router Automatic Code Splitting
- Automatic splitting by each `page.tsx` and `layout.tsx` unit
- Generates independent JS/HTML bundles per route
- Initial load only fetches the required route

---

## 2. Third-Party Library Splitting

* Payment service SDKs (Stripe, PayPal, etc.)
* Chart.js
* Rich-text editors
* Date pickers

Use dynamic imports for these to avoid loading them on unnecessary pages.

---

# 3 SSG / SSR Strategy and Build Load
## SSG (Static Generation)
* Public pages (blogs, landing pages, help, etc.) use SSG + ISR
* Avoid overusing generateStaticParams as it increases build time
* Adopt On-demand ISR for sites with many pages

## SSR (Server-Side Rendering)
* User-specific data such as dashboards use SSR
* SSR can compress bundle size
* Works well with Vercel's fast edge execution

---

# 4 Bundle Size Optimization Checklist (Practical)
## 1. Introduce next-bundle-analyzer
Visualize whether dependency libraries are becoming bloated.

## 2. Import Only Necessary Parts of State Management / Data Fetching Libraries
* Custom hooks (useAsyncAction / useListData) should only be used in the components that need them
* Avoid singletons for Zustand stores

## 3. Lighten Images with Image Optimization
* Use automatic optimization via Next.js `<Image />`

---

# 5 Directory Structure Proposal (Build / Splitting Perspective)

```
src/
  app/
    dashboard/
      page.tsx          // Server Component
      client-panel.tsx  // Client Component (consider dynamic import)
    posts/
      [slug]/page.tsx   // SSR/SSG
    (public)/...        // Public area
    (auth)/login/...
  components/
    charts/             // Assumed to use dynamic import
    editors/
    modals/
```

---

# 6 Summary
* **Next.js App Router code splitting is automated at the route level**
* **Minimize Client Components and dynamically import only what's needed**
* **Keep Server Components as "leaves"** — use the children/composition pattern to avoid pulling Server Component code into client bundles
* **Introduce caching strategy for the data fetching layer**
  * Eliminate duplicates with React `cache` / Next.js fetch extensions
* **Comprehensively leverage Next.js caching strategies (Request Memoization / Data Cache / Full Route Cache)**
* **Design with Vercel Edge & SSR optimization as a prerequisite**
* **Optimize build time and browsing speed by choosing between SSG/SSR/ISR appropriately**
* **Visualize dependencies with bundle analyzer and continuously optimize**

---
# client-hooks.md (frameworks/nextjs/)
---

# Client Hooks Guidelines

> **[Replaceable]** This guide defines custom hooks (useAsyncAction, useListData, useTableState, etc.) for use with **Server Actions**. If your project uses **TanStack Query** or **SWR**, these hooks may be replaced by the library's built-in hooks (useQuery, useMutation, etc.). The patterns for separation of concerns and type safety still apply.

This document defines the implementation patterns and usage methods for custom hooks used in this project.

---

## 1. Basic Principles

- **Separation of concerns**: UI logic (dialog open/close, form field visibility, animation triggers) stays in components; data management (fetching, caching, pagination state, optimistic updates, error handling) lives in hooks
- **Reusability**: Place general-purpose hooks in `/src/hooks/`
- **Domain-specific**: Place hooks containing domain logic in `/features/{domain}/hooks/`

---

## 2. Hook List

| Hook | Location | Purpose |
|--------|------|------|
| `useAsyncAction` | /src/hooks | Async execution of Server Actions |
| `useTableState` | /src/hooks | Table state management (search, sort, pagination) |
| `useListData` | /src/hooks | List data fetching and management |
| `useFilterState` | /src/hooks | Filter state management |
| `usePaginatedList` | /src/hooks | Paginated list |
| `useDebounce` | /src/hooks | Value debouncing |
| `useJobPolling` | /features/{domain}/hooks | Job status polling |
| `useOnlineStatus` | /src/hooks | Network connection status monitoring |
| `useRovingTabIndex` | /src/hooks | Keyboard navigation |

---

## 3. useAsyncAction

Manages Server Actions execution, unifying loading state and error handling.

### Type Definitions

```ts
interface UseAsyncActionOptions<TData, TInput> {
  /** Server Action to execute */
  action: (input: TInput) => Promise<ActionResult<TData>>;
  /** Callback on success */
  onSuccess?: (data: TData) => void;
  /** Callback on failure */
  onError?: (error: ActionError) => void;
  /** Toast message on success */
  successMessage?: string;
  /** Whether to show toast on error (default: true) */
  showErrorToast?: boolean;
}

interface UseAsyncActionReturn<TData, TInput> {
  /** Execute the action */
  execute: (input: TInput) => Promise<ActionResult<TData>>;
  /** Whether loading */
  loading: boolean;
  /** Last error */
  error: ActionError | null;
  /** Clear the error */
  clearError: () => void;
  /** Last success data */
  data: TData | null;
}
```

### Usage Example

```tsx
"use client";

import { useAsyncAction } from "@/hooks/useAsyncAction";
import { createProject } from "@/features/project/server/project-actions";

function CreateProjectButton() {
  const { execute, loading, error } = useAsyncAction({
    action: createProject,
    onSuccess: (data) => {
      router.push(`/project/${data.id}`);
    },
    successMessage: "Project created successfully",
  });

  const handleClick = () => {
    execute({ name: "New Project" });
  };

  return (
    <>
      {error && <p className="text-destructive">{error.message}</p>}
      <Button onClick={handleClick} disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Create
      </Button>
    </>
  );
}
```

### Integration with Forms

```tsx
function ProjectForm() {
  const form = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
  });

  const { execute, loading, error } = useAsyncAction({
    action: createProject,
    onSuccess: () => {
      form.reset();
      onClose();
    },
  });

  // Reflect server field errors in the form
  useEffect(() => {
    if (error?.fieldErrors) {
      Object.entries(error.fieldErrors).forEach(([field, messages]) => {
        form.setError(field as keyof CreateProjectInput, {
          type: "server",
          message: messages.join(", "),
        });
      });
    }
  }, [error, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => execute(data))}>
        {/* Fields */}
        <Button type="submit" disabled={loading}>
          {loading ? "Processing..." : "Create"}
        </Button>
      </form>
    </Form>
  );
}
```

---

## 4. useTableState

Centrally manages search, sort, and pagination state for tables/lists.

### Type Definitions

```ts
interface SortState {
  key: string;
  order: "asc" | "desc";
}

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UseTableStateOptions<F extends Record<string, unknown>> {
  defaultSort?: SortState;
  defaultLimit?: number;
  defaultFilters?: F;
  debounceMs?: number;  // Default: 300ms
}

interface UseTableStateReturn<F> {
  // Search
  search: string;
  setSearch: (value: string) => void;
  debouncedSearch: string;
  // Filters
  filters: F;
  setFilter: <K extends keyof F>(key: K, value: F[K]) => void;
  setFilters: React.Dispatch<React.SetStateAction<F>>;
  // Sort
  sort: SortState;
  toggleSort: (key: string) => void;
  setSort: (sort: SortState) => void;
  // Pagination
  pagination: PaginationState;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setTotal: (total: number) => void;
  // Reset
  reset: () => void;
  resetPage: () => void;
}
```

### Usage Example

```tsx
interface Filters {
  status: "all" | "active" | "inactive";
  type: string;
}

function ProjectListPage() {
  const {
    search,
    setSearch,
    debouncedSearch,
    filters,
    setFilter,
    sort,
    toggleSort,
    pagination,
    setPage,
    setTotal,
  } = useTableState<Filters>({
    defaultSort: { key: "createdAt", order: "desc" },
    defaultLimit: 20,
    defaultFilters: { status: "all", type: "" },
  });

  // Data fetching
  const { data, loading } = useListData({
    fetcher: getProjects,
    params: {
      search: debouncedSearch,
      status: filters.status === "all" ? undefined : filters.status,
      sortKey: sort.key,
      sortOrder: sort.order,
      page: pagination.page,
      limit: pagination.limit,
    },
  });

  // Update total
  useEffect(() => {
    if (data) setTotal(data.total);
  }, [data, setTotal]);

  return (
    <div>
      {/* Search */}
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search..."
      />

      {/* Filters */}
      <Select
        value={filters.status}
        onValueChange={(v) => setFilter("status", v)}
      >
        <SelectItem value="all">All</SelectItem>
        <SelectItem value="active">Active</SelectItem>
        <SelectItem value="inactive">Inactive</SelectItem>
      </Select>

      {/* Table */}
      <Table>
        <TableHeader>
          <SortableHeader
            label="Created Date"
            sortKey="createdAt"
            currentSort={sort}
            onSort={toggleSort}
          />
        </TableHeader>
        <TableBody>
          {data?.items.map((item) => (
            <TableRow key={item.id}>...</TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
```

---

## 5. useListData

Unifies list data fetching and state management. Works with ActionResult-format fetchers.

### Type Definitions

```ts
interface UseListDataOptions<TData, TParams> {
  fetcher: (params: TParams) => Promise<ActionResult<{ items: TData[]; total: number }>>;
  params: TParams;
  limit?: number;  // Default: 20
  autoFetch?: boolean;  // Default: true
  showErrorToast?: boolean;  // Default: true
}

interface UseListDataReturn<TData> {
  data: TData[];
  total: number;
  totalPages: number;
  page: number;
  setPage: (page: number) => void;
  loading: boolean;
  refetch: () => Promise<void>;
  refetchWithReset: () => Promise<void>;  // Reset to page 1 and refetch
}
```

### Usage Example

```tsx
const {
  data: logs,
  total,
  page,
  setPage,
  loading,
  refetch,
} = useListData({
  fetcher: async (params) => {
    const result = await getAuditLogs(params);
    if (result.success) {
      return {
        success: true,
        data: { items: result.data.logs, total: result.data.total },
      };
    }
    return result;
  },
  params: {
    action: actionFilter === "all" ? undefined : actionFilter,
    search: debouncedSearch || undefined,
    sortKey,
    sortOrder,
  },
  limit: 20,
});
```

### Features

- **Detects params changes**: When params change, resets to page 1 and auto-refetches
- **Auto-fetch on page change**: Automatically refetches when the page changes
- **Error toast**: Automatically displays toast on error (optional)

---

## 6. useFilterState

Manages filter state and provides active filter tracking.

### Type Definitions

```ts
interface FilterConfig<T extends Record<string, FilterValue>> {
  defaults: T;
  resetValues?: Partial<T>;
}

interface UseFilterStateReturn<T> {
  filters: T;
  setFilter: <K extends keyof T>(key: K, value: T[K]) => void;
  setFilters: (values: Partial<T>) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  isFilterActive: <K extends keyof T>(key: K) => boolean;
}
```

### Usage Example

```tsx
interface Filters {
  status: "all" | "active" | "inactive";
  category: string;
  dateRange: string;
}

function FilterableList() {
  const {
    filters,
    setFilter,
    clearFilters,
    hasActiveFilters,
    activeFilterCount,
  } = useFilterState<Filters>({
    defaults: {
      status: "all",
      category: "all",
      dateRange: "",
    },
  });

  return (
    <div>
      <Select
        value={filters.status}
        onValueChange={(v) => setFilter("status", v)}
      >
        ...
      </Select>

      {/* Show clear button when filters are active */}
      {hasActiveFilters && (
        <Button variant="ghost" onClick={clearFilters}>
          Clear Filters ({activeFilterCount})
        </Button>
      )}
    </div>
  );
}
```

### Combining with useTableState

```tsx
const filterState = useFilterState({
  defaults: { status: "all", type: "all" },
});

const tableState = useTableState({
  defaultSort: { key: "createdAt", order: "desc" },
});

// Reset page when filter changes
const handleFilterChange = <K extends keyof Filters>(key: K, value: Filters[K]) => {
  filterState.setFilter(key, value);
  tableState.resetPage();
};
```

---

## 7. usePaginatedList

A high-level hook that integrates search, filters, sort, and pagination.

### Type Definitions

```ts
interface UsePaginatedListOptions<T, F = string> {
  defaultLimit?: number;
  defaultSortBy?: string;
  defaultFilter?: F | "all";
  fetchFn: (params: LoadParams<F>) => Promise<LoadResult<T> | null>;
  autoReload?: boolean;  // Default: true
}

interface UsePaginatedListReturn<T, F> {
  items: T[];
  setItems: React.Dispatch<React.SetStateAction<T[]>>;
  pagination: PaginationInfo;
  isLoading: boolean;
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  debouncedSearch: string;
  filter: F | "all";
  setFilter: React.Dispatch<React.SetStateAction<F | "all">>;
  sortBy: string;
  setSortBy: React.Dispatch<React.SetStateAction<string>>;
  handlePageChange: (newPage: number) => void;
  handleLimitChange: (newLimit: number) => void;
  handleRefresh: () => void;
}
```

### Usage Example

```tsx
const {
  items: presets,
  pagination,
  isLoading,
  search,
  setSearch,
  filter,
  setFilter,
  sortBy,
  setSortBy,
  handlePageChange,
  handleRefresh,
} = usePaginatedList<PresetSummary, PresetType>({
  defaultLimit: 12,
  defaultSortBy: "newest",
  fetchFn: async (params) => {
    const result = await getMyPresets({
      page: params.page,
      limit: params.limit,
      search: params.search,
      type: params.filter,
      sortBy: params.sortBy,
    });
    if (!result.success) return null;
    return {
      items: result.data.presets,
      page: result.data.page,
      limit: result.data.limit,
      total: result.data.total,
      totalPages: result.data.totalPages,
    };
  },
});
```

---

## 8. useDebounce

A simple hook for debouncing values.

### Implementation

```ts
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

### Usage Example

```tsx
const [search, setSearch] = useState("");
const debouncedSearch = useDebounce(search, 300);

useEffect(() => {
  // Only call API when debouncedSearch changes
  fetchData({ search: debouncedSearch });
}, [debouncedSearch]);
```

---

## 9. useJobPolling

Polls the status of background jobs (AI generation, image processing, etc.).

### Type Definitions

```ts
interface PendingJob {
  jobId: string;
}

interface JobResult<T extends PendingJob> {
  job: T;
  status: "completed" | "failed";
  resultUrl?: string;
  error?: string;
}

interface UseJobPollingOptions<T extends PendingJob> {
  collectPendingJobs: () => T[];
  getJobStatus: (jobId: string) => Promise<JobStatusResult>;
  onJobResults: (results: JobResult<T>[]) => boolean;
  onSave: () => Promise<void>;
  pollInterval?: number;  // Default: 5000ms
  enabled?: boolean;  // Default: true
}
```

### Usage Example

```tsx
interface ResourceJob extends PendingJob {
  resourceId: string;
  itemId: string;
  label: string;
}

useJobPolling<ResourceJob>({
  collectPendingJobs: () => {
    // Collect pending jobs
    return resources.flatMap((resource) =>
      (resource.generatedItems || [])
        .filter((item) => item.jobId && !item.resultUrl)
        .map((item) => ({
          jobId: item.jobId!,
          resourceId: resource.id!,
          itemId: item.id!,
          label: item.label || "Untitled",
        }))
    );
  },
  getJobStatus: async (jobId) => await getJobStatus(jobId),
  onJobResults: (results) => {
    let hasUpdates = false;
    for (const result of results) {
      if (result.status === "completed" && result.resultUrl) {
        // Update result URL
        updateResourceItem(result.job.resourceId, result.job.itemId, {
          resultUrl: result.resultUrl,
        });
        hasUpdates = true;
      } else if (result.status === "failed") {
        // Remove failed item
        removeResourceItem(result.job.resourceId, result.job.itemId);
        hasUpdates = true;
      }
    }
    return hasUpdates;
  },
  onSave: async () => {
    await saveResources();
  },
  pollInterval: 5000,
});
```

### Utility Functions

```ts
// Extract pending jobs from resources
const jobs = extractPendingJobsFromResources(
  resources,
  (resource, item) => ({
    jobId: item.jobId!,
    resourceId: resource.id!,
    itemId: item.id!,
    label: item.label || "Untitled",
  })
);
```

---

## 10. useOnlineStatus

Monitors network connection status and detects offline/online recovery.

### Type Definitions

```ts
interface OnlineStatusState {
  /** Current connection status */
  isOnline: boolean;
  /** Whether recovered from offline (auto-resets after 3 seconds) */
  wasOffline: boolean;
}
```

### Implementation

```ts
// hooks/useOnlineStatus.ts
"use client";

import { useState, useEffect, useCallback } from "react";

export function useOnlineStatus(): OnlineStatusState {
  const [state, setState] = useState<OnlineStatusState>({
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    wasOffline: false,
  });

  const handleOnline = useCallback(() => {
    setState((prev) => ({
      isOnline: true,
      wasOffline: !prev.isOnline, // true if previously offline
    }));
  }, []);

  const handleOffline = useCallback(() => {
    setState({ isOnline: false, wasOffline: false });
  }, []);

  useEffect(() => {
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [handleOnline, handleOffline]);

  // Reset wasOffline flag after 3 seconds
  useEffect(() => {
    if (state.wasOffline) {
      const timer = setTimeout(() => {
        setState((prev) => ({ ...prev, wasOffline: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [state.wasOffline]);

  return state;
}
```

### Usage Example

```tsx
function App() {
  const { isOnline, wasOffline } = useOnlineStatus();

  return (
    <>
      {/* Offline banner */}
      {!isOnline && (
        <div className="bg-destructive text-white p-2 text-center">
          No internet connection
        </div>
      )}

      {/* Online recovery notification */}
      {wasOffline && (
        <div className="bg-green-500 text-white p-2 text-center animate-fade-out">
          Connection restored
        </div>
      )}
    </>
  );
}
```

---

## 11. useRovingTabIndex

Implements keyboard navigation (arrow key movement) in menus and lists.

### Type Definitions

```ts
interface UseRovingTabIndexReturn<T extends HTMLElement> {
  containerRef: React.RefObject<T>;
  containerProps: {
    ref: React.RefObject<T>;
    onKeyDown: (event: KeyboardEvent<T>) => void;
    role: "menu";
    "aria-orientation": "vertical";
  };
  getItemProps: (index: number) => {
    role: "menuitem";
    tabIndex: 0 | -1;
  };
  focusItem: (index: number) => void;
}
```

### Implementation

```ts
// hooks/useRovingTabIndex.ts

import { useCallback, useRef, KeyboardEvent } from "react";

export function useRovingTabIndex<T extends HTMLElement = HTMLElement>() {
  const containerRef = useRef<T>(null);
  const focusedIndexRef = useRef(0);

  const getFocusableItems = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];
    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
  }, []);

  const focusItem = useCallback((index: number) => {
    const items = getFocusableItems();
    if (items.length === 0) return;

    const targetIndex = Math.max(0, Math.min(index, items.length - 1));
    items[targetIndex]?.focus();
    focusedIndexRef.current = targetIndex;
  }, [getFocusableItems]);

  const handleKeyDown = useCallback((event: KeyboardEvent<T>) => {
    const items = getFocusableItems();
    if (items.length === 0) return;

    const currentIndex = items.findIndex((item) => item === document.activeElement);

    switch (event.key) {
      case "ArrowDown":
      case "ArrowRight":
        event.preventDefault();
        focusItem(currentIndex + 1 < items.length ? currentIndex + 1 : 0);
        break;

      case "ArrowUp":
      case "ArrowLeft":
        event.preventDefault();
        focusItem(currentIndex - 1 >= 0 ? currentIndex - 1 : items.length - 1);
        break;

      case "Home":
        event.preventDefault();
        focusItem(0);
        break;

      case "End":
        event.preventDefault();
        focusItem(items.length - 1);
        break;
    }
  }, [getFocusableItems, focusItem]);

  const containerProps = {
    ref: containerRef,
    onKeyDown: handleKeyDown,
    role: "menu" as const,
    "aria-orientation": "vertical" as const,
  };

  const getItemProps = useCallback((index: number) => ({
    role: "menuitem" as const,
    tabIndex: index === focusedIndexRef.current ? 0 : -1,
  }), []);

  return { containerRef, containerProps, getItemProps, focusItem };
}
```

### Usage Example

```tsx
function NavigationMenu({ items }: { items: MenuItem[] }) {
  const { containerProps, getItemProps } = useRovingTabIndex();

  return (
    <nav {...containerProps} className="flex flex-col gap-1">
      {items.map((item, index) => (
        <a
          key={item.href}
          href={item.href}
          {...getItemProps(index)}
          className="p-2 hover:bg-muted rounded focus:ring-2"
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}
```

### Keyboard Controls

| Key | Action |
|------|------|
| Down / Right | Focus next item |
| Up / Left | Focus previous item |
| Home | Focus first item |
| End | Focus last item |

---

## 12. Best Practices

### Hook Placement

```
/src
  /hooks
    useAsyncAction.ts      # General-purpose hooks
    useTableState.ts
    useListData.ts
    useFilterState.ts
    usePaginatedList.ts
    useDebounce.ts
  /features
    /{domain}
      /hooks
        useJobPolling.ts   # Domain-specific hooks
        useItemCRUD.ts
        useResourcePage.ts
```

### Naming Conventions

- Hook name: `use` prefix + PascalCase (e.g., `useTableState`)
- File name: camelCase (e.g., `useTableState.ts`)
- Return type: `Use{HookName}Return`
- Options type: `Use{HookName}Options`

### DO (Recommended)

```tsx
// Stabilize function references with ref (prevent infinite loops in hooks that use callbacks in dependency arrays)
const fetchFnRef = useRef(fetchFn);
fetchFnRef.current = fetchFn;
```

### DON'T (Not Recommended)

```tsx
// Do not pass functions inline (causes infinite loops)
useListData({
  fetcher: async (params) => await getItems(params),  // New reference every time
  ...
});

// Do not omit dependency arrays
useEffect(() => {
  fetchData();
}, []);  // Won't re-run when fetchData changes

// Do not call state updates synchronously in succession
setPage(1);
setTotal(0);
// → May not be batched
```

---

## 13. Summary

| Hook | Purpose | Key Features |
|--------|------|----------|
| `useAsyncAction` | Server Actions execution | Loading, error, toast |
| `useTableState` | Table state | Search, sort, pagination, filters |
| `useListData` | List fetching | Auto-refetch, page reset |
| `useFilterState` | Filter management | Active tracking, clear |
| `usePaginatedList` | Integrated list | Unified search through pagination management |
| `useDebounce` | Debouncing | Input delay |
| `useJobPolling` | Job monitoring | Polling, completion/failure handling |
| `useOnlineStatus` | Network monitoring | Online/offline detection, recovery notification |
| `useRovingTabIndex` | Keyboard navigation | Arrow key movement, accessibility |

---
# database.md (frameworks/nextjs/)
---

# Database Guidelines

> **[Replaceable]** This guide uses **Prisma + SQLite**. If your project uses **Drizzle**, **Kysely**, or a different database (e.g., **PostgreSQL**, **Turso**), replace the ORM and database patterns accordingly. The principles (type-safe DB access, migration management, N+1 prevention, query limits) remain the same.

This document adopts **Prisma** as the ORM and uses **SQLite** as the database.

---

## Architecture Policy
### 1. Data Model Design Centered on schema.prisma
- All data models are defined in `prisma/schema.prisma`
- Model changes **must always be accompanied by migrations**
- Models are **centralized by domain** rather than "vertical slices (feature-based)".
  This is a deliberate trade-off: Prisma uses a single-file schema architecture, so splitting models across feature directories would require manual concatenation or tooling workarounds. Centralizing in one file means cross-domain relationships (foreign keys, many-to-many) are immediately visible and validated by Prisma. The downside is that the schema file grows large — mitigate this with clear comment sections per domain and consistent model ordering.

### 2. Prisma Client Usage Policy
- Strictly maintain "one instance per process" for the Client
- In Next.js, manage it in `lib/prisma.ts` as follows

### prisma.ts (Sample)

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["query", "info", "warn", "error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
```

---

## Database Design

* DB: **SQLite**
* Reasons:
  * No installation required, fast setup
  * Easy snapshot creation and testing
  * Fast migration verification
  * Easy deployment (file-based)

---

## Prisma Migrate Operational Rules
### 1. Model Changes → Always Generate a Migration
```
npx prisma migrate dev --name <change-name>
```

### 2. Run migrate deploy in Production
```
npx prisma migrate deploy
```

### 3. Zod Integration on Model Changes
* Update Zod schema when Prisma schema changes
* Maintain type safety for API Routes / Server Actions

---

## Query Best Practices

### Error Handling
* Absorb Prisma Client Errors in Route Handlers and API layer
* Display appropriate UI based on error codes (e.g., P2002)

### Safety Guidelines for Raw SQL Usage

Raw SQL (`$queryRaw`, `$executeRaw`) should be limited to complex queries that Prisma cannot handle.

#### Acceptable Use Cases

| Case | Example |
|------|---------|
| Complex aggregations | GROUP BY + HAVING + window functions |
| DB-specific features | SQLite-specific functions/syntax |
| Performance optimization | Bulk updates on large datasets |
| Legacy support | During migration period for existing SQL |

#### SQL Injection Prevention Checklist

```ts
// ✅ Safe: Using Prisma.sql template tag
const userId = "user_123";
const result = await prisma.$queryRaw`
  SELECT * FROM "User" WHERE id = ${userId}
`;

// ✅ Safe: Building IN clause with Prisma.join
const ids = ["id1", "id2", "id3"];
const result = await prisma.$queryRaw`
  SELECT * FROM "User" WHERE id IN (${Prisma.join(ids)})
`;

// ❌ Dangerous: String concatenation (strictly prohibited)
const result = await prisma.$queryRawUnsafe(
  `SELECT * FROM "User" WHERE id = '${userId}'`  // SQL injection vulnerability
);
```

#### Raw SQL Code Review Checklist

| Check Item | Verification |
|------------|-------------|
| Template tag usage | Is `Prisma.sql` or `` $queryRaw` `` being used? |
| Unsafe function prohibition | Is `$queryRawUnsafe` / `$executeRawUnsafe` not being used? |
| Variable escaping | Is user input not being directly concatenated into strings? |
| Type safety | Are return types explicitly specified? |
| Comments | Is the reason for using Raw SQL documented? |

```ts
// Type-safe Raw SQL example
type UserStats = {
  userId: string;
  totalOrders: number;
  lastActivity: Date;
};

// Using Raw SQL for complex aggregation that Prisma cannot handle
const stats = await prisma.$queryRaw<UserStats[]>`
  SELECT
    u.id as "userId",
    COUNT(o.id) as "totalOrders",
    MAX(u."updatedAt") as "lastActivity"
  FROM "User" u
  LEFT JOIN "Order" o ON o."userId" = u.id
  GROUP BY u.id
  HAVING COUNT(o.id) > 0
`;
```

---

## Large-Scale Data Handling Guidelines

### Limiting Query Result Count (take)

**Principle: Prohibit unlimited queries.** Without explicit limits, a `findMany` call returns every matching row. As data grows, this can exhaust Node.js heap memory (default ~1.5GB), cause request timeouts, and in serverless environments (Vercel), trigger function crashes or excessive billing. Even a simple query like `findMany({ where: { status: 'active' } })` can return millions of rows if the table is large.

```ts
// ❌ Unlimited (risk of memory exhaustion as records grow)
const allLogs = await prisma.loginHistory.findMany({
  where: { createdAt: { gte: oneHourAgo } }
});

// ✔ Explicitly set an upper limit
const recentLogs = await prisma.loginHistory.findMany({
  where: { createdAt: { gte: oneHourAgo } },
  take: 10000,  // Limit maximum number of records
  orderBy: { createdAt: 'desc' }
});
```

**Limiting nested includes**
```ts
// ✔ Apply take to nested relations as well
const items = await prisma.item.findMany({
  where: { projectId },
  take: 100,
  include: {
    children: {
      take: 500,
      include: {
        details: { take: 100 }
      }
    }
  }
});

// Performance note: This query may return up to 100 × 500 × 100 = 5,000,000 records
// Be mindful of memory usage when changing limit values
```

### Utilizing Composite Indexes

**Add composite indexes for frequently combined conditions**

```prisma
model TaskItem {
  id        String  @id @default(cuid())
  taskId    String
  status    String
  resultUrl String?

  // Composite indexes (aligned with search patterns)
  @@index([taskId, status])      // Search by task and status
  @@index([status, resultUrl])   // Search by status + result URL
}
```

### Optimizing OR Condition Queries

**NG: Complex OR conditions (reduced index efficiency)**
```ts
// ❌ OR conditions do not effectively use indexes
const presets = await prisma.preset.findMany({
  where: {
    OR: [
      { userId },
      { purchases: { some: { userId } } }
    ]
  }
});
```

**OK: Split queries and combine results**
```ts
// ✔ Split into independent queries (indexes are effective)
const [ownPresets, purchasedPresets] = await Promise.all([
  prisma.preset.findMany({
    where: { userId },
    take: 100
  }),
  prisma.preset.findMany({
    where: {
      purchases: { some: { userId } },
      userId: { not: userId }  // Exclude duplicates
    },
    take: 100
  })
]);

// Combine results
const combined = [...ownPresets, ...purchasedPresets]
  .sort((a, b) => a.name.localeCompare(b.name))
  .slice(0, 100);
```

### Documentation Requirement

**Document the rationale for limit values in comments**
```ts
// Performance note: This query may return up to N records
// Be mindful of memory usage when changing limit values
const results = await prisma.table.findMany({
  take: 5000,  // Maximum 5000 records (for unique ID retrieval)
});
```

### Query Performance Checklist

| Check Item | Action |
|------------|--------|
| No queries inside loops? | Batch fetch with include |
| No unlimited findMany? | Explicitly set take |
| Complex OR conditions? | Consider splitting queries |
| Indexes on frequently searched conditions? | Add @@index |
| Aware of maximum record count for nested includes? | Document in comments |

---

## Prisma Code Generation and Type Usage
* Link Prisma Client types with Zod schemas to ensure **type consistency (Single Source of Truth)**.
* Do not return `@prisma/client` model types directly;
  **it is recommended to format them through a DTO (Data Transfer Object) layer**
  → Easier to maintain API compatibility

---

## Prisma Directory Structure

```
/prisma
  ├─ schema.prisma
  ├─ migrations/
  └─ seeds/
src/
  └─ lib/
      └─ prisma.ts   // Prisma Client instance
```

---

## Benefits

* Type-safe and robust DB access
* Schema-centric DB changes are easy to track
* Simple file-based operation with SQLite
* Excellent compatibility with Next.js

---

## Separation of Responsibilities with Zod

> **Reference:** common/validation.md

| Responsibility | Owner | Description |
|---------------|-------|-------------|
| External input validation | **Zod** | Form input, API request validation |
| DB integrity constraints | **Prisma** | PK, FK, unique, not null, etc. |
| Type generation source | **Both** | Zod for input types, Prisma for DB types |

```
External input → Validate with Zod → Save with Prisma
                ↑                    ↑
           Source of truth      Source of truth
           for input            for DB structure
```

**Important:** Prisma types are trustworthy for data from the DB, but **should never be used for external input validation**. External input must always be validated with Zod before being passed to Prisma.

---

## Summary

In this project:

- **Prisma**: Single Source of Truth for DB data models
- **Zod**: Single Source of Truth for input validation

The two are complementary, each serving as the "single source of truth" within their respective areas of responsibility.

---
# form.md (frameworks/nextjs/)
---

# Form Management Guidelines

> **[Replaceable]** This guide uses **React Hook Form + Zod**. If your project uses **Conform**, **Formik**, or a different validation library (e.g., **Valibot**), replace the form/validation patterns accordingly. The principles (server-side validation required, schema sharing, accessibility) remain the same.

This document defines the **form building guidelines** for Next.js large-scale applications.
It summarizes **scalable and maintainable implementation policies** centered on the validation system (Zod) and form management (React Hook Form).

---

## 1. Basic Principles
* Use **React Hook Form (RHF)** as the foundation for form state management.
* Use **Zod** as the sole validation schema definition tool,
  **sharing schemas between client and server**.
* Delegate submit processing to **Server Actions or API Routes**, separating side effects from the UI.
* Ensure safety from validation to DB layer in the order **Zod → Prisma**.
* Standardize UI components with **shadcn/ui**-based form parts.

---

## 2. Directory Structure

```
/src
  /features
    /{domain}
      /schema
        form-schema.ts      # Zod schema for forms
      /components
        Form.tsx            # Shared Form wrapper
        FormField.tsx       # shadcn/ui + RHF wrapper
        FormRadioGroup.tsx  # Dedicated wrapper example
        FormCheckbox.tsx    # Dedicated wrapper example
      /server
        submit.ts           # Server actions or API calls
      /utils
        setFieldErrors.ts   # ServerError → RHF setError conversion utility
```

---

## 3. Zod x RHF: Integrating Types and Validation

### Using ZodResolver

```ts
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

const form = useForm<FormValues>({
  resolver: zodResolver(FormSchema),
  mode: "onChange",
});
```

---

## 4. Combining with UI (shadcn/ui)
### Shared Form Components

* `Form`: Wraps with RHF `FormProvider`
* `FormField`: input/select/textarea + error display
* `FormMessage`: Unified error messages
* **Abstraction guidelines**:

  * `FormField` serves as a Controller wrapper, supporting both with and without the render property
  * Accepts multiple child components (Input/Select/DatePicker, etc.) in a type-safe manner
  * Dedicated UI wrappers (e.g., `FormRadioGroup`, `FormCheckbox`) can be defined as standard patterns

```tsx
<Form>
  <FormField name="email">
    <Input placeholder="Email address" />
  </FormField>
  <FormRadioGroup name="gender" options={["Male", "Female"]} />
</Form>
```

### FormMessage Animation

Add animation to error message show/hide:

```tsx
// components/ui/form.tsx
import { AnimatePresence, motion } from "framer-motion";

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error?.message) : children;

  return (
    <AnimatePresence mode="wait">
      {body && (
        <motion.p
          ref={ref}
          id={formMessageId}
          role="alert"
          initial={{ opacity: 0, height: 0, y: -10 }}
          animate={{ opacity: 1, height: "auto", y: 0 }}
          exit={{ opacity: 0, height: 0, y: -10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={cn("text-sm font-medium text-destructive", className)}
          {...props}
        >
          {body}
        </motion.p>
      )}
    </AnimatePresence>
  );
});
```

#### CSS-only Animation (Lightweight Version)

```tsx
// When not using framer-motion
const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error?.message) : children;

  if (!body) return null;

  return (
    <p
      ref={ref}
      id={formMessageId}
      role="alert"
      className={cn(
        "text-sm font-medium text-destructive",
        "animate-in fade-in-0 slide-in-from-top-1 duration-200",
        className
      )}
      {...props}
    >
      {body}
    </p>
  );
});
```

```css
/* globals.css - Tailwind CSS animations */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-in-from-top {
  from { transform: translateY(-4px); }
  to { transform: translateY(0); }
}
```

---

## 5. Server-side Validation and RHF Integration

> **Reference:** For detailed Server Actions patterns, see frameworks/nextjs/server-actions.md

### ZodValidationError Handling in Server Actions / API Routes
* Server-side validation based on Zod schema
* Catch ValidationError and return JSON with `fieldErrors` to the client

```ts
import { FormSchema } from "@/features/user/schema/form-schema";
import { ZodError } from "zod";

export async function submit(data: unknown) {
  try {
    const parsed = FormSchema.parse(data);
    // Pass to Prisma
  } catch (err) {
    if (err instanceof ZodError) {
      return { error: { type: "VALIDATION_ERROR", fieldErrors: err.formErrors.fieldErrors } };
    }
    throw err;
  }
}
```

### Shared Client-side Processing
* Integrate with `useForm`'s `setError` to display errors on fields without closing the form

```ts
import { setFieldErrors } from "@/features/user/utils/setFieldErrors";

const { execute, loading } = useAsyncAction(async (data: FormValues) => {
  const result = await submitUserForm(data);
  if (!result.success) {
    if (result.error?.type === "VALIDATION_ERROR") {
      setFieldErrors(form, result.error.fieldErrors);
    } else {
      toast.error("An unexpected error occurred");
    }
  }
});
```

#### `setFieldErrors.ts` Utility Example

```ts
import { UseFormReturn } from "react-hook-form";

export function setFieldErrors<T>(form: UseFormReturn<T>, fieldErrors: Record<string, string[]>) {
  Object.entries(fieldErrors).forEach(([field, messages]) => {
    form.setError(field as keyof T, { type: "server", message: messages.join(", ") });
  });
}
```

---
## 6. Data Shaping with Zod Transform

* Empty string → null conversion

```ts
const FormSchema = z.object({
  nickname: z.string().transform(e => e === "" ? null : e),
});
```

* Date string → Date object conversion

```ts
const FormSchema = z.object({
  birthDate: z.string().transform(str => new Date(str)),
});
```

* **Guideline**: Consolidate all differences between UI input and DB requirements within the Zod schema.
  This is important because it keeps `submit.ts` as a thin pass-through layer — it receives already-shaped data and passes it to Prisma without transformation logic. If shaping is done in `submit.ts` or scattered across components, every form endpoint accumulates its own conversion logic, making refactoring and testing harder.

---

## 7. Relationship with Prisma
* Shape Prisma input types (XxxCreateInput) according to the Zod schema
* Unify type differences (nullable, etc.) within the schema

---

## 8. Standard Error Handling Policy
### Client-side
* RHF `formState.errors` → `FormMessage`
* Server errors → toast display
* fieldErrors → Unified processing with `setFieldErrors` utility

### Server-side
* Distinguish between ZodError and ApplicationError
* Return in JSON structure:

```json
{
  "error": {
    "type": "VALIDATION_ERROR",
    "fieldErrors": { "email": ["Required"] }
  }
}
```

---

## 9. Async Processing (Server Actions + useAsyncAction Integration)
* Use the **useAsyncAction** hook for async processing after submit
* Example: User update Server Action → `refetch()` to retrieve the latest data

---

## 10. Platform Support
### Vercel
* Server Actions + SSR fast
* API Routes are also lightweight
* Form processing is based on Server Actions / API Routes

---
## 11. Anti-patterns (Things to Avoid)

* Passing directly to Prisma without server-side validation
* Proliferating copies of shadcn/ui components

---

## 12. Security Measures

### CSRF (Cross-Site Request Forgery) Protection

#### Server Actions Case

Next.js Server Actions have **built-in CSRF protection automatically**:

- Accept POST requests only
- `Origin` header verification
- Encrypted token verification generated by Next.js

```ts
// No additional CSRF measures needed for Server Actions
"use server";

export async function submitForm(data: FormData) {
  // Next.js automatically applies CSRF protection
  const parsed = FormSchema.parse(Object.fromEntries(data));
  // ...
}
```

#### API Route (Route Handler) Case

When calling Route Handlers directly, **explicit CSRF measures are required**:

```ts
// app/api/submit/route.ts
import { headers } from "next/headers";

export async function POST(request: Request) {
  const headersList = headers();
  const origin = headersList.get("origin");

  // Origin verification
  if (origin !== process.env.NEXT_PUBLIC_APP_URL) {
    return Response.json(
      { error: { code: "CSRF_ERROR", message: "Invalid origin" } },
      { status: 403 }
    );
  }

  // ...continue processing
}
```

### Double Submission Prevention

```tsx
const form = useForm<FormValues>({
  resolver: zodResolver(FormSchema),
});

const { isSubmitting } = form.formState;

return (
  <form onSubmit={form.handleSubmit(onSubmit)}>
    {/* ... fields ... */}
    <Button type="submit" disabled={isSubmitting}>
      {isSubmitting ? "Submitting..." : "Submit"}
    </Button>
  </form>
);
```

### Related Documentation

- CSRF/XSS general → common/security.md
- Server Actions security → frameworks/nextjs/server-actions.md
- Authentication integration → frameworks/nextjs/auth.md

---

## 13. Summary

* **RHF + Zod**: The standard for large-scale apps
* **Schema sharing**: Ensures client/server/DB consistency
* **shadcn/ui**: Unified form UI, improved reusability and extensibility
* Achieve reliable data processing with consistent error handling including RHF's setError, integrated with **Server Actions / API Routes**
* **Zod transforms** consolidate differences between UI input and DB requirements, keeping submit processing clean
* Clarify **FormField abstraction levels** and standardize dedicated UI wrappers

---
# format.md (frameworks/nextjs/)
---

# Format Utility Design Guidelines

This document defines the design policy and implementation patterns for display formatting of dates, numbers, currencies, and more.
It leverages the `Intl` API to provide unified, locale-aware formatting across the entire application.

---

## 1. Core Principles

- **`Intl` API first**: Use the browser/Node.js standard `Intl.*Format` APIs. This eliminates external library dependencies (moment.js, day.js, numeral.js) which typically add 20-70KB to the bundle. The `Intl` API is built into all modern runtimes (browsers, Node.js, Edge), receives locale data from the OS/ICU, and is maintained by the platform rather than requiring npm updates. Libraries are only justified when `Intl` lacks a needed feature (e.g., complex calendar systems or parsing).
- **Locale support**: All format functions accept a locale option
- **Unified input type**: Accept `Date | string | number` and convert internally with `new Date()`
- **Style variations**: Provide presets such as short / medium / long to standardize usage
- **Pure Function**: No side effects, easy to test

---

## 2. Directory Structure

```
src/
  lib/
    format/
      date.ts       # Date formatting
      number.ts     # Number, currency, and byte formatting
      index.ts      # Re-exports
```

---

## 3. Date Formatting

### 3.1 Format Styles

| Style | Output Example (ja) | Output Example (en) | Use Case |
|-------|--------------------|--------------------|----------|
| `short` | 3/4 | 3/4 | List display, compact display |
| `medium` | 3月4日 | Mar 4 | General date display |
| `long` | 2024年3月4日 | March 4, 2024 | Formal date display |
| `full` | 2024年3月4日月曜日 | Monday, March 4, 2024 | Full display with day of week |
| `shortTime` | 3月4日 14:30 | Mar 4, 14:30 | Brief date + time display |
| `mediumTime` | 2024年3月4日 14:30 | Mar 4, 2024, 14:30 | Standard date + time display |
| `longTime` | 2024年3月4日 14:30 | March 4, 2024 14:30:00 | Detailed date + time display |
| `relative` | 2時間前 | 2 hours ago | Relative time |
| `iso` | 2024-03-04 | 2024-03-04 | For APIs / logs |

### 3.2 Unified Format Function

```ts
export type DateFormatStyle =
  | "short" | "medium" | "long" | "full"
  | "shortTime" | "mediumTime" | "longTime"
  | "relative" | "iso";

export interface DateFormatOptions {
  locale?: string;    // Default: "en"
  timeZone?: string;  // Time zone specification
}

// Unified entry point
export function formatDate(
  date: Date | string | number,
  style: DateFormatStyle = "medium",
  options: DateFormatOptions = {}
): string;
```

### 3.3 Individual Format Functions

```ts
// Date only
formatDateShort(date, options)      // "3/4"
formatDateMedium(date, options)     // "3月4日"
formatDateLong(date, options)       // "2024年3月4日"

// Date + time
formatDateTimeShort(date, options)  // "3月4日 14:30"
formatDateTimeMedium(date, options) // "2024年3月4日 14:30"
formatDateTimeLong(date, options)   // "2024年3月4日 14:30:00"

// Time only
formatTime(date, { showSeconds: true })  // "14:30:00"

// ISO format
formatDateISO(date)       // "2024-03-04"
formatDateTimeISO(date)   // "2024-03-04T14:30:00"
```

### 3.4 Relative Time

```ts
export function formatRelativeTime(
  date: Date | string | number,
  options: DateFormatOptions & { now?: Date } = {}
): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  // Automatically select appropriate unit
  // < 60 seconds → seconds, < 60 minutes → minutes, < 24 hours → hours,
  // < 7 days → days, < 4 weeks → weeks, < 12 months → months, beyond → years
}
```

**Key points**:
- Uses `Intl.RelativeTimeFormat` to auto-generate locale-appropriate "ago" / "from now" expressions
- `numeric: "auto"` enables natural expressions like "yesterday" and "tomorrow"

---

## 4. Number Formatting

### 4.1 Basic Numbers

```ts
// Locale-aware number formatting
formatNumber(1234567)                      // "1,234,567"
formatNumber(1234567, { locale: "de" })    // "1.234.567"
```

### 4.2 Compact Display

Two approaches to choose from:

```ts
// Manual compact (fixed K / M / B)
formatCompactNumber(1234)       // "1.2K"
formatCompactNumber(1234567)    // "1.2M"
formatCompactNumber(1234567890) // "1.2B"

// Intl compact (locale-aware)
formatCompactNumberIntl(12345, { locale: "ja" })  // "1.2万"
formatCompactNumberIntl(12345, { locale: "en" })  // "12K"
```

| Function | Use Case |
|----------|----------|
| `formatCompactNumber` | Fixed English display (dashboards, etc.) |
| `formatCompactNumberIntl` | Display requiring multilingual support |

### 4.3 Currency Formatting

```ts
// General currency formatting
formatCurrency(1234.56, { currency: "USD" })  // "$1,234.56"
formatCurrency(1234, { currency: "JPY" })     // "¥1,234"

// Shortcut functions
formatUSD(1234.56)   // "$1,234.56"  (2-4 decimal places)
formatJPY(1234)      // "¥1,234"     (no decimals)
```

**Key points**:
- Uses `Intl.NumberFormat` with `style: "currency"`
- Sets appropriate decimal places per currency (JPY: 0, USD: 2)
- Locale-appropriate currency symbol placement ($1,234 vs 1,234 USD)

### 4.4 Percentage

```ts
formatPercent(0.1234)                     // "12.34%"
formatPercent(0.1234, { precision: 0 })   // "12%"
formatPercent(85, { multiply: false })    // "85%" (when value is already a percentage)
```

### 4.5 Byte Size

```ts
formatBytes(0)          // "0 B"
formatBytes(1024)       // "1 KB"
formatBytes(1234567)    // "1.18 MB"
formatBytes(1234567890) // "1.15 GB"
```

### 4.6 Duration

```ts
// Compact format
formatDuration(125)   // "2:05"
formatDuration(3661)  // "1:01:01"

// Human-readable format (locale-aware)
formatDurationLong(3661, "ja")  // "1時間1分1秒"
formatDurationLong(3661, "en")  // "1h 1m 1s"

// Milliseconds
formatMilliseconds(123)   // "123ms"
formatMilliseconds(1234)  // "1.23s"
```

### 4.7 Decimals and Ordinals

```ts
// Specifying decimal places
formatDecimal(3.14159, 2)  // "3.14"

// Ordinals (English)
formatOrdinal(1)   // "1st"
formatOrdinal(2)   // "2nd"
formatOrdinal(3)   // "3rd"
formatOrdinal(11)  // "11th"
```

---

## 5. Implementation Patterns

### 5.1 Unified Input Type

All format functions accept `Date | string | number`:

```ts
// All produce the same result
formatDateLong(new Date("2024-03-04"))
formatDateLong("2024-03-04")
formatDateLong(1709510400000)
```

### 5.2 Options Design

```ts
// Common options type
interface DateFormatOptions {
  locale?: string;     // Default: "en"
  timeZone?: string;
}

interface NumberFormatOptions {
  locale?: string;     // Default: "en"
}

// Extended options type
interface CurrencyFormatOptions extends NumberFormatOptions {
  currency?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}
```

**Key points**:
- All options are optional (have default values)
- Extend base types with extends to maintain type consistency

### 5.3 Re-export Pattern

```ts
// lib/format/index.ts
export * from "./date";
export * from "./number";
```

Consumer side:

```ts
import { formatDate, formatCurrency, formatBytes } from "@/lib/format";
```

---

## 6. Usage Guidelines

### Recommended Styles by Screen

| Screen | Date Style | Number Style |
|--------|-----------|-------------|
| Table list | `short` / `medium` | `formatNumber` / `formatCompactNumber` |
| Detail page | `long` / `mediumTime` | `formatNumber` |
| Logs / Audit | `mediumTime` / `iso` | `formatNumber` |
| Timeline | `relative` | - |
| Dashboard | `short` | `formatCompactNumber` |
| Monetary amounts | - | `formatCurrency` / `formatUSD` / `formatJPY` |
| File information | - | `formatBytes` |
| Performance | - | `formatMilliseconds` |

---

## 7. Best Practices

### DO (Recommended)

```ts
// ✅ Use unified format functions
formatDate(createdAt, "medium")
formatCurrency(price, { currency: "USD" })

// ✅ Propagate locale option from parent
function UserProfile({ locale }: { locale: string }) {
  return <span>{formatDate(user.createdAt, "long", { locale })}</span>;
}
```

### DON'T (Not Recommended)

```ts
// ❌ Hardcoded date format
`${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`

// ❌ Calling toLocaleString directly with options every time
date.toLocaleDateString("ja", { year: "numeric", month: "long", day: "numeric" })
// → Use formatDateLong(date) instead

// ❌ Hardcoded number formatting
(num / 1000000).toFixed(1) + "M"
// → Use formatCompactNumber(num) instead
```

---

## 8. Summary

| Category | Function | Use Case |
|----------|----------|----------|
| Date | `formatDate(date, style)` | Unified entry point |
| Date | `formatDateShort/Medium/Long` | Style-specific formatting |
| Date + Time | `formatDateTimeShort/Medium/Long` | Combined date and time |
| Relative Time | `formatRelativeTime` | "ago" display |
| ISO | `formatDateISO / formatDateTimeISO` | For APIs / logs |
| Number | `formatNumber` | Locale-aware number |
| Compact | `formatCompactNumber / formatCompactNumberIntl` | K/M/B display |
| Currency | `formatCurrency / formatUSD / formatJPY` | Currency display |
| Percent | `formatPercent` | Percentage |
| Bytes | `formatBytes` | File size |
| Duration | `formatDuration / formatDurationLong` | Time display |
| Milliseconds | `formatMilliseconds` | Performance measurement |
| Decimal | `formatDecimal` | Decimal place specification |
| Ordinal | `formatOrdinal` | 1st, 2nd, 3rd |

---
# middleware.md (frameworks/nextjs/)
---

# Middleware Design Guidelines

This document defines the design policy and implementation patterns for **Edge Middleware** in Next.js App Router.
Since Middleware executes at the beginning of the request lifecycle, it serves as a cornerstone for authentication, security, and observability.

---

## 1. Core Principles

- **Single file design**: All middleware logic is consolidated in `src/middleware.ts`
- **Clear processing order**: Execute in the order of Security → Authentication → Routing → Header configuration
- **Edge Runtime compatible**: Use Web Standard APIs without depending on Node.js APIs

---

## 2. Middleware Processing Flow

```
Request received
  │
  ▼
┌────────────────────────────────────────────┐
│ 1. Request ID generation                   │
│    Reuse existing header if present        │
└─────────────────────┬──────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────┐
│ 2. Security checks (early return)          │
│    - Sanctioned country block → 403        │
│    - Admin panel IP restriction → 403      │
│    - Maintenance mode → redirect           │
└─────────────────────┬──────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────┐
│ 3. Authentication check                    │
│    - Protected route auth check → login    │
│    - 2FA verification flow control         │
│    - Authenticated user redirect           │
└─────────────────────┬──────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────┐
│ 4. Response header configuration           │
│    - CSP nonce generation                  │
│    - x-request-id                          │
│    - x-pathname / x-url                    │
│    - x-user-country                        │
└────────────────────────────────────────────┘
```

---

## 3. Request ID Generation and Propagation

### Purpose
- **Distributed tracing**: Link server logs, API logs, and external API calls to a single request
- **User support**: Users can provide the requestId to help identify logs for inquiries

### Implementation Pattern

```ts
// middleware.ts
function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `req_${timestamp}_${randomPart}`;
}

// Reuse existing header if present (e.g., set by external load balancer)
const requestId = req.headers.get("x-request-id") || generateRequestId();

// Set in response headers
response.headers.set("x-request-id", requestId);
```

### Rules
- While `crypto.randomUUID()` is available in Edge Runtime, a **short ID with prefix** is advantageous for readability and log searching
- Attach requestId to redirect responses as well

---

## 4. Security Checks

### 4.1 Sanctioned Country Blocking

Block access from specific countries based on international sanctions. **OFAC** (Office of Foreign Assets Control) is a U.S. Treasury Department agency that administers trade sanctions programs. Services accessible to users in sanctioned countries can expose the company to severe legal penalties (fines, criminal prosecution) under U.S. law, even for non-U.S. companies that process USD transactions or have U.S. nexus.

```ts
// lib/security/sanctioned-countries.ts
export const SANCTIONED_COUNTRIES = ["CU", "IR", "KP", "SY", "RU"] as const;

export function isSanctionedCountry(countryCode: string): boolean {
  if (!countryCode) return false;
  return SANCTIONED_COUNTRIES.includes(countryCode.toUpperCase());
}
```

```ts
// Usage in middleware.ts
const country =
  req.headers.get("x-vercel-ip-country") ||
  req.headers.get("cf-ipcountry") ||
  "";

if (isSanctionedCountry(country)) {
  return new NextResponse("Access denied", { status: 403 });
}
```

**Country code source (priority order)**:
1. `x-vercel-ip-country` (automatically set by Vercel)
2. `cf-ipcountry` (automatically set by Cloudflare)
3. Custom headers (AWS ALB, etc.)

### 4.2 Admin Panel IP Restriction

Restrict access to the admin panel (`/admin`) to allowed IP addresses only.

```ts
// lib/security/admin-ip-restriction.ts

export function isAdminIpAllowed(clientIp: string | null): boolean {
  const allowedIps = getAllowedIps(); // Environment variable ADMIN_ALLOWED_IPS

  // No restriction if not configured
  if (!allowedIps) return true;

  // Block if IP cannot be obtained
  if (!clientIp) return false;

  // Treat IPv6 loopback as IPv4 loopback
  const normalizedIp = clientIp === "::1" ? "127.0.0.1" : clientIp;

  for (const allowed of allowedIps) {
    if (allowed.includes("/")) {
      if (matchesCidr(normalizedIp, allowed)) return true;
    } else {
      if (normalizedIp === allowed) return true;
    }
  }

  return false;
}
```

**Key points**:
- Specify via environment variable `ADMIN_ALLOWED_IPS` as comma-separated values (e.g., `203.0.113.1,192.168.1.0/24`)
- **CIDR notation support**: Allows subnet-level permissions
- No restriction when unset (convenience for development environments)
- Defaults to blocking when IP cannot be obtained (fail-safe)

### 4.3 Maintenance Mode

Enable maintenance mode via environment variable and redirect all users to the maintenance page.

```ts
// middleware.ts
if (
  process.env.MAINTENANCE_MODE === "true" &&
  pathname !== "/maintenance" &&
  !isAdminIpAllowed(clientIp)
) {
  return NextResponse.redirect(new URL("/maintenance", req.url));
}
```

**Key points**:
- **Admin IPs bypass**: Normal access is possible from IPs included in `ADMIN_ALLOWED_IPS`
- Prevent infinite redirects to the maintenance page itself
- Switchable via environment variable only (no deployment needed)

### 4.4 Client IP Retrieval

Obtain the correct client IP even behind proxies.

```ts
const clientIp =
  req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
  req.headers.get("x-real-ip") ||
  null;
```

| Header | Set By |
|--------|--------|
| `x-forwarded-for` | Vercel / AWS ALB / Nginx |
| `cf-connecting-ip` | Cloudflare |
| `x-real-ip` | Nginx |

---

## 5. Authentication Checks

### 5.1 Protected Route Definition

```ts
const protectedRoutes = [
  "/dashboard",
  "/project",
  "/settings",
  "/quick-start",
];

const isProtectedRoute = protectedRoutes.some((route) =>
  pathname.startsWith(route),
);

if (isProtectedRoute && !isLoggedIn) {
  return redirectTo("/login");
}
```

### 5.2 2FA Flow Control

Restrict access to protected routes for users with 2FA enabled until verification is complete.

```ts
// Get 2FA requirement flag from session
const requiresTwoFactor = req.auth?.requiresTwoFactor === true;

// Get 2FA verification completion status from cookie
const twoFactorVerified = req.cookies.get("2fa-verified")?.value === "true";

// 2FA verification required but not completed → redirect to verification page
if (isLoggedIn && requiresTwoFactor && !twoFactorVerified) {
  if (pathname !== "/verify-2fa") {
    return redirectTo("/verify-2fa");
  }
}
```

**Why a cookie for 2FA status instead of the session/JWT**: The 2FA verification happens *after* the initial login, so the session already exists with `requiresTwoFactor: true`. Storing the verification result back into the JWT would require re-signing the token on every 2FA completion, which is not possible in Edge Middleware (no DB access). A short-lived, httpOnly, secure cookie provides a lightweight signal that the second factor has been verified for this browser session, without modifying the JWT.

**Flow**:
1. Login succeeds → Set `requiresTwoFactor: true` in session
2. Middleware redirects to 2FA verification page
3. 2FA code input and verification succeeds → Set `2fa-verified` cookie
4. Subsequent requests proceed with normal access

### 5.3 Authenticated User Redirect

```ts
// Logged in user accessing login page → redirect to dashboard
if (pathname === "/login" && isLoggedIn) {
  if (requiresTwoFactor && !twoFactorVerified) {
    return redirectTo("/verify-2fa");
  }
  return redirectTo("/dashboard");
}
```

---

## 6. CSP (Content Security Policy) Nonce

### Purpose
- Prevent XSS attacks
- Eliminate `'unsafe-inline'` and transition to nonce-based script authorization

### Implementation Pattern

```ts
// middleware.ts
const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
const cspHeader = buildCspHeader(nonce);

// Add nonce to request headers (to make it accessible in Server Components)
const requestHeaders = new Headers(req.headers);
requestHeaders.set("x-nonce", nonce);

const response = NextResponse.next({
  request: { headers: requestHeaders },
});

response.headers.set("Content-Security-Policy", cspHeader);
```

```ts
// lib/security/csp.ts
export function buildCspHeader(nonce: string): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      ...(isProduction ? [] : ["'unsafe-eval'"]),
    ],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", ...allowedImageHosts],
    "frame-ancestors": ["'none'"],
    "form-action": ["'self'"],
    "base-uri": ["'self'"],
    "object-src": ["'none'"],
  };

  return Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(" ")}`)
    .join("; ");
}
```

**Key points**:
- Allow `'unsafe-eval'` in development environments (required for HMR)
- Establish trust chain with `'strict-dynamic'`
- Explicitly add external API domains to `connect-src`

---

## 7. Response Header Configuration

Standard headers attached to responses by Middleware:

| Header | Purpose | Example |
|--------|---------|---------|
| `x-request-id` | Distributed tracing | `req_m5k2j_a8b3c4d5` |
| `x-pathname` | Path retrieval in Server Components | `/dashboard` |
| `x-url` | Full URL retrieval | `https://example.com/dashboard?tab=1` |
| `x-nonce` | CSP nonce (on request header side) | `YTJlMzQ1...` |
| `x-user-country` | Geographic information | `JP` |
| `Content-Security-Policy` | CSP policy | `default-src 'self'; ...` |

---

## 8. Matcher Configuration

Define path patterns to which Middleware is applied.

```ts
export const config = {
  matcher: [
    // Exclude API, static files, image optimization, and favicon
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
```

**Paths to exclude**:
- `/api/*` — API Routes have their own authentication
- `/_next/static/*` — Static assets
- `/_next/image/*` — Image optimization
- `/favicon.ico` — Favicon

---

## 9. Security Module Placement

```
src/
  middleware.ts                           # Middleware body (invocation only)
  lib/
    security/
      csp.ts                             # CSP header generation
      sanctioned-countries.ts            # Sanctioned country list and determination
      admin-ip-restriction.ts            # Admin panel IP restriction
      suspicious-login-detector.ts       # Suspicious login detection
```

**Principles**:
- `middleware.ts` **does not contain decision logic** (invocation only)
- Decision and generation logic is placed in `/lib/security/`
- Unit tests are performed on individual modules

---

## 10. Best Practices

### DO (Recommended)

```ts
// ✅ Attach request ID to redirects as well
function createRedirectWithRequestId(url: URL, requestId: string) {
  const response = NextResponse.redirect(url);
  response.headers.set("x-request-id", requestId);
  return response;
}

// ✅ Separate decision logic into separate modules
import { isAdminIpAllowed } from "@/lib/security/admin-ip-restriction";

// ✅ Switch modes via environment variables (no deployment needed)
if (process.env.MAINTENANCE_MODE === "true") { ... }
```

### DON'T (Not Recommended)

```ts
// ❌ Hardcoding complex decision logic directly in Middleware
if (ip === "1.2.3.4" || ip === "5.6.7.8") { ... }

// ❌ Executing DB access in Middleware (limited in Edge Runtime)
const user = await prisma.user.findUnique({ ... });

// ❌ Executing heavy processing in Middleware (increases latency)
const result = await fetch("https://external-api.com/check", { ... });

// ❌ Making matcher too broad (impacts performance)
export const config = { matcher: ["/:path*"] };
```

---

## 11. Edge Runtime Constraints

Middleware runs in Edge Runtime, so the following constraints apply:

| Constraint | Resolution |
|-----------|-----------|
| Node.js APIs unavailable | `fs`, `path`, etc. cannot be used |
| No direct DB access | Prisma Client cannot be used |
| Execution time limit | Vercel: 25 seconds (Edge Functions) |
| Bundle size limit | Must be under 1MB |
| Encryption | `crypto.randomUUID()` is available |

---

## 12. Summary

| Feature | Implementation Location | Purpose |
|---------|------------------------|---------|
| Request ID | middleware.ts | Distributed tracing |
| Sanctioned country blocking | lib/security/sanctioned-countries.ts | Legal compliance |
| Admin panel IP restriction | lib/security/admin-ip-restriction.ts | Admin panel protection |
| Maintenance mode | middleware.ts | Operations management |
| Authentication check | middleware.ts + auth() | Route protection |
| 2FA flow control | middleware.ts | Multi-factor authentication |
| CSP nonce | lib/security/csp.ts | XSS prevention |
| Header configuration | middleware.ts | Observability / SEO |

---
# overview.md (frameworks/nextjs/)
---

# Overview

> **Note:** The technology stack below is a sample configuration. Replace libraries based on your project's requirements. Files marked with `[Replaceable]` in this directory contain library-specific patterns — update the corresponding files when switching libraries.

## Purpose
This is a guideline for designing large-scale applications centered on Next.js large-scale applications, balancing stability, observability, extensibility, and developer productivity.

## Technology Stack
- Next.JS Latest Version
  - Routing & Navigation
  - SSR/SSG & Data Fetching
  - Metadata
  - API Route Handling
  - Image Optimization
  - Environment Variables
  - Code Splitting & Build
- Form Management: React Hook Form
- Server State Management: Server Actions + Custom Hooks (useAsyncAction, useListData, etc.)
- Styling: Tailwind CSS + shadcn/ui
- Authentication: NextAuth.js
- AI Generation: {AI API} (Choose based on project: OpenAI, Google Gemini, Anthropic, etc.)
- Database ORM: Prisma (SQLite)
- Validation: Zod
- Internationalization: next-intl
- Logger: Pino

### Replaceable Libraries

| Category | Current | Alternatives | Related Files |
|----------|---------|-------------|---------------|
| State Management | Server Actions + Custom Hooks | TanStack Query, SWR | `state.md`, `client-hooks.md` |
| Form Management | React Hook Form | Conform, Formik | `form.md` |
| UI Components | Tailwind CSS + shadcn/ui | MUI, Mantine, Ant Design | `ui.md` |
| Authentication | NextAuth.js | Clerk, Lucia, Auth0 | `auth.md` |
| Database ORM | Prisma (SQLite) | Drizzle, Kysely; PostgreSQL, Turso | `database.md` |
| Server Communication | Server Actions (ActionResult) | tRPC | `server-actions.md` |
| Validation | Zod | Valibot, ArkType | `form.md`, `server-actions.md` |

The following are used according to functional requirements
- Payment Processing: {Payment Service} (Choose based on project: Stripe, PayPal, etc.)

The following cloud services are used
- {Cloud Provider} (AI API, Storage, etc.)
- Vercel (Hosting / Cron)

## Basic Principles
Unified data fetching/mutation via Server Actions (not client-side fetch or global state libraries), automated testing / CI/CD

---
# project-structure.md (frameworks/nextjs/)
---

# Project Structure Guidelines
This document summarizes the directory policies and architecture guidelines for designing large-scale web applications centered on Next.js large-scale applications.

# 1. Overall Principles
- Adopt **vertical slicing (feature-based) as the base structure**
  → Group UI / API / DB / types / validation / hooks / services per feature
- **Horizontal slicing is limited to shared functionality only**
  → Shared layers such as ui / lib / config / types / styles

---

# 2. Directory Structure

```
src/
├─ app/                    # Next.js App Router (page entry points)
│  ├─ (public)/            # Public pages (no authentication required)
│  ├─ (protected)/         # Authentication-required pages
│  ├─ api/                 # Route Handlers (REST API / Webhook / Cron)
│  └─ layout.tsx
│
├─ features/               # Core of vertical slicing (full-stack management per feature)
│  ├─ {domain}/             # Example: the most complex feature (core project domain)
│  │  ├─ components/       # Feature-specific UI components
│  │  ├─ hooks/            # Feature-specific React Hooks
│  │  ├─ server/           # Server Actions
│  │  ├─ services/         # Domain logic, API clients, DB operations
│  │  ├─ schema/           # Zod schemas
│  │  ├─ types/            # Feature-specific type definitions
│  │  ├─ context/          # React Context (state sharing within the feature)
│  │  ├─ config/           # Feature-specific configuration
│  │  ├─ constants/        # Feature-specific constants
│  │  └─ utils/            # Feature-specific utilities
│  ├─ admin/
│  ├─ auth/
│  ├─ billing/
│  ├─ settings/
│  └─ ...                  # Other features
│
├─ components/             # Shared components
│  ├─ ui/                  # shadcn/ui primitives (do not modify)
│  ├─ common/              # App-wide common UI (EmptyState, LoadingButton, etc.)
│  ├─ layout/              # Layout-related (Sidebar, Header, etc.)
│  ├─ form/                # Shared form components
│  ├─ table/               # Shared table components
│  ├─ dialog/              # Shared dialogs
│  ├─ filter/              # Shared filter UI
│  ├─ card/                # Shared cards
│  ├─ shared/              # Components shared across multiple features
│  ├─ providers/           # Global Providers
│  ├─ admin/               # Admin panel shared
│  ├─ analytics/           # Analytics / chart shared
│  ├─ compliance/          # Compliance shared
│  └─ dashboard/           # Dashboard shared
│
├─ lib/                    # Shared utility layer (no business logic allowed)
│  ├─ auth/                # NextAuth.js configuration
│  ├─ prisma/              # Prisma Client singleton
│  ├─ actions/             # Server Actions shared helpers (ActionResult, etc.)
│  ├─ errors/              # DomainError / error code definitions
│  ├─ api/                 # CORS, rate limiting, API clients
│  ├─ security/            # CSP, sanctioned countries, IP restrictions
│  ├─ config/              # Environment variable validation
│  ├─ format/              # Date / number formatting
│  ├─ schemas/             # Shared Zod schemas (pagination, etc.)
│  ├─ utils/               # General-purpose utilities
│  ├─ crypto/              # Encryption (AES-256-GCM)
│  ├─ cron/                # Cron job shared processing
│  ├─ external/            # External service clients
│  ├─ storage/             # LocalStorage key management
│  ├─ logger.ts            # Server-side logger (Pino)
│  ├─ client-logger.ts     # Client-side logger
│  ├─ email.ts             # Email sending
│  └─ utils.ts             # cn() utility
│
├─ hooks/                  # General-purpose React Hooks (useAsyncAction, useListData, etc.)
├─ config/                 # App-wide configuration
├─ types/                  # App-wide shared type definitions
├─ i18n/                   # next-intl configuration
├─ middleware.ts           # Edge Middleware
└─ instrumentation.ts     # OpenTelemetry instrumentation
```

---

# 3. Vertical Slice Design (Feature-based Architecture)

## 3.1 Internal Structure of a Feature

Select subdirectories based on the scale of the feature. Not all are required.

```
features/<feature-name>/
├─ components/       # Feature-specific UI components (required)
├─ server/           # Server Actions (required)
├─ schema/           # Zod validation schemas
├─ services/         # Domain logic, DB operations, external API calls
├─ types/            # Feature-specific type definitions
├─ hooks/            # Feature-specific React Hooks
├─ context/          # React Context (state sharing within the feature)
├─ config/           # Feature-specific configuration values
├─ constants/        # Feature-specific constants
└─ utils/            # Feature-specific utilities
```

## 3.2 Structure Examples by Scale

**Small-scale feature** (auth, contact, etc.):
```
auth/
├─ components/       # Login form, etc.
└─ server/           # Authentication Server Actions
```

**Medium-scale feature** (settings, admin, etc.):
```
settings/
├─ components/
├─ schema/
├─ server/
└─ utils/
```

**Large-scale feature** (core project domain, etc.):
```
{domain}/
├─ components/       # 50+ components
├─ hooks/            # 30+ hooks
├─ server/           # 20+ Server Actions
├─ services/         # 15+ services
├─ schema/
├─ types/
├─ context/
├─ config/
├─ constants/
└─ utils/
```

### Benefits
- Related code is consolidated in one place → easier to understand
- Extensions do not pollute other directories
- Easy to refactor or delete on a per-feature basis

---

# 4. Horizontal Slicing (Shared Layers)

| Folder | Clear Role |
|--------|--------|
| components/ui/ | **shadcn/ui primitives** (Button, Card, etc. — breaking changes prohibited) |
| components/common/ | **App-wide common UI** (EmptyState, LoadingButton, Pagination, etc.) |
| components/layout/ | **Layout** (Sidebar, Header, etc.) |
| components/shared/ | **Components shared across multiple features** |
| lib/ | **Shared processing not dependent on any specific domain** (dates, auth config, CORS, etc.)<br>* Data fetching or processing logic is prohibited |
| hooks/ | **General-purpose React Hooks** (useAsyncAction, useListData, etc.) |
| types/ | App-wide shared types |
| i18n/ | next-intl configuration |
| config/ | App-wide configuration |

---

# 5. Dependency Rules (Important)
## 5.1 Prohibited Practices
- **Cross-feature dependencies are prohibited** — if two features need shared logic, extract it to `lib/` or `components/shared/`
- **lib → features dependencies are prohibited**
- **components → features dependencies are prohibited**
- **app having deep dependencies on internal logic is prohibited** — `page.tsx` should call a service function or Server Action, not reach into feature internals

---

# 6. Server Actions Placement Rules (Strict)
- **Must be placed in `features/*/server/`**
- `src/server/` is **limited to the bare minimum for app-wide concerns** such as authentication and authorization
- Business logic should be consolidated in `services/`, and Server Actions should serve **only as the invocation gateway**

---

# 7. Next.js Role Separation Enhancement

| Element | Responsibility |
|-----|------|
| `page.tsx` (Server Component) | **Act solely as a data pass-through**:<br>Call functions from services/ or server/ and pass results to UI only |
| Client Component | UI / event handling |
| services/ | Domain logic, DB/external API access |
| server/ | Server Actions (invocation gateway from client) |

---

# 8. Guidelines for Extension

1. Create a `src/features/<new-feature>` directory
2. Keep components / server / schema, etc. **self-contained within it**
3. Add the UI entry point at `app/(protected)/<feature>/page.tsx`

---

# 9. Guidelines Summary

- **Vertical slice structure is the default**
- **Business logic must always be contained within features**
- **Server Actions placement responsibilities are strictly enforced**
- **lib/ must never contain domain-specific logic** — `lib/` is for infrastructure utilities (auth config, DB client, formatting, encryption). Domain logic (e.g., "calculate project completion percentage") belongs in `features/*/services/` because it changes with business requirements and should be co-located with related UI and schemas
- **page.tsx serves only as a data pass-through to the UI**

---
# routing.md (frameworks/nextjs/)
---

# Next.js Design Guidelines
This chapter summarizes routing design, page hierarchy, data fetching strategies, and Metadata design for Next.js large-scale applications.

---

# 1. Routing (App Router)
Based on Next.js 13+ **App Router (/app) structure**.

## 1.1 App Router Basic Principles
* Place shared UI, global wrappers, authentication guards, and role controls in `layout.tsx`.
* Each page should provide the following as needed:
  * `loading.tsx` ... Suspense loading display
  * `error.tsx` ... Error handling (supports both server & client)
  * `not-found.tsx` ... Custom 404

## 1.2 Dynamic Routes
Utilize dynamic routing to design clear and consistent URLs.

```
Example:
/app/posts/[slug]/page.tsx
/app/users/[id]/settings/page.tsx
```

### Catch-all Route

Use **catch-all** or **optional catch-all** when complex hierarchies are needed.

```
/app/docs/[...slug]/page.tsx
```

---

# 2. Navigation (Transition Design)

### 2.2 Sub-layout Structure
* Feature-specific layouts enable UI consistency and separation of concerns.
* Examples: Dashboard-specific layout / Public page layout / Authentication layout

---

# 3. Metadata (SEO / OGP / Twitter Cards)
Use the Next.js **Metadata API**.

## 3.1 Basic Principles
* Define `export const metadata` in each page (`page.tsx`).
* Place global default settings in `app/layout.tsx`.
* Override metadata in child pages when the page has unique content that differs from the layout defaults — for example, a blog post page should override `title` and `description` with the post's actual title/excerpt, and product pages should set product-specific OG images.

```ts
// Example:
export const metadata = {
  title: "Article Detail Page",
  description: "Blog article content",
  openGraph: {
    title: "Article Detail Page",
    description: "Blog article content",
    images: ["/og/post.png"],
  },
  twitter: {
    card: "summary_large_image",
  },
};
```

## 3.2 Dynamic Metadata (Dynamic Route Support)
* For Dynamic Routes (e.g., `/posts/[slug]`),
  use `generateMetadata()` to dynamically generate **SEO information based on params or fetched results**.

```ts
export async function generateMetadata({ params, searchParams }) {
  // Fetch title and description from DB / API and return
}
```

---

# 4. Data Fetching (SSR / SSG / ISR Strategy)
Data fetching strategy optimized for Next.js App Router recommended patterns.

## 4.1 Public Content (SEO-focused)
* Use Static Site Generation (SSG) + ISR (Incremental Static Regeneration) as the default.
* In App Router, combine the following:
  * `generateStaticParams`
  * `fetch` with `next: { revalidate: <seconds> }`

## 4.2 User-specific Data (Authenticated User Information)

> **Reference:** For detailed implementation patterns of Server Actions + custom hooks, see frameworks/nextjs/state.md

* Render initial content with SSR (Server Component).
* On the client, use **Server Actions + custom hooks** (useAsyncAction, useListData, useTableState) to achieve **state management, loading, and error handling**.
* Combine with `useOptimistic` to achieve both secure server updates and real-time UI updates.

Benefits:
* Secure (authentication tokens can be handled server-side)
* Fast initial rendering
* Fast client-side state updates

## 4.3 Frequently Changing UI Data / Real-time
* Use **Server Actions + custom hooks** on the client side to handle high-frequency updates.
* Combine with WebSocket / EventSource / Server Sent Events for real-time updates.

## 4.4 Responsibilities of Server Components and Client Components

| Server Components | Client Components |
| --- | --- |
| DB queries (hide auth info and env vars, direct access without going through the API layer) | Interactive UI, forms (React Hook Form) |
| Auth checks, external API calls | Data fetching/mutation via Server Actions + custom hooks (useAsyncAction, useListData) |
| Heavy computation | Instant UI updates via `useOptimistic` |

---

# 5. Summary (Routing / Metadata / Data Fetching)
* Organize hierarchy with App Router and separate concerns at the layout level.
* Unify UX with per-page `loading.tsx` / `error.tsx`.
* Public pages use SSG/ISR; user-specific data uses SSR + Server Actions + custom hooks.
* Flexibly and dynamically control SEO/OG/Twitter via the Metadata API.
* Achieve DB access that balances security and performance through Server Components.

---
# server-actions.md (frameworks/nextjs/)
---

# Server Actions Guidelines

> **[Replaceable]** This guide uses **Server Actions with the ActionResult pattern**. If your project uses **tRPC** or other RPC frameworks, replace the server communication patterns accordingly. The principles (type-safe error handling, authentication/authorization checks, input validation) remain the same.

This document defines the unified patterns and implementation guidelines for Next.js Server Actions.

---

## 1. Basic Principles

- Use the **ActionResult pattern** uniformly to achieve type-safe error handling
- Reduce boilerplate with the **withAction() wrapper**
- Standardize **authentication checks** and **IDOR (Insecure Direct Object Reference) prevention** — IDOR occurs when a user modifies an ID parameter (e.g., `/project/123`) to access another user's resource; prevent by always verifying `resource.userId === session.user.id` before operating on data
- Place Server Actions in `/features/{domain}/server/` — co-locates the server mutation logic with the feature's UI components, schemas, and services, making it easy to find and refactor as a unit

---

## 2. ActionResult Type

### Basic Structure

```ts
// lib/actions/action-helpers.ts

/** Success response */
export interface ActionSuccess<T> {
  success: true;
  data: T;
}

/** Error response */
export interface ActionFailure {
  success: false;
  error: ActionError;
}

/** ActionError type */
export interface ActionError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  fieldErrors?: Record<string, string[]>;
}

/** Unified type (Discriminated Union) */
export type ActionResult<T> = ActionSuccess<T> | ActionFailure;
```

### Usage Examples

```ts
// On success
return { success: true, data: { id: project.id, name: project.name } };

// On failure
return {
  success: false,
  error: { code: "NOT_FOUND", message: "Project not found" },
};
```

---

## 3. withAction() Wrapper

### Purpose

- Reduce try-catch boilerplate
- Automatically load translation files
- Unified error conversion

### Signature

```ts
export async function withAction<T, D = unknown>(
  fn: (params: ActionContext<D>) => Promise<ActionResult<T>>,
  options: WithActionOptions<D>
): Promise<ActionResult<T>>;

interface WithActionOptions<D = unknown> {
  /** Translation namespace (e.g., "project", "user") */
  translationNamespace?: string;
  /** Request data (target for Zod parsing) */
  data?: D;
  /** Zod schema (used with data for validation) */
  schema?: ZodSchema<D>;
  /** Request ID (for tracing) */
  requestId?: string;
}

interface ActionContext<D> {
  /** i18n translation function */
  t: (key: string, values?: Record<string, unknown>) => string;
  /** Validated data (when schema is specified) */
  validData?: D;
}
```

### Usage Example

```ts
// features/project/server/project-actions.ts
"use server";

import { withAction } from "@/lib/actions/action-helpers";
import { createProjectSchema } from "../schema/project-schema";

export async function createProject(
  formData: CreateProjectInput
): Promise<ActionResult<{ id: string }>> {
  return withAction(
    async ({ t, validData }) => {
      // validData is already validated
      const project = await prisma.project.create({
        data: validData!,
      });

      return { success: true, data: { id: project.id } };
    },
    {
      translationNamespace: "project",
      data: formData,
      schema: createProjectSchema,
    }
  );
}
```

---

## 4. Error Handling

### createActionErrors() Utility

```ts
// Error generation helper
export function createActionErrors(t: TranslationFunction) {
  return {
    notFound: (entity = "resource"): ActionFailure => ({
      success: false,
      error: { code: "NOT_FOUND", message: t("errors.notFound", { entity }) },
    }),
    unauthorized: (): ActionFailure => ({
      success: false,
      error: { code: "UNAUTHORIZED", message: t("errors.unauthorized") },
    }),
    forbidden: (): ActionFailure => ({
      success: false,
      error: { code: "FORBIDDEN", message: t("errors.forbidden") },
    }),
    validation: (fieldErrors: Record<string, string[]>): ActionFailure => ({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: t("errors.validation"),
        fieldErrors,
      },
    }),
    internal: (details?: string): ActionFailure => ({
      success: false,
      error: { code: "INTERNAL_ERROR", message: t("errors.internal"), details },
    }),
  };
}
```

### Usage Example

```ts
export async function deleteProject(
  projectId: string
): Promise<ActionResult<void>> {
  return withAction(
    async ({ t }) => {
      const errors = createActionErrors(t);

      const session = await auth();
      if (!session?.user?.id) {
        return errors.unauthorized();
      }

      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        return errors.notFound("project");
      }

      // IDOR prevention: ownership check
      if (project.userId !== session.user.id) {
        return errors.forbidden();
      }

      await prisma.project.delete({ where: { id: projectId } });

      return { success: true, data: undefined };
    },
    { translationNamespace: "project" }
  );
}
```

---

## 5. handleActionError() Function

Uniformly converts Prisma errors and Zod errors to ActionError:

```ts
export function handleActionError(
  error: unknown,
  t: TranslationFunction
): ActionError {
  // Zod validation error
  if (error instanceof ZodError) {
    return {
      code: "VALIDATION_ERROR",
      message: t("errors.validation"),
      fieldErrors: error.flatten().fieldErrors,
    };
  }

  // Prisma error
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const prismaError = PRISMA_ERROR_MAP[error.code];
    if (prismaError) {
      return {
        code: prismaError.code,
        message: t(prismaError.messageKey),
      };
    }
  }

  // Domain error (custom error class)
  if (error instanceof DomainError) {
    const domainError = DOMAIN_ERROR_MAP[error.code];
    if (domainError) {
      return {
        code: domainError.code,
        message: t(domainError.messageKey),
      };
    }
  }

  // Unknown error
  return {
    code: "INTERNAL_ERROR",
    message: t("errors.internal"),
  };
}
```

### Error Mapping

```ts
// Prisma error mapping
export const PRISMA_ERROR_MAP: Record<string, { code: string; messageKey: string }> = {
  P2002: { code: "UNIQUE_CONSTRAINT", messageKey: "errors.unique" },
  P2025: { code: "NOT_FOUND", messageKey: "errors.notFound" },
  P2003: { code: "FOREIGN_KEY_CONSTRAINT", messageKey: "errors.reference" },
};

// Domain error mapping
export const DOMAIN_ERROR_MAP: Record<string, { code: string; messageKey: string }> = {
  INSUFFICIENT_QUOTA: { code: "INSUFFICIENT_QUOTA", messageKey: "errors.insufficientQuota" },
  RATE_LIMIT_EXCEEDED: { code: "RATE_LIMIT", messageKey: "errors.rateLimit" },
  FILE_TOO_LARGE: { code: "FILE_TOO_LARGE", messageKey: "errors.fileTooLarge" },
};
```

---

## 6. Authentication Helpers

> **Reference:** For the overall security strategy, see common/security.md

### requireAuth()

```ts
export async function requireAuth(): Promise<
  | { success: true; session: Session; userId: string }
  | ActionFailure
> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      success: false,
      error: { code: "UNAUTHORIZED", message: "Authentication required" },
    };
  }
  return { success: true, session, userId: session.user.id };
}
```

### requireOwnership()

```ts
export async function requireOwnership<T extends { userId: string }>(
  resource: T | null,
  userId: string
): Promise<
  | { success: true; resource: T }
  | ActionFailure
> {
  if (!resource) {
    return {
      success: false,
      error: { code: "NOT_FOUND", message: "Resource not found" },
    };
  }
  if (resource.userId !== userId) {
    return {
      success: false,
      error: { code: "FORBIDDEN", message: "You do not have permission to access this resource" },
    };
  }
  return { success: true, resource };
}
```

### Usage Example

```ts
export async function getProjectDetails(
  projectId: string
): Promise<ActionResult<ProjectDetails>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    const ownershipResult = await requireOwnership(project, authResult.userId);
    if (!ownershipResult.success) return ownershipResult;

    return { success: true, data: ownershipResult.resource };
  }, {});
}
```

---

## 7. Pagination

### executePaginatedQuery()

```ts
interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function executePaginatedQuery<T>(
  query: {
    findMany: (args: any) => Promise<T[]>;
    count: (args: any) => Promise<number>;
  },
  options: {
    where?: any;
    orderBy?: any;
    page: number;
    limit: number;
    include?: any;
    select?: any;
  }
): Promise<PaginatedResult<T>> {
  const { page, limit, where, orderBy, include, select } = options;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    query.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include,
      select,
    }),
    query.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
```

### Usage Example

```ts
export async function getProjects(
  params: GetProjectsParams
): Promise<ActionResult<PaginatedResult<Project>>> {
  return withAction(
    async () => {
      const authResult = await requireAuth();
      if (!authResult.success) return authResult;

      const result = await executePaginatedQuery(prisma.project, {
        where: {
          userId: authResult.userId,
          ...(params.search && {
            name: { contains: params.search, mode: "insensitive" },
          }),
        },
        orderBy: { [params.sortKey]: params.sortOrder },
        page: params.page,
        limit: params.limit,
      });

      return { success: true, data: result };
    },
    { translationNamespace: "project" }
  );
}
```

---

## 8. Directory Structure

```
/src
  /lib
    /actions
      action-helpers.ts      # Shared helpers
      errors.ts              # Error definitions / mapping
  /features
    /{domain}
      /server
        {domain}-actions.ts  # Server Actions
      /schema
        {domain}-schema.ts   # Zod schemas
```

---

## 9. Best Practices

### DO (Recommended)

```ts
// Wrap with withAction() — handles try-catch, i18n loading, and error conversion
return withAction(async ({ t, validData }) => {
  // ...
}, { translationNamespace: "domain", data, schema });

// Keep transactions within a single prisma.$transaction
await prisma.$transaction(async (tx) => {
  await tx.order.update(...);
  await tx.orderItem.create(...);
});
```

### DON'T (Not Recommended)

```ts
// Do not write try-catch directly (withAction handles it)
try {
  // ...
} catch (e) {
  return { success: false, error: { ... } };
}

// Do not omit authentication/authorization checks
const project = await prisma.project.findUnique({ where: { id } });
// Operating without checking userId

// Do not return raw error messages to the client
return { success: false, error: { message: e.message } };
```

---

## 10. Client-side Usage

> **Reference:** For detailed form UI patterns, see frameworks/nextjs/form.md

### Integration with useAsyncAction

```tsx
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { createProject } from "@/features/project/server/project-actions";

function CreateProjectForm() {
  const { execute, loading, error } = useAsyncAction({
    action: createProject,
    onSuccess: (data) => {
      router.push(`/project/${data.id}`);
    },
  });

  const handleSubmit = (values: CreateProjectInput) => {
    execute(values);
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <ErrorMessage error={error} />}
      {/* Form fields */}
      <Button type="submit" loading={loading}>
        Create
      </Button>
    </form>
  );
}
```

### Displaying Field Errors

```tsx
// When fieldErrors exist, integrate with React Hook Form
useEffect(() => {
  if (error?.fieldErrors) {
    Object.entries(error.fieldErrors).forEach(([field, messages]) => {
      form.setError(field as keyof FormValues, {
        type: "server",
        message: messages.join(", "),
      });
    });
  }
}, [error, form]);
```

---

## 11. Summary

| Item | Pattern |
|------|---------|
| Return value | `ActionResult<T>` (discriminated union) |
| Wrapper | Reduce boilerplate with `withAction()` |
| Authentication | Unified with `requireAuth()` |
| Authorization | IDOR prevention with `requireOwnership()` |
| Validation | Pass Zod schema to withAction |
| Error conversion | Unified with `handleActionError()` |
| Pagination | `executePaginatedQuery()` |
| i18n | Auto-load translations via translationNamespace |

---
# state.md (frameworks/nextjs/)
---

# State Management Guidelines

> **[Replaceable]** This guide uses **Server Actions + custom hooks** (useAsyncAction, useListData, etc.). If your project uses **TanStack Query** or **SWR**, replace the data fetching and caching patterns accordingly.

This document defines the management policy for server state and UI state in Next.js App Router.
This project adopts an architecture centered on **Server Actions + custom hooks** and does not depend on client-side data fetching libraries.

---

## 1. Core Principles

- **Data fetching and mutations are executed via Server Actions** (`features/*/server/`), never via client-side `fetch()` or API routes for internal operations
- **Client-side state management is unified through custom hooks** (`src/hooks/`) — components never manage loading/error/pagination state directly
- **UI state** (dialog open/close, selected items, form visibility) is managed locally within components using `useState` / `useReducer`
- **State sharing within a feature** is managed via React Context (`features/*/context/`) — Context is scoped to one feature, never used cross-feature
- **Global state management libraries (e.g., Zustand) are not used** — Server Actions + custom hooks replace the need for a global store

### Overall Data Flow

Data flows in one direction: Server Actions produce `ActionResult<T>`, custom hooks consume and manage that state, and components render from the hook's output. Components never write back to Server Actions except through hook-provided `execute`/`refetch` functions.

```
Server Actions (data fetching / mutations)
    ↓ ActionResult<T>
Custom Hooks (state management / loading / error / pagination)
    ↓ data, loading, error, refetch
Client Component (UI rendering / event handling)
```

### Choosing a Data Fetching Strategy

| Strategy | Use Case | Example |
|----------|----------|---------|
| **RSC Direct Fetch** | Initial display data, SEO-focused | Project details, public pages |
| **Server Actions + useListData** | Paginated lists | Admin panel lists, logs |
| **Server Actions + useAsyncAction** | User-initiated mutations | Delete, update, create |
| **Server Actions + useTableState** | Tables (search / filter / sort) | Audit logs, user management |

---

## 2. Directory Structure

```
src/
  hooks/                    # General-purpose custom hooks
    useAsyncAction.ts       # Async action execution and state management
    useListData.ts          # Paginated list fetching
    useTableState.ts        # Table state (search / filter / sort / pagination)
    useFilterState.ts       # Filter state management
    usePaginatedList.ts     # Pagination management
    useStatsData.ts         # Statistics data fetching
    useAnalyticsData.ts     # Analytics data fetching
    usePreviewForm.ts       # Form with preview
    useDebounce.ts          # Debounce
    useInitialFetch.ts      # Initial fetch control
    useOnlineStatus.ts      # Online status detection
    useRovingTabIndex.ts    # Roving tab index
  features/*/
    hooks/                  # Feature-specific hooks
    context/                # State sharing within a feature
  lib/
    actions/
      action-helpers.ts     # ActionResult type and common helpers
```

---

## 3. ActionResult Pattern with Server Actions

All data fetching and mutations are unified under the `ActionResult<T>` type.

```ts
// lib/actions/action-helpers.ts
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: ActionError };
```

> For details, see frameworks/nextjs/server-actions.md

---

## 4. Custom Hooks

### 4.1 useAsyncAction — Async Action Execution

Provides unified management of Server Action execution, loading state, error handling, and toast notifications.

```ts
const { execute: deleteItem, loading: deleting } = useAsyncAction({
  action: deleteBlacklistEntry,
  onSuccess: () => {
    setDeleteDialogOpen(false);
    refetch();
  },
  successMessage: t("deleteSuccess"),
});

// UI
<Button
  variant="destructive"
  onClick={() => deleteItem(selectedId)}
  disabled={deleting}
>
  {deleting ? tc("processing") : tc("delete")}
</Button>
```

**Features**:
- Automatically handles `ActionResult<T>`
- Optional toast notifications on success/error
- Stabilizes callbacks with `useRef` (avoids dependency array issues)
- Ensures type safety for arguments and return values via generics

### 4.2 useListData — Paginated List

Fetches and manages paginated list data from Server Actions.

```ts
const {
  data: logs,
  total,
  totalPages,
  page,
  setPage,
  loading,
  refetch,
} = useListData({
  fetcher: async (params) => getAuditLogs(params),
  params: {
    action: actionFilter === "all" ? undefined : actionFilter,
    search: debouncedSearch || undefined,
    sortKey,
    sortOrder,
  },
  limit: 20,
});
```

**Features**:
- Automatically resets to page 1 and re-fetches when `params` change
- Automatically re-fetches on page change
- `refetchWithReset()` for re-fetching with page reset
- Prevents duplicate initial fetches (`useRef`-based)

### 4.3 useTableState — Table State Management

Provides centralized management of search, filters, sorting, and pagination.

```ts
interface Filters {
  status: "all" | "active" | "inactive";
  type: string;
}

const {
  search, setSearch,
  debouncedSearch,
  filters, setFilter,
  sort, toggleSort,
  pagination, setPage, setTotal,
} = useTableState<Filters>({
  defaultSort: { key: "createdAt", order: "desc" },
  defaultLimit: 20,
  defaultFilters: { status: "all", type: "" },
});
```

**Features**:
- Built-in search debouncing (default 300ms)
- Automatically resets page on filter change
- Sort toggling (same key toggles asc/desc, different key starts with desc)
- `reset()` restores all state to initial values

### 4.4 useFilterState — Filter State Management

Manages type-safe filter state with active filter detection.

```ts
const {
  filters,
  setFilter,
  clearFilters,
  hasActiveFilters,
  activeFilterCount,
} = useFilterState({
  defaults: { status: "all", type: "all", search: "" },
});

// Reset button
{hasActiveFilters && (
  <Button variant="ghost" onClick={clearFilters}>
    Clear Filters ({activeFilterCount})
  </Button>
)}
```

**Features**:
- `"all"` and empty strings are not considered active
- Controls UI display with `hasActiveFilters` / `activeFilterCount`
- Customizable reset values via `resetValues`

---

## 5. Hook Composition Patterns

### Pattern A: List Screen (Standard)

```tsx
function UserListPage() {
  const { filters, setFilter, clearFilters } = useFilterState({ ... });
  const { data, loading, page, setPage, refetch } = useListData({
    fetcher: getUsers,
    params: { ...filters },
  });
  const { execute: deleteUser, loading: deleting } = useAsyncAction({
    action: deleteUserAction,
    onSuccess: () => refetch(),
  });

  return (
    <>
      <FilterBar ... />
      <DataTable data={data} loading={loading} />
      <Pagination page={page} onPageChange={setPage} />
    </>
  );
}
```

### Pattern B: Table Screen (with Search and Sort)

```tsx
function AuditLogPage() {
  const table = useTableState({ ... });
  const { data, loading } = useListData({
    fetcher: getAuditLogs,
    params: {
      search: table.debouncedSearch,
      ...table.filters,
      sortKey: table.sort.key,
      sortOrder: table.sort.order,
    },
  });

  return (
    <>
      <SearchInput value={table.search} onChange={table.setSearch} />
      <SortableTable sort={table.sort} onSort={table.toggleSort} />
      <Pagination page={table.pagination.page} onPageChange={table.setPage} />
    </>
  );
}
```

---

## 6. State Sharing Within a Feature (React Context)

When state sharing across multiple components within a feature is needed, use React Context.

```ts
// features/{domain}/context/ProjectContext.tsx
interface ProjectContextValue {
  projectId: string;
  title: string;
  completionStatus: CompletionStatus;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function useProjectContext(): ProjectContextValue {
  const context = useContext(ProjectContext);
  if (!context) throw new Error("useProjectContext must be used within ProjectProvider");
  return context;
}
```

**Rules**:
- Context is placed in `features/*/context/`
- Provider is set up in the feature's Layout
- Always provide a `useContext` wrapper hook (with null check)

---

## 7. UI State Management

### Local UI State

```ts
// Dialog open/close
const [isDialogOpen, setDialogOpen] = useState(false);

// Currently selected item
const [selectedId, setSelectedId] = useState<string | null>(null);
```

### Ref-Based Stabilization Pattern

Use `useRef` to exclude callback functions from dependency arrays.

```ts
// ✅ Hold callbacks in a Ref (prevents infinite loops)
const actionRef = useRef(action);
actionRef.current = action;

const execute = useCallback(async () => {
  await actionRef.current();
}, []); // Stable with empty dependency array
```

---

## 8. Best Practices

### DO (Recommended)

```ts
// ✅ Use Server Actions + useAsyncAction for mutation operations
const { execute, loading } = useAsyncAction({
  action: updateSettings,
  successMessage: t("saved"),
});

// ✅ Use useListData for paginated data fetching
const { data, refetch } = useListData({ fetcher: getItems, params });

// ✅ Fetch initial data in Server Component and pass via Props
export default async function Page() {
  const data = await getProjectData(id);
  return <ProjectClient initialData={data} />;
}
```

### DON'T (Not Recommended)

```ts
// ❌ Fetch directly within a component
useEffect(() => {
  fetch("/api/users").then(res => res.json()).then(setUsers);
}, []);

// ❌ Manage server data with a global state management library
const useStore = create((set) => ({
  users: [],
  fetchUsers: async () => { ... }, // Should use Server Actions
}));

// ❌ Manually manage loading state inside useEffect
const [loading, setLoading] = useState(false);
useEffect(() => {
  setLoading(true);
  action().finally(() => setLoading(false)); // Should use useAsyncAction
}, []);

// ❌ Include callbacks in dependency arrays causing infinite loops
const execute = useCallback(async () => {
  await action(); // Infinite loop if action is recreated on every render
}, [action]);
```

---

## 9. Summary

| State Type | Management Method | Location |
|-----------|-------------------|----------|
| Server data (initial display) | RSC direct fetch | `page.tsx` (Server Component) |
| Server data (lists) | `useListData` + Server Actions | `src/hooks/` |
| Data mutation operations | `useAsyncAction` + Server Actions | `src/hooks/` |
| Table state | `useTableState` | `src/hooks/` |
| Filter state | `useFilterState` | `src/hooks/` |
| Shared state within a feature | React Context | `features/*/context/` |
| Local UI state | `useState` / `useReducer` | Within component |

---
# ui.md (frameworks/nextjs/)
---

# UI Guidelines

> **[Replaceable]** This guide uses **Tailwind CSS + shadcn/ui (Radix UI)**. If your project uses **MUI**, **Mantine**, **Ant Design**, or other component libraries, replace the styling and component patterns accordingly. The principles (design tokens as SSOT, accessibility, component hierarchy) remain the same.

## Core Principles
- **Tailwind CSS** is adopted as a low-level utility layer
- **shadcn/ui** is used as the base for UI components (accessibility-ready, built on Radix UI)
- Leverage unified UI tokens (colors, spacing, typography)
- Domain-specific custom components are placed in `features/{domain}/components`
- **SSOT (Single Source of Truth)** for design tokens: CSS Variables (`globals.css` / `theme.css`) serve as the single canonical definition for all design tokens (colors, spacing, typography). Both Tailwind CSS config and shadcn/ui reference these variables rather than defining their own values. This ensures that a color or spacing change in one place propagates everywhere, and enables runtime theme switching (e.g., dark mode) via CSS custom property overrides without rebuilding.

## Directory Structure Example
```

/src
  /styles/
    globals.css      // Tailwind global styles
    theme.css        // Color and typography extensions (SSOT)
  /components/ui/     // shadcn/ui standard components (no extensions or customizations allowed)
  /components/common/ // App-wide shared UI components (extension/customization layer)
  /features/{domain}/components/ // Domain-specific UI
```

## Tailwind CSS Usage Guidelines
- Define spacing/colors/shadows as CSS Variables, and have `tailwind.config.js` reference them
- Use Tailwind only for visual styling within components
- Handle complex UI by extending or wrapping shadcn/ui components
- **Anti-patterns**:
  - Excessively long Tailwind class lists → Organize with CVA
  - Defining colors and spacing inline inconsistently → Unify with CSS Variables
- **Clear Decision Criteria**:
  - "Complex UI" and "large full-screen UI" are judged by reusability and logic coupling, not line count or screen size
  - Reusability: Styles used in 2+ places should be extracted into CVA or wrapper components
  - Logic: Styles tightly coupled with JS/TS if/else or map should be componentized

## shadcn/ui Usage Guidelines
- `/components/ui` is the home for shadcn/ui standard components — **avoid breaking changes**
- Application-specific extensions should be wrapped in `/components/common` or `/features`
- Composite components are extracted to `/components/common`
- Domain-specific components are placed in `features/{domain}/components`

## CVA (class-variance-authority) Usage
- **Purpose**: Centrally manage styles for components with many variations
- **Example**:
```ts
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition",
  {
    variants: {
      variant: {
        default: "bg-primary text-white",
        ghost: "bg-transparent hover:bg-accent",
      },
      size: {
        sm: "h-8 px-2",
        md: "h-10 px-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);
```

## Dark Mode Support
* Use Tailwind's `dark:` prefix
* Use `next-themes` for shadcn/ui theme construction
* Define color schemes as CSS Variables in `globals.css` / `theme.css` (SSOT)

## Responsive Design
* Utilize Tailwind's `sm` through `2xl` breakpoints
* Consider PC display even for mobile-first components

## Accessibility (A11y)

* ARIA support based on Radix UI
* Color contrast conforming to **WCAG AA** — this means a minimum contrast ratio of 4.5:1 for normal text and 3:1 for large text (18px+ or 14px+ bold). Use tools like the Chrome DevTools color picker or axe-core to verify compliance. This is a legal requirement in many jurisdictions (ADA, EU Accessibility Act).

### Required aria Attribute Patterns

#### Badges and Notifications (Dynamic Content)

```tsx
// ❌ Screen readers cannot recognize this
<span className="badge">{count}</span>

// ✔ Add description with aria-label
<span
  className="badge"
  aria-label={`${count} unread notifications`}
>
  {count}
</span>

// ✔ Notify dynamic updates (aria-live)
<div aria-live="polite" aria-atomic="true">
  {status}
</div>
```

#### Progress Display

```tsx
// ❌ Progress status is not conveyed
<div className="progress">{percent}%</div>

// ✔ Add role and aria attributes
<div
  role="progressbar"
  aria-valuenow={percent}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label="Processing progress"
>
  {percent}%
</div>
```

#### Dialogs / Modals

```tsx
// ✔ Add label to close button
<Dialog>
  <DialogContent>
    <DialogClose aria-label="Close dialog" />
  </DialogContent>
</Dialog>

// ✔ Specify closeLabel in shadcn/ui Dialog
<DialogContent closeLabel="Close">
  ...
</DialogContent>
```

#### Image Slider / Carousel

```tsx
// ✔ Set current position and live region
<div
  role="region"
  aria-label="Image slider"
  aria-live="polite"
>
  <img
    src={images[currentIndex]}
    alt={`Image ${currentIndex + 1} / ${images.length}`}
  />
  <div aria-label={`Showing image ${currentIndex + 1} of ${images.length}`}>
    {/* Dot indicators */}
  </div>
</div>
```

### Accessibility Checklist

| Element | Required Action |
|---------|----------------|
| Icon button | aria-label or sr-only text |
| Badge / Counter | Explain meaning with aria-label |
| Dynamically updated content | aria-live="polite" |
| Progress bar | role="progressbar" + aria-value* |
| Dialog close button | aria-label or closeLabel |
| Image slider | aria-live + position information |
| Form error | aria-describedby + role="alert" |
| Loading | aria-busy + sr-only text |

### Automated Testing

```bash
# Static checking with eslint-plugin-jsx-a11y
npm install -D eslint-plugin-jsx-a11y

# Runtime checking with axe-core
npm install -D @axe-core/react
```

## Performance
* Tailwind automatically removes unused classes
* shadcn/ui is SSR-compatible and supports tree shaking
* Images use lazy loading via Next.js `<Image />`

---

## Common UI Component Patterns

### Loading / Skeleton (Shimmer Effect)

Placeholder display while content is loading:

```tsx
// components/common/Skeleton.tsx
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export function Skeleton({ className, variant = 'rectangular' }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-muted rounded",
        variant === 'circular' && "rounded-full",
        variant === 'text' && "h-4 rounded",
        className
      )}
    />
  );
}

// Usage example: Card skeleton
export function CardSkeleton() {
  return (
    <div className="p-4 border rounded-lg space-y-3">
      <Skeleton className="h-40 w-full" />           {/* Image */}
      <Skeleton variant="text" className="w-3/4" />  {/* Title */}
      <Skeleton variant="text" className="w-1/2" />  {/* Subtext */}
    </div>
  );
}

// Usage example: Table row skeleton
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-2">
          <Skeleton variant="text" />
        </td>
      ))}
    </tr>
  );
}
```

#### Shimmer Effect CSS Animation

```css
/* globals.css */
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    hsl(var(--muted)) 25%,
    hsl(var(--muted-foreground) / 0.1) 50%,
    hsl(var(--muted)) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

```tsx
// Skeleton with shimmer effect
<div className="skeleton-shimmer h-40 w-full rounded" />
```

### Image Upload / Loading

```tsx
// components/common/ImageUploader.tsx
interface ImageUploaderProps {
  onUpload: (file: File) => Promise<string>;
  currentImage?: string;
}

export function ImageUploader({ onUpload, currentImage }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage ?? null);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setPreview(URL.createObjectURL(file)); // Show preview

    try {
      const url = await onUpload(file);
      setPreview(url);
    } catch (error) {
      setPreview(currentImage ?? null);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative">
      {/* Preview area */}
      <div className="relative aspect-square border rounded-lg overflow-hidden">
        {preview ? (
          <Image src={preview} alt="Preview" fill className="object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full bg-muted">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          </div>
        )}

        {/* Loading overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="sr-only">Uploading...</span>
          </div>
        )}
      </div>

      {/* Upload button */}
      <input
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
        disabled={isUploading}
        className="absolute inset-0 opacity-0 cursor-pointer"
        aria-label="Upload image"
      />
    </div>
  );
}
```

#### Image Generation Loading Display

```tsx
// Image generation job status display
export function ImageGenerationStatus({ status, progress }: Props) {
  return (
    <div className="relative aspect-square border rounded-lg overflow-hidden">
      {/* Shimmer background */}
      <div className="absolute inset-0 skeleton-shimmer" />

      {/* Status display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">{status}</span>
        {progress !== undefined && (
          <div className="w-32">
            <Progress value={progress} aria-label={`${progress}% complete`} />
          </div>
        )}
      </div>
    </div>
  );
}
```

### Table Sorting

```tsx
// components/common/SortableTable.tsx
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

type SortDirection = 'asc' | 'desc' | null;

interface SortConfig {
  key: string;
  direction: SortDirection;
}

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  currentSort: SortConfig | null;
  onSort: (key: string) => void;
}

export function SortableHeader({
  label,
  sortKey,
  currentSort,
  onSort,
}: SortableHeaderProps) {
  const isActive = currentSort?.key === sortKey;
  const direction = isActive ? currentSort.direction : null;

  return (
    <th>
      <button
        onClick={() => onSort(sortKey)}
        className="flex items-center gap-1 hover:text-foreground"
        aria-label={`Sort by ${label}`}
      >
        {label}
        {direction === 'asc' ? (
          <ChevronUp className="h-4 w-4" aria-label="Ascending" />
        ) : direction === 'desc' ? (
          <ChevronDown className="h-4 w-4" aria-label="Descending" />
        ) : (
          <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
    </th>
  );
}

// Sort logic hooks
export function useTableSort<T>(
  data: T[],
  defaultSort?: SortConfig
) {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(defaultSort ?? null);

  const sortedData = useMemo(() => {
    if (!sortConfig?.key || !sortConfig.direction) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key as keyof T];
      const bVal = b[sortConfig.key as keyof T];

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev?.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      return null; // Reset on third click
    });
  };

  return { sortedData, sortConfig, handleSort };
}
```

### Pagination

```tsx
// components/common/Pagination.tsx
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;  // Number of pages to display before and after the current page
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
}: PaginationProps) {
  // Generate array of page numbers
  const pages = useMemo(() => {
    const range = (start: number, end: number) =>
      Array.from({ length: end - start + 1 }, (_, i) => start + i);

    const leftSibling = Math.max(currentPage - siblingCount, 1);
    const rightSibling = Math.min(currentPage + siblingCount, totalPages);

    const showLeftDots = leftSibling > 2;
    const showRightDots = rightSibling < totalPages - 1;

    if (!showLeftDots && showRightDots) {
      return [...range(1, 3 + siblingCount * 2), '...', totalPages];
    }
    if (showLeftDots && !showRightDots) {
      return [1, '...', ...range(totalPages - 2 - siblingCount * 2, totalPages)];
    }
    if (showLeftDots && showRightDots) {
      return [1, '...', ...range(leftSibling, rightSibling), '...', totalPages];
    }
    return range(1, totalPages);
  }, [currentPage, totalPages, siblingCount]);

  return (
    <nav aria-label="Pagination" className="flex items-center gap-1">
      {/* First page */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        aria-label="Go to first page"
      >
        <ChevronsLeft className="h-4 w-4" />
      </Button>

      {/* Previous page */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Go to previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Page numbers */}
      {pages.map((page, i) =>
        page === '...' ? (
          <span key={`dots-${i}`} className="px-2">...</span>
        ) : (
          <Button
            key={page}
            variant={currentPage === page ? 'default' : 'outline'}
            size="icon"
            onClick={() => onPageChange(page as number)}
            aria-label={`Go to page ${page}`}
            aria-current={currentPage === page ? 'page' : undefined}
          >
            {page}
          </Button>
        )
      )}

      {/* Next page */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Go to next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Last page */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        aria-label="Go to last page"
      >
        <ChevronsRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}
```

#### Pagination Hooks

```tsx
// hooks/usePagination.ts
interface UsePaginationOptions {
  totalItems: number;
  itemsPerPage: number;
  initialPage?: number;
}

export function usePagination({
  totalItems,
  itemsPerPage,
  initialPage = 1,
}: UsePaginationOptions) {
  const [currentPage, setCurrentPage] = useState(initialPage);

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  // Adjust when page change puts us out of data range
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalItems, currentPage, totalPages]);

  const paginate = <T,>(data: T[]): T[] => {
    return data.slice(startIndex, endIndex);
  };

  return {
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    setCurrentPage,
    paginate,
  };
}
```

### Confirmation Dialog

```tsx
// components/common/ConfirmDialog.tsx
interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void | Promise<void>;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
}: ConfirmDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className={variant === 'destructive' ? 'bg-destructive' : ''}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### Empty State

```tsx
// components/common/EmptyState.tsx
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && (
        <div className="mb-4 text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Usage example
<EmptyState
  icon={<FolderOpen className="h-12 w-12" />}
  title="No projects found"
  description="Create a new project to get started"
  action={{
    label: "Create Project",
    onClick: () => setCreateDialogOpen(true),
  }}
/>
```

### Error State

```tsx
// components/common/ErrorState.tsx
interface ErrorStateProps {
  /** Error title */
  title?: string;
  /** Error message */
  message: string;
  /** Detail information (e.g., displayed only in development environment) */
  details?: string;
  /** Retry action */
  onRetry?: () => void;
  /** Retry button label */
  retryLabel?: string;
  /** Icon (default: AlertCircle) */
  icon?: React.ReactNode;
  /** Variant */
  variant?: "default" | "destructive" | "warning";
}

export function ErrorState({
  title = "An error occurred",
  message,
  details,
  onRetry,
  retryLabel = "Retry",
  icon,
  variant = "destructive",
}: ErrorStateProps) {
  const IconComponent = icon || <AlertCircle className="h-12 w-12" />;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        variant === "destructive" && "text-destructive",
        variant === "warning" && "text-amber-600"
      )}
      role="alert"
    >
      <div className="mb-4">{IconComponent}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-md">{message}</p>
      {details && process.env.NODE_ENV === "development" && (
        <pre className="mt-2 text-xs bg-muted p-2 rounded max-w-lg overflow-auto">
          {details}
        </pre>
      )}
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" />
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

// Usage example
<ErrorState
  message="Failed to load data"
  onRetry={() => refetch()}
/>

// Network error
<ErrorState
  icon={<WifiOff className="h-12 w-12" />}
  title="Connection Error"
  message="Please check your internet connection"
  onRetry={() => location.reload()}
/>

// Permission error
<ErrorState
  icon={<ShieldX className="h-12 w-12" />}
  title="Access Denied"
  message="You do not have permission to view this page"
  variant="warning"
/>
```

### Loading Button

```tsx
// components/common/LoadingButton.tsx
import { Loader2 } from "lucide-react";
import { Button, ButtonProps } from "@/components/ui/button";

interface LoadingButtonProps extends ButtonProps {
  /** Whether it is loading */
  loading?: boolean;
  /** Text during loading (displays children if omitted) */
  loadingText?: string;
}

export function LoadingButton({
  children,
  loading = false,
  loadingText,
  disabled,
  ...props
}: LoadingButtonProps) {
  return (
    <Button disabled={loading || disabled} aria-busy={loading} {...props}>
      {loading && (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          <span className="sr-only">Processing</span>
        </>
      )}
      {loading && loadingText ? loadingText : children}
    </Button>
  );
}

// Usage example
<LoadingButton loading={isSubmitting} type="submit">
  Save
</LoadingButton>

// Change text during loading
<LoadingButton loading={isDeleting} loadingText="Deleting...">
  Delete
</LoadingButton>

// With variant
<LoadingButton
  loading={isProcessing}
  variant="destructive"
  onClick={handleDelete}
>
  Delete Permanently
</LoadingButton>
```

#### Loading Button Patterns

```tsx
// Submit button
<LoadingButton
  type="submit"
  loading={form.formState.isSubmitting}
  disabled={!form.formState.isValid}
>
  Submit
</LoadingButton>

// Confirm dialog action button
<AlertDialogAction asChild>
  <LoadingButton
    loading={isDeleting}
    variant="destructive"
    onClick={handleConfirm}
  >
    Delete
  </LoadingButton>
</AlertDialogAction>

// Button with icon
<LoadingButton loading={isSaving}>
  {!isSaving && <Save className="mr-2 h-4 w-4" />}
  Save
</LoadingButton>
```

### Inline Loading

```tsx
// Action button within a list
function ActionCell({ item }: { item: Item }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async () => {
    setIsLoading(true);
    try {
      await performAction(item.id);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleAction}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash className="h-4 w-4" />
      )}
      <span className="sr-only">{isLoading ? "Deleting" : "Delete"}</span>
    </Button>
  );
}
```

### Common UI Components List

| Component | Location | Purpose |
|-----------|----------|---------|
| Skeleton | /components/common | Loading placeholder |
| ImageUploader | /components/common | Image upload + preview |
| SortableTable | /components/common | Sortable table |
| Pagination | /components/common | Pagination |
| ConfirmDialog | /components/common | Confirmation dialog |
| EmptyState | /components/common | Empty state display |
| ErrorState | /components/common | Error state display |
| LoadingButton | /components/common | Button with loading state |
| LoadingOverlay | /components/common | Full-screen loading |
| CookieConsent | /components/common | Cookie consent banner |

### Cookie Consent Dialog (GDPR / Privacy Law Compliance)

```tsx
// components/common/CookieConsent.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type ConsentOptions = {
  necessary: boolean;     // Required cookies (always true)
  analytics: boolean;     // Analytics
  marketing: boolean;     // Marketing
  preferences: boolean;   // Preference storage
};

const CONSENT_KEY = "cookie-consent";
const CONSENT_VERSION = "1.0"; // Version change requires re-consent

export function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [options, setOptions] = useState<ConsentOptions>({
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: true,
  });

  useEffect(() => {
    // Check existing consent
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored) {
      const { version, options: savedOptions } = JSON.parse(stored);
      if (version === CONSENT_VERSION) {
        setOptions(savedOptions);
        return; // Already consented
      }
    }
    // Not consented or version changed
    setOpen(true);
  }, []);

  const saveConsent = (selectedOptions: ConsentOptions) => {
    localStorage.setItem(
      CONSENT_KEY,
      JSON.stringify({ version: CONSENT_VERSION, options: selectedOptions })
    );
    setOpen(false);

    // Enable scripts based on consent
    if (selectedOptions.analytics) {
      enableAnalytics();
    }
  };

  const acceptAll = () => {
    const allAccepted: ConsentOptions = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    setOptions(allAccepted);
    saveConsent(allAccepted);
  };

  const acceptSelected = () => {
    saveConsent(options);
  };

  const rejectOptional = () => {
    const onlyNecessary: ConsentOptions = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    };
    setOptions(onlyNecessary);
    saveConsent(onlyNecessary);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>About Cookie Usage</DialogTitle>
          <DialogDescription>
            This site uses cookies to improve our services.
            If you agree to the use of cookies, please click "Accept All".
          </DialogDescription>
        </DialogHeader>

        {showDetails && (
          <div className="space-y-4 py-4">
            {/* Required Cookies */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="necessary" className="font-medium">
                  Required Cookies
                </Label>
                <p className="text-sm text-muted-foreground">
                  Necessary for basic site functionality
                </p>
              </div>
              <Switch id="necessary" checked disabled aria-label="Required cookies (cannot be disabled)" />
            </div>

            {/* Analytics */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="analytics" className="font-medium">
                  Analytics
                </Label>
                <p className="text-sm text-muted-foreground">
                  Analyzes site usage patterns
                </p>
              </div>
              <Switch
                id="analytics"
                checked={options.analytics}
                onCheckedChange={(checked) =>
                  setOptions((prev) => ({ ...prev, analytics: checked }))
                }
                aria-label="Allow analytics cookies"
              />
            </div>

            {/* Marketing */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="marketing" className="font-medium">
                  Marketing
                </Label>
                <p className="text-sm text-muted-foreground">
                  Displays personalized advertisements
                </p>
              </div>
              <Switch
                id="marketing"
                checked={options.marketing}
                onCheckedChange={(checked) =>
                  setOptions((prev) => ({ ...prev, marketing: checked }))
                }
                aria-label="Allow marketing cookies"
              />
            </div>

            {/* Preference Storage */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="preferences" className="font-medium">
                  Preference Storage
                </Label>
                <p className="text-sm text-muted-foreground">
                  Remembers settings such as language and theme
                </p>
              </div>
              <Switch
                id="preferences"
                checked={options.preferences}
                onCheckedChange={(checked) =>
                  setOptions((prev) => ({ ...prev, preferences: checked }))
                }
                aria-label="Allow preference cookies"
              />
            </div>
          </div>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          {!showDetails && (
            <Button variant="outline" onClick={() => setShowDetails(true)}>
              Advanced Settings
            </Button>
          )}
          <Button variant="outline" onClick={rejectOptional}>
            Required Only
          </Button>
          {showDetails ? (
            <Button onClick={acceptSelected}>Save Selection</Button>
          ) : (
            <Button onClick={acceptAll}>Accept All</Button>
          )}
        </DialogFooter>

        {/* Privacy policy link */}
        <p className="text-xs text-center text-muted-foreground">
          For details, please see our
          <a href="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </a>
        </p>
      </DialogContent>
    </Dialog>
  );
}

// Enable analytics (e.g., Google Analytics)
function enableAnalytics() {
  // Dynamically insert GTM or GA script
  if (typeof window !== "undefined" && !window.gtag) {
    const script = document.createElement("script");
    script.src = `https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`;
    script.async = true;
    document.head.appendChild(script);
  }
}
```

#### Getting Cookie Consent State

```tsx
// lib/cookie-consent.ts
export function getCookieConsent(): ConsentOptions | null {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem("cookie-consent");
  if (!stored) return null;

  const { version, options } = JSON.parse(stored);
  if (version !== "1.0") return null;

  return options;
}

export function hasAnalyticsConsent(): boolean {
  const consent = getCookieConsent();
  return consent?.analytics ?? false;
}

// Usage example: Check before sending analytics
if (hasAnalyticsConsent()) {
  trackEvent("page_view", { path: pathname });
}
```

#### Placement in Layout

```tsx
// app/layout.tsx
import { CookieConsent } from "@/components/common/CookieConsent";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
```

---

## Anti-patterns
* Scattering shadcn/ui components → Centrally manage in `/components/ui`
* Building large full-screen UI with Tailwind alone → Use shadcn/ui or custom components for complex UI
* Creating UI directly in the domain layer → UI must always go in the components layer
* Making app-specific modifications to `/components/ui` → Breaking changes are prohibited

## Summary
* **Tailwind CSS** for unified low-level utilities
* **shadcn/ui** for establishing the UI component system
* **CVA** for managing style variations
* **CSS Variables as SSOT to centralize tokens**
* Achieves UI consistency, accessibility, and scalability together
