import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tasks App",
  description: "タスク管理アプリ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-gray-50 antialiased">{children}</body>
    </html>
  );
}
