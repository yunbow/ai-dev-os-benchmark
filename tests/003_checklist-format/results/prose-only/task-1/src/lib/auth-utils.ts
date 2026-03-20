import bcrypt from "bcryptjs";

/**
 * Verify a plaintext password against a bcrypt hash.
 * Uses bcryptjs (MIT licensed — complies with OSS license policy, Section 3.9).
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Hash a password for storage.
 * Cost factor 12 balances security and performance.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}
