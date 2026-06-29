import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Metric } from "@graphs/types";

export type MetricChartProps = {
  data: Metric[];
  label?: string;
  unit?: string;
  height?: number;
  /** CSS variable name (e.g. "chart-1") or any color string */
  colorVar?: string;
};

const formatTime = (ts: number) => {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
};

export function MetricChart({
  data,
  label = "metric",
  unit = "%",
  height = 280,
  colorVar = "--chart-1",
}: MetricChartProps) {
  const stroke = colorVar.startsWith("--")
    ? `var(${colorVar})`
    : colorVar;

  const points = data.map((m) => ({ ...m, time: formatTime(m.date) }));

  if (points.length === 0) {
    return (
      <div
        className="flex items-center justify-center border border-border bg-card text-muted-foreground"
        style={{ height }}
      >
        <span className="text-xs uppercase tracking-widest">
          waiting for sse...
        </span>
      </div>
    );
  }

  const last = points.at(-1)?.counter ?? 0;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-baseline justify-between border-b border-border px-4 py-2">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <span
          className="font-mono text-2xl font-bold"
          style={{ color: stroke }}
        >
          {last.toFixed(1)}
          <span className="ml-1 text-sm opacity-60">{unit}</span>
        </span>
      </div>

      <div className="flex-1 px-2 py-2">
        <ResponsiveContainer width="100%" height={height - 56}>
          <LineChart
            data={points}
            margin={{ top: 12, right: 16, left: 0, bottom: 4 }}
          >
            <CartesianGrid
              stroke="var(--border)"
              strokeDasharray="3 3"
              strokeOpacity={0.6}
            />
            <XAxis
              dataKey="time"
              stroke="var(--muted-foreground)"
              tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              minTickGap={32}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={false}
            />
            <YAxis
              stroke="var(--muted-foreground)"
              tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              domain={[0, 100]}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={false}
              width={32}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 0,
                color: "var(--popover-foreground)",
                fontFamily: "var(--font-mono)",
                fontSize: 12,
              }}
              labelStyle={{ color: "var(--primary)" }}
              formatter={(value: number) => [`${value.toFixed(2)} ${unit}`, label]}
            />
            <Line
              type="monotone"
              dataKey="counter"
              stroke={stroke}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}