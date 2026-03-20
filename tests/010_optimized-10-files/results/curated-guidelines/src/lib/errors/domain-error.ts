export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = "Authentication required") {
    super("UNAUTHORIZED", message);
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = "You do not have permission to perform this action") {
    super("FORBIDDEN", message);
  }
}

export class NotFoundError extends DomainError {
  constructor(entity = "Resource") {
    super("NOT_FOUND", `${entity} not found`);
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super("CONFLICT", message);
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super("VALIDATION_ERROR", message);
  }
}

export class RateLimitError extends DomainError {
  constructor(message = "Too many requests. Please try again later.") {
    super("RATE_LIMIT_EXCEEDED", message);
  }
}
