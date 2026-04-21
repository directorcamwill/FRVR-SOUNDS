"use client";

// Inline SVG bar chart for daily time-series. No chart library — keeps the
// admin console lightweight. Scales to the series max automatically.

interface DayPoint {
  date: string;
  count: number;
}

export function SparklineBar({
  data,
  label,
  accent = "#DC2626",
  height = 48,
}: {
  data: DayPoint[];
  label?: string;
  accent?: string;
  height?: number;
}) {
  if (data.length === 0)
    return <p className="text-[11px] text-[#666]">No data.</p>;

  const max = Math.max(1, ...data.map((d) => d.count));
  const total = data.reduce((acc, d) => acc + d.count, 0);
  const last = data[data.length - 1]?.count ?? 0;
  const gap = 2;
  const totalW = 100; // viewBox width in percent units
  const barW = (totalW - gap * (data.length - 1)) / data.length;

  return (
    <div className="space-y-1">
      {label && (
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-wider text-[#666]">
            {label}
          </p>
          <div className="flex items-center gap-2 text-[10px] text-[#A3A3A3] tabular-nums">
            <span>Total {total}</span>
            <span className="text-[#555]">·</span>
            <span>Today {last}</span>
          </div>
        </div>
      )}
      <svg
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
      >
        {data.map((d, i) => {
          const h = max === 0 ? 0 : (d.count / max) * (height - 2);
          const x = i * (barW + gap);
          const y = height - h;
          return (
            <rect
              key={d.date}
              x={x}
              y={y}
              width={barW}
              height={h || 1}
              fill={accent}
              opacity={d.count === 0 ? 0.2 : 1}
            >
              <title>
                {d.date} — {d.count}
              </title>
            </rect>
          );
        })}
      </svg>
      <div className="flex items-center justify-between text-[9px] text-[#555] tabular-nums">
        <span>{data[0]?.date.slice(5)}</span>
        <span>{data[data.length - 1]?.date.slice(5)}</span>
      </div>
    </div>
  );
}
