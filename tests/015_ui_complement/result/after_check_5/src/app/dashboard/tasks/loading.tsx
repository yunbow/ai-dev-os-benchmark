export default function TasksLoading() {
  const skeletonRow = (key: number) => (
    <tr key={key} style={{ borderBottom: "1px solid #e5e7eb" }}>
      {[200, 300, 80, 120].map((width, i) => (
        <td key={i} style={{ padding: "0.75rem 1rem" }}>
          <div
            style={{
              height: "1rem",
              width: `${width}px`,
              background: "#e5e7eb",
              borderRadius: "0.25rem",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
        </td>
      ))}
    </tr>
  );

  return (
    <main style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem 1rem" }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
      <div style={{ height: "2rem", width: "8rem", background: "#e5e7eb", borderRadius: "0.25rem", marginBottom: "2rem", animation: "pulse 1.5s ease-in-out infinite" }} />
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
            {["タイトル", "説明", "ステータス", "作成日時"].map((h) => (
              <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", color: "#374151" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{[1, 2, 3].map(skeletonRow)}</tbody>
      </table>
    </main>
  );
}
