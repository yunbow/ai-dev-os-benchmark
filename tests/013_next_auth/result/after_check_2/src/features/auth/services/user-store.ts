import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

// NOTE: インメモリストアはデモ用途のみ。本番環境ではPrisma等のDBに差し替えること。
export interface User {
  id: string;
  email: string;
  hashedPassword: string;
}

const users = new Map<string, User>();

export async function createUser(email: string, password: string): Promise<User> {
  if (users.has(email)) {
    throw new Error("このメールアドレスは既に登録されています");
  }
  const hashedPassword = await bcrypt.hash(password, 12);
  const user: User = { id: randomUUID(), email, hashedPassword };
  users.set(email, user);
  return user;
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  return users.get(email);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
