import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tasks App",
  description: "AI Dev OS タスク管理デモ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#fff", color: "#111827" }}>
        {children}
      </body>
    </html>
  );
}
