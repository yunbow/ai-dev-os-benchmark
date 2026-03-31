import { SignJWT, jwtVerify } from "jose";
import type { JwtPayload } from "@/features/auth/types";

const rawSecret = process.env.ACCESS_TOKEN_SECRET;
if (!rawSecret) {
  throw new Error("ACCESS_TOKEN_SECRET environment variable is required");
}
const secret = new TextEncoder().encode(rawSecret);

const EXPIRES_IN = "1h";

export async function signToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EXPIRES_IN)
    .sign(secret);
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}
