import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/features/auth/schema";
import { createUser } from "@/features/auth/services/user-store";

// TODO: レート制限を追加すること（security.md: auth エンドポイントは 10req/min）
// 例: Vercel Edge Middleware またはアプリケーションレベルの rate limiter を使用

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "リクエストボディが不正です" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "入力値が不正です", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { email, password } = parsed.data;

  try {
    const user = await createUser(email, password);
    return NextResponse.json({ userId: user.id }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "登録に失敗しました";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
