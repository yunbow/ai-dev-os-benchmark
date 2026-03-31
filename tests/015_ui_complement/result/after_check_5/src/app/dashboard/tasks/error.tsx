"use client";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function TasksError({ error, reset }: Props) {
  return (
    <main style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem 1rem" }}>
      <div
        style={{
          background: "#fef2f2",
          border: "1px solid #fecaca",
          borderRadius: "0.5rem",
          padding: "1.5rem",
          textAlign: "center",
        }}
      >
        <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#dc2626", marginBottom: "0.5rem" }}>
          エラーが発生しました
        </h2>
        <p style={{ color: "#6b7280", marginBottom: "1rem", fontSize: "0.9rem" }}>
          タスクの読み込みに失敗しました。もう一度お試しください。
        </p>
        <button
          onClick={reset}
          style={{
            padding: "0.5rem 1.25rem",
            background: "#dc2626",
            color: "#fff",
            border: "none",
            borderRadius: "0.375rem",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          再試行
        </button>
      </div>
    </main>
  );
}
