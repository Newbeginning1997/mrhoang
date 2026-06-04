"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

export function ScoreLineChart({
  data
}: {
  data: Array<{ label: string; score: number }>;
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 16, bottom: 10, left: 0 }}>
          <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64716D" }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 10]} tick={{ fontSize: 12, fill: "#64716D" }} axisLine={false} tickLine={false} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#15745F"
            strokeWidth={3}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ClassAverageChart({
  data
}: {
  data: Array<{ label: string; average: number }>;
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 16, bottom: 10, left: 0 }}>
          <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64716D" }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 10]} tick={{ fontSize: 12, fill: "#64716D" }} axisLine={false} tickLine={false} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="average"
            stroke="#2563EB"
            strokeWidth={3}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DistributionChart({
  data
}: {
  data: Array<{ label: string; count: number }>;
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 16, bottom: 10, left: 0 }}>
          <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64716D" }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64716D" }} axisLine={false} tickLine={false} />
          <Tooltip />
          <Bar dataKey="count" fill="#D97706" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PerformanceBandPieChart({
  data
}: {
  data: Array<{ name: string; value: number; color: string }>;
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <Tooltip />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={58}
            outerRadius={92}
            paddingAngle={4}
            stroke="#FFFFFF"
            strokeWidth={3}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Legend
            iconType="circle"
            wrapperStyle={{ color: "#64716D", fontSize: 12, lineHeight: "18px" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
