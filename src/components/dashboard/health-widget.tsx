"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import Link from "next/link";

function scoreColor(score: number) {
  if (score >= 70) return "text-emerald-400";
  if (score >= 40) return "text-amber-400";
  return "text-red-400";
}

function scoreBorderColor(score: number) {
  if (score >= 70) return "border-emerald-400 shadow-emerald-400/20";
  if (score >= 40) return "border-amber-400 shadow-amber-400/20";
  return "border-red-400 shadow-red-400/20";
}

interface HealthData {
  overall_score: number;
  catalog_completeness?: number;
  metadata_quality?: number;
  deliverables_readiness?: number;
  submission_activity?: number;
  pipeline_health?: number;
}

export function HealthWidget({
  health,
  loading,
}: {
  health: HealthData | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <Card className="glass-card border-[#1A1A1A]">
        <CardHeader>
          <CardTitle>Health Score</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center py-4">
          <Skeleton className="size-20 rounded-full" />
          <Skeleton className="h-3 w-24 mt-3" />
        </CardContent>
      </Card>
    );
  }

  if (!health) {
    return (
      <Card className="glass-card border-[#1A1A1A]">
        <CardHeader>
          <CardTitle>Health Score</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#666]">
            Complete your profile to see your health score.
          </p>
        </CardContent>
      </Card>
    );
  }

  const categories = [
    { label: "Catalog", value: health.catalog_completeness ?? 0 },
    { label: "Metadata", value: health.metadata_quality ?? 0 },
    { label: "Deliverables", value: health.deliverables_readiness ?? 0 },
    { label: "Submissions", value: health.submission_activity ?? 0 },
    { label: "Pipeline", value: health.pipeline_health ?? 0 },
  ];

  return (
    <Card className="glass-card border-[#1A1A1A]">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Health Score</CardTitle>
        <Link
          href="/health"
          className="text-xs text-red-500 hover:text-red-400 transition-colors"
        >
          View Details
        </Link>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center mb-4">
          <div
            className={cn(
              "flex items-center justify-center size-20 rounded-full border-4 shadow-lg",
              scoreBorderColor(health.overall_score)
            )}
          >
            <span
              className={cn(
                "text-3xl font-bold tabular-nums",
                scoreColor(health.overall_score)
              )}
            >
              {health.overall_score}
            </span>
          </div>
          <p className="text-xs text-[#666] mt-2">Overall Score</p>
        </div>
        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat.label}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[#666]">{cat.label}</span>
                <span
                  className={cn(
                    "font-medium tabular-nums",
                    scoreColor(cat.value)
                  )}
                >
                  {cat.value}
                </span>
              </div>
              <div className="h-1 w-full rounded-full bg-[#1A1A1A]">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    cat.value >= 70
                      ? "bg-emerald-400"
                      : cat.value >= 40
                        ? "bg-amber-400"
                        : "bg-red-400"
                  )}
                  style={{ width: `${cat.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
