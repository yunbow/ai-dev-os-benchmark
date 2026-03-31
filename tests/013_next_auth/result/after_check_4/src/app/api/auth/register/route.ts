import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { RegisterSchema } from "@/features/auth/schema";
import { signJwt, COOKIE_NAME } from "@/lib/auth/jwt";
import { userStore } from "@/lib/auth/user-store";

const BCRYPT_ROUNDS = 10;
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7日

export async function POST(request: Request) {
  // 1. JSON パース
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "リクエストボディが不正です" }, { status: 400 });
  }

  // 2. Zod バリデーション (server-side)
  const result = RegisterSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "入力値が正しくありません", details: result.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { email, name, password } = result.data;

  // 3. メール重複チェック (サービス層 — Zod の責務外)
  // 汎用メッセージでユーザー列挙攻撃を防止 (security.md §3)
  const existing = userStore.findByEmail(email);
  if (existing) {
    return NextResponse.json(
      { error: "登録に失敗しました。入力内容をご確認ください。" },
      { status: 409 }
    );
  }

  // 4. パスワードハッシュ化
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // 5. ユーザー作成
  const userId = crypto.randomUUID();
  userStore.create({ id: userId, email, name, passwordHash });

  // 6. JWT 発行
  const token = await signJwt(userId, email);

  // 7. httpOnly cookie にセット (security.md §2)
  const response = NextResponse.json({ success: true }, { status: 201 });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  return response;
}
