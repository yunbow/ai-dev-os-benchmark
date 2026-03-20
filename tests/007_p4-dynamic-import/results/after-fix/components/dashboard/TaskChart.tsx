"use client";

import { PieChart, Pie, Cell, Legend, Tooltip } from "recharts";

interface Task {
  id: string;
  status: "completed" | "overdue" | "pending";
}

const STATUS_COLORS: Record<string, string> = {
  completed: "#22c55e",
  pending: "#3b82f6",
  overdue: "#ef4444",
};

export default function TaskChart({ tasks }: { tasks: Task[] }) {
  const counts = tasks.reduce<Record<string, number>>((acc, task) => {
    acc[task.status] = (acc[task.status] ?? 0) + 1;
    return acc;
  }, {});

  const data = Object.entries(counts).map(([name, value]) => ({ name, value }));

  return (
    <PieChart width={400} height={300}>
      <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
        {data.map((entry) => (
          <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? "#8884d8"} />
        ))}
      </Pie>
      <Tooltip />
      <Legend />
    </PieChart>
  );
}
