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

# Curated Guidelines (Condition C)

> 10 files selected by AI Dev OS Two-Tier Strategy


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
