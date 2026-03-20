// Server Component — pure data display, no interactivity needed
interface Stats {
  total: number;
  completed: number;
  overdue: number;
}

export function StatsCards({ stats }: { stats: Stats }) {
  const cards = [
    { label: "Total Tasks", value: stats.total },
    { label: "Completed", value: stats.completed },
    { label: "Overdue", value: stats.overdue },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg border p-4 bg-card">
          <p className="text-sm text-muted-foreground">{card.label}</p>
          <p className="text-3xl font-bold mt-1">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
