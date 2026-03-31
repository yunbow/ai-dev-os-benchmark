import { z } from "zod";

// パスワードルールは一箇所で定義 (login / register で共有)
const passwordSchema = z
  .string()
  .min(8, "パスワードは8文字以上で入力してください")
  .max(128, "パスワードは128文字以内で入力してください");

export const LoginSchema = z.object({
  email: z.string().email("メールアドレスの形式が正しくありません"),
  password: passwordSchema,
});

export const RegisterSchema = z
  .object({
    email: z.string().email("メールアドレスの形式が正しくありません"),
    name: z.string().min(1, "名前は必須です").max(100),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "パスワードが一致しません",
    path: ["confirmPassword"],
  });

// z.infer<> で型を導出 — 別途 type 定義は不要
export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
