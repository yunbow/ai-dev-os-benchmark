// ActionErrors constants - never expose internal error details
export const ActionErrors = {
  // Auth errors
  UNAUTHORIZED: { code: "UNAUTHORIZED", message: "You must be logged in to perform this action" },
  FORBIDDEN: { code: "FORBIDDEN", message: "You do not have permission to perform this action" },
  INVALID_CREDENTIALS: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" },
  EMAIL_TAKEN: { code: "EMAIL_TAKEN", message: "An account with this email already exists" },
  INVALID_TOKEN: { code: "INVALID_TOKEN", message: "Invalid or expired token" },
  TOKEN_EXPIRED: { code: "TOKEN_EXPIRED", message: "This token has expired" },
  TOKEN_USED: { code: "TOKEN_USED", message: "This token has already been used" },
  ACCOUNT_LOCKED: { code: "ACCOUNT_LOCKED", message: "Account temporarily locked due to too many failed attempts" },

  // Resource errors
  NOT_FOUND: { code: "NOT_FOUND", message: "The requested resource was not found" },
  TASK_NOT_FOUND: { code: "TASK_NOT_FOUND", message: "Task not found" },
  CATEGORY_NOT_FOUND: { code: "CATEGORY_NOT_FOUND", message: "Category not found" },
  TEAM_NOT_FOUND: { code: "TEAM_NOT_FOUND", message: "Team not found" },
  USER_NOT_FOUND: { code: "USER_NOT_FOUND", message: "User not found" },

  // Ownership errors
  TASK_ACCESS_DENIED: { code: "TASK_ACCESS_DENIED", message: "You do not have access to this task" },
  TEAM_ACCESS_DENIED: { code: "TEAM_ACCESS_DENIED", message: "You do not have access to this team" },
  CATEGORY_ACCESS_DENIED: { code: "CATEGORY_ACCESS_DENIED", message: "You do not have access to this category" },

  // Validation errors
  VALIDATION_ERROR: { code: "VALIDATION_ERROR", message: "Invalid input data" },
  INVALID_STATUS: { code: "INVALID_STATUS", message: "Invalid task status" },
  INVALID_PRIORITY: { code: "INVALID_PRIORITY", message: "Invalid task priority" },
  INVALID_COLOR: { code: "INVALID_COLOR", message: "Invalid color format. Use #RRGGBB" },

  // Rate limiting
  RATE_LIMITED: { code: "RATE_LIMITED", message: "Too many requests. Please try again later" },

  // Concurrency
  CONFLICT: { code: "CONFLICT", message: "The resource was modified by another request" },

  // Team errors
  ALREADY_MEMBER: { code: "ALREADY_MEMBER", message: "User is already a member of this team" },
  INVITATION_PENDING: { code: "INVITATION_PENDING", message: "An invitation is already pending for this email" },
  CANNOT_REMOVE_OWNER: { code: "CANNOT_REMOVE_OWNER", message: "Cannot remove the team owner" },

  // Server errors
  INTERNAL_ERROR: { code: "INTERNAL_ERROR", message: "An internal error occurred. Please try again" },
  DATABASE_ERROR: { code: "DATABASE_ERROR", message: "A database error occurred. Please try again" },
  EMAIL_ERROR: { code: "EMAIL_ERROR", message: "Failed to send email. Please try again" },
} as const;

export type ActionErrorCode = keyof typeof ActionErrors;
