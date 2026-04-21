"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer,
  RadarChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  PolarRadiusAxis,
} from "recharts";
import { AlertCircle, ChevronRight, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReviewQueueResponse } from "@/app/api/review-queue/route";

/**
 * HealthReviewPanel — UPGRADE_SPEC [07]. Split card.
 *   Top: Radar chart of the 5 health sub-metrics (overall shown as center label).
 *   Bottom: Human-review queue list — only rendered when non-empty.
 *
 * Replaces the v1 <HealthWidget> in the Command Center v2.
 */

interface HealthData {
  overall_score: number;
  catalog_completeness?: number;
  metadata_quality?: number;
  deliverables_readiness?: number;
  submission_activity?: number;
  pipeline_health?: number;
}

interface HealthReviewPanelProps {
  health: HealthData | null;
  healthLoading: boolean;
  review: ReviewQueueResponse | null;
  reviewLoading: boolean;
}

function overallTone(score: number): {
  text: string;
  border: string;
  bg: string;
} {
  if (score >= 70)
    return {
      text: "text-emerald-400",
      border: "border-emerald-400",
      bg: "bg-emerald-400",
    };
  if (score >= 40)
    return {
      text: "text-amber-400",
      border: "border-amber-400",
      bg: "bg-amber-400",
    };
  return { text: "text-red-400", border: "border-red-400", bg: "bg-red-400" };
}

export function HealthReviewPanel({
  health,
  healthLoading,
  review,
  reviewLoading,
}: HealthReviewPanelProps) {
  const reviewCount = review?.count ?? 0;

  return (
    <Card className="glass-card border-[#1A1A1A] h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Activity className="size-4 text-red-500" />
          Health
          {reviewCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.15em] text-red-300">
              · <AlertCircle className="size-3" /> {reviewCount} to review
            </span>
          )}
        </CardTitle>
        <Link
          href="/health"
          className="text-xs text-red-500 hover:text-red-400 transition-colors"
        >
          View details
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {healthLoading ? (
          <Skeleton className="h-[180px] w-full rounded-md" />
        ) : !health ? (
          <p className="text-sm text-[#666]">
            Complete your profile to see your health score.
          </p>
        ) : (
          <HealthRadar health={health} />
        )}

        {!reviewLoading && reviewCount > 0 && review && (
          <ReviewList items={review.items} />
        )}
      </CardContent>
    </Card>
  );
}

function HealthRadar({ health }: { health: HealthData }) {
  const overall = health.overall_score;
  const tone = overallTone(overall);

  const data = [
    { axis: "Catalog", value: health.catalog_completeness ?? 0 },
    { axis: "Metadata", value: health.metadata_quality ?? 0 },
    { axis: "Deliver.", value: health.deliverables_readiness ?? 0 },
    { axis: "Submit", value: health.submission_activity ?? 0 },
    { axis: "Pipeline", value: health.pipeline_health ?? 0 },
  ];

  return (
    <div className="relative">
      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} margin={{ top: 8, right: 20, bottom: 8, left: 20 }}>
            <PolarGrid stroke="#1A1A1A" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{
                fill: "#8892a4",
                fontSize: 10,
                fontFamily: "var(--font-mono)",
              }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={false}
              axisLine={false}
            />
            <Radar
              dataKey="value"
              stroke="#dc2626"
              strokeWidth={1.5}
              fill="#dc2626"
              fillOpacity={0.18}
              isAnimationActive
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Overall score badge */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className={cn(
            "flex flex-col items-center justify-center rounded-full border-2 size-14 backdrop-blur-sm bg-black/40",
            tone.border
          )}
        >
          <span
            className={cn(
              "text-xl font-bold tabular-nums leading-none",
              tone.text
            )}
          >
            {overall}
          </span>
          <span className="text-[8px] uppercase tracking-[0.15em] text-[#8892a4] mt-0.5">
            overall
          </span>
        </div>
      </div>
    </div>
  );
}

function ReviewList({
  items,
}: {
  items: ReviewQueueResponse["items"];
}) {
  return (
    <div className="pt-3 border-t border-[#1A1A1A] space-y-2">
      <p className="text-[10px] font-medium uppercase tracking-wider text-red-300">
        Human review queue
      </p>
      <div className="space-y-1.5">
        {items.slice(0, 3).map((item) => {
          const tone =
            item.severity === "urgent"
              ? "text-red-300"
              : "text-amber-300";
          const href = item.action_url || "/command-center";
          return (
            <Link
              key={item.id}
              href={href}
              className="flex items-start justify-between gap-2 py-1.5 px-2 -mx-2 rounded hover:bg-white/[0.03] transition-colors group"
            >
              <div className="flex items-start gap-2 min-w-0">
                <AlertCircle
                  className={cn("size-3.5 shrink-0 mt-0.5", tone)}
                />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white truncate group-hover:text-red-400 transition-colors">
                    {item.title}
                  </p>
                  {item.message && (
                    <p className="text-[11px] text-[#A3A3A3] line-clamp-1">
                      {item.message}
                    </p>
                  )}
                </div>
              </div>
              <ChevronRight className="size-3.5 text-[#555] group-hover:text-red-400 transition-colors mt-0.5" />
            </Link>
          );
        })}
        {items.length > 3 && (
          <p className="text-[10px] text-[#555] uppercase tracking-wider pt-1">
            +{items.length - 3} more in queue
          </p>
        )}
      </div>
    </div>
  );
}
