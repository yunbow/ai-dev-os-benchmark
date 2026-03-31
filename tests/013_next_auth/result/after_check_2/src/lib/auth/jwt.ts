import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const secret = process.env.JWT_SECRET;
if (!secret) throw new Error("JWT_SECRET environment variable is not set");
const JWT_SECRET = new TextEncoder().encode(secret);

const EXPIRES_IN = "7d";

export interface AuthPayload extends JWTPayload {
  userId: string;
  email: string;
}

export async function signToken(payload: Omit<AuthPayload, keyof JWTPayload>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EXPIRES_IN)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as AuthPayload;
  } catch {
    return null;
  }
}
