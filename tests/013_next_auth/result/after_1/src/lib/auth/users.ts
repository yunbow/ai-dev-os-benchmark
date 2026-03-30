// TODO: Replace with Prisma + DB in production
import { randomUUID } from "crypto";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
}

const users = new Map<string, User>();

export function findUserByEmail(email: string): User | undefined {
  return [...users.values()].find((u) => u.email === email);
}

export function createUser(email: string, passwordHash: string): User {
  const user: User = { id: randomUUID(), email, passwordHash };
  users.set(user.id, user);
  return user;
}
