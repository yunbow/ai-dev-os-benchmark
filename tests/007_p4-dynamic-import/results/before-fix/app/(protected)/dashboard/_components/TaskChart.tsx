"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface TaskChartProps {
  data: { status: string; count: number }[];
}

const COLORS: Record<string, string> = {
  todo: "#94a3b8",
  "in-progress": "#3b82f6",
  completed: "#22c55e",
  overdue: "#ef4444",
};

export default function TaskChart({ data }: TaskChartProps) {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-800">
        Task Distribution
      </h2>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="status"
            cx="50%"
            cy="50%"
            outerRadius={90}
            label
          >
            {data.map((entry) => (
              <Cell
                key={entry.status}
                fill={COLORS[entry.status] ?? "#cbd5e1"}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
