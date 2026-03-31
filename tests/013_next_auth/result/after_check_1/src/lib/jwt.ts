import { SignJWT, jwtVerify } from "jose";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export const JWT_EXPIRY = "1h";

export interface JWTPayload {
  sub: string;
  email: string;
}

export async function signJWT(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(secret);
}

export async function verifyJWT(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, secret);
  return payload as unknown as JWTPayload;
}
