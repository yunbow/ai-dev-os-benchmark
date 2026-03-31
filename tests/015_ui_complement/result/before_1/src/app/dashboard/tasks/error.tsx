"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main style={{ padding: "2rem" }}>
      <p style={{ color: "red" }}>エラーが発生しました: {error.message}</p>
      <button onClick={reset}>再試行</button>
    </main>
  );
}
