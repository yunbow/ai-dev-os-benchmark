import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { LoginSchema } from "@/features/auth/schema";
import { signJwt, COOKIE_NAME } from "@/lib/auth/jwt";
import { userStore } from "@/lib/auth/user-store";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7日

// タイミング攻撃対策: ユーザー不在時もハッシュ比較を実行するためのダミーハッシュ
const DUMMY_HASH = "$2b$10$abcdefghijklmnopqrstuvuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu";

export async function POST(request: Request) {
  // 1. JSON パース
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "リクエストボディが不正です" }, { status: 400 });
  }

  // 2. Zod バリデーション
  const result = LoginSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "入力値が正しくありません", details: result.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { email, password } = result.data;

  // 3. ユーザー検索
  const user = userStore.findByEmail(email);

  // 4. ユーザーが存在しない場合もダミーハッシュで比較を実行
  // → 応答時間を均一化し、タイミング攻撃によるユーザー列挙を防止 (security.md §3)
  const hashToCompare = user?.passwordHash ?? DUMMY_HASH;
  const passwordMatch = await bcrypt.compare(password, hashToCompare);

  if (!user || !passwordMatch) {
    // "ユーザーが存在しない" と "パスワードが違う" を区別しない汎用メッセージ
    return NextResponse.json(
      { error: "メールアドレスまたはパスワードが正しくありません" },
      { status: 401 }
    );
  }

  // 5. JWT 発行
  const token = await signJwt(user.id, user.email);

  // 6. httpOnly cookie にセット (security.md §2)
  const response = NextResponse.json({ success: true }, { status: 200 });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  return response;
}
