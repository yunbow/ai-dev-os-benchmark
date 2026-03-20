# Minimal Guidelines (3 files — project-specific patterns only)


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

## MUST: Apply Rate Limiting to Auth Server Actions

MUST apply rate limiting to ALL Server Actions that handle authentication — not just API routes. Server Actions for `register`, `login`, `requestPasswordReset`, and `resetPassword` MUST check rate limits per IP before processing:

```ts
"use server";
export async function registerUser(formData: FormData): Promise<ActionResult> {
  // ✅ MUST: Rate limit before any auth processing
  const ip = (await headers()).get("x-forwarded-for") ?? "unknown";
  const { success } = await checkRateLimit(`auth:register:${ip}`, { maxRequests: 5, windowMs: 60_000 });
  if (!success) return { success: false, error: "Too many attempts. Try again later." };
  // ... rest of registration logic
}
```

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
# validation.md (common/)
---

# Validation Guidelines
This document outlines how to manage **Types** and **Validation** in a unified manner across large-scale Next.js applications, centered on Zod and Prisma.

---

# 1. Core Policy
* Build a structure where types naturally synchronize in the order **Zod → Prisma → TypeScript**.
* API schemas can be converted from **Zod → JSON Schema (for AI APIs, etc.)** for external sharing.
* MUST validate on BOTH client and server using the SAME Zod schema. Use `zodResolver` from `@hookform/resolvers/zod` for client-side form validation with react-hook-form. Never rely on server-side validation alone.

---

# 2. Business Logic Rules in Zod Schemas

Business logic rules that belong in Zod schemas (not just format validation):

* **Date range constraints**: MUST validate that future-facing dates (e.g., `dueDate`, `expiresAt`) are in the future using `.refine()`. MUST validate that `endDate` is after `startDate`
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

# 9. Dynamic Import for Heavy Components

SHOULD use `next/dynamic` for client components that are heavy, conditionally rendered, or below the fold:

```ts
import dynamic from "next/dynamic";
const RichTextEditor = dynamic(() => import("./RichTextEditor"), { ssr: false });
const CreateTaskDialog = dynamic(() => import("./CreateTaskDialog"));
const AnalyticsChart = dynamic(() => import("./AnalyticsChart"), { ssr: false });
```

Candidates: rich text editors, chart components (recharts, chart.js), modal/dialog content, any component with dependencies > 50KB.

# 10. Accessibility: Icon Buttons

MUST add `aria-label` to every `<Button>` without visible text. Every icon-only button, toggle, or close button MUST describe its action:

```tsx
<Button variant="ghost" size="icon" aria-label="Delete task">
  <TrashIcon />
</Button>
```

# 11. Guidelines Summary

- **Vertical slice structure is the default**
- **Business logic must always be contained within features**
- **Server Actions placement responsibilities are strictly enforced**
- **lib/ must never contain domain-specific logic** — `lib/` is for infrastructure utilities (auth config, DB client, formatting, encryption). Domain logic (e.g., "calculate project completion percentage") belongs in `features/*/services/` because it changes with business requirements and should be co-located with related UI and schemas
- **page.tsx serves only as a data pass-through to the UI**
