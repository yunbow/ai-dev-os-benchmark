Please implement the following task management application based on the requirements below. Generate all necessary source files.

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
