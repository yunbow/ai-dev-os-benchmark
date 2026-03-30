// In-memory user store (replace with a real DB in production)
type User = { id: string; email: string; passwordHash: string };

const users: User[] = [];

export async function findUserByEmail(email: string): Promise<User | undefined> {
  return users.find((u) => u.email === email);
}

export async function createUser(email: string, passwordHash: string): Promise<User> {
  const user: User = { id: crypto.randomUUID(), email, passwordHash };
  users.push(user);
  return user;
}

// Simple password hashing using Web Crypto (SHA-256 + salt)
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomUUID();
  const encoded = new TextEncoder().encode(salt + password);
  const hash = await crypto.subtle.digest("SHA-256", encoded);
  const hex = Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${salt}:${hex}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, storedHash] = stored.split(":");
  const encoded = new TextEncoder().encode(salt + password);
  const hash = await crypto.subtle.digest("SHA-256", encoded);
  const hex = Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hex === storedHash;
}
