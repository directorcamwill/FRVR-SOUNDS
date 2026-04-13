import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "default";
  className?: string;
}

export function ScoreBadge({ score, size = "default", className }: ScoreBadgeProps) {
  const colorClass =
    score >= 70
      ? "bg-emerald-500/20 text-emerald-400"
      : score >= 40
        ? "bg-amber-500/20 text-amber-400"
        : "bg-red-500/20 text-red-400";

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold tabular-nums",
        size === "sm" ? "h-5 min-w-5 px-1.5 text-xs" : "h-6 min-w-6 px-2 text-sm",
        colorClass,
        className
      )}
    >
      {score}
    </span>
  );
}
