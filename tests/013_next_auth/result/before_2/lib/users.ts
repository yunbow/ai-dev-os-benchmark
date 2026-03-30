export type User = { id: string; email: string; password: string };

// In-memory store shared across API routes within the same process
export const users: User[] = [];
