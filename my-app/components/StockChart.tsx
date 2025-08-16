"use client";
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export type Candle = { t: number; c: number };

function formatDate(ts: number) {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getFullYear().toString().slice(-2)}`;
}

export default function StockChart({ data }: { data: Candle[] }) {
  return (
    <div className="w-full h-40 sm:h-56">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="t"
            tickFormatter={formatDate}
            tick={{ fontSize: 10, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            domain={["auto", "auto"]}
            tick={{ fontSize: 10, fill: "#6b7280" }}
            width={36}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${Number(v).toFixed(0)}`}
          />
          <Tooltip
            formatter={(v: any) => [`$${Number(v).toFixed(2)}`, "Close"]}
            labelFormatter={(l) => `${formatDate(Number(l))}`}
            contentStyle={{ background: "#0b0f13", border: "1px solid #1f2937", color: "#e5e7eb" }}
          />
          <Line
            type="monotone"
            dataKey="c"
            stroke="#14b8a6"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
