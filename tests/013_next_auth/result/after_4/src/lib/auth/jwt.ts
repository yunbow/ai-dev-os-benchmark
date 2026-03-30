import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "CHANGE_ME_in_production_min_32_chars_long!!"
);

const ALGORITHM = "HS256";
const EXPIRY = "7d";

export const COOKIE_NAME = "auth-token";

export interface JwtPayload extends JWTPayload {
  sub: string; // userId — canonical identity claim (IDOR 対策)
  email: string;
}

/** JWT を発行する。API routes (Node.js) から呼ぶ */
export async function signJwt(userId: string, email: string): Promise<string> {
  return new SignJWT({ email } satisfies Omit<JwtPayload, keyof JWTPayload>)
    .setProtectedHeader({ alg: ALGORITHM })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(JWT_SECRET);
}

/**
 * JWT を検証してペイロードを返す。
 * 失敗 (期限切れ・改ざん・不正形式) は null を返す。
 * Edge Runtime 対応 (jose は Web Crypto API を使用)。
 */
export async function verifyJwt(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: [ALGORITHM],
    });
    return payload as JwtPayload;
  } catch {
    return null;
  }
}
