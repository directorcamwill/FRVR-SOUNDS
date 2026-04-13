"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface MissingItem {
  type: string;
  message: string;
  action_url: string;
}

interface HealthScore {
  overall_score: number;
  catalog_completeness: number;
  metadata_quality: number;
  deliverables_readiness: number;
  submission_activity: number;
  pipeline_health: number;
  missing_items: MissingItem[];
  recommendations: string[];
  created_at?: string;
}

function scoreColor(score: number) {
  if (score >= 70) return "text-emerald-400";
  if (score >= 40) return "text-amber-400";
  return "text-red-400";
}

function scoreBgColor(score: number) {
  if (score >= 70) return "bg-emerald-400";
  if (score >= 40) return "bg-amber-400";
  return "bg-red-400";
}

function scoreBorderColor(score: number) {
  if (score >= 70) return "border-emerald-400";
  if (score >= 40) return "border-amber-400";
  return "border-red-400";
}

const CATEGORIES = [
  { key: "catalog_completeness" as const, label: "Catalog Completeness", weight: "25%" },
  { key: "metadata_quality" as const, label: "Metadata Quality", weight: "25%" },
  { key: "deliverables_readiness" as const, label: "Deliverables Readiness", weight: "20%" },
  { key: "submission_activity" as const, label: "Submission Activity", weight: "15%" },
  { key: "pipeline_health" as const, label: "Pipeline Health", weight: "15%" },
];

export default function HealthPage() {
  const [health, setHealth] = useState<HealthScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/health");
      if (res.ok) {
        const data = await res.json();
        if (data?.overall_score !== undefined) setHealth(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch("/api/agents/health", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to refresh score");
      }
      const data = await res.json();
      if (data?.overall_score !== undefined) setHealth(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh");
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Health Score</h2>
          <p className="text-sm text-[#A3A3A3]">
            Your overall sync readiness and catalog health
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-1">
            <CardContent className="flex flex-col items-center py-8">
              <Skeleton className="size-28 rounded-full" />
              <Skeleton className="h-3 w-24 mt-4" />
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardContent className="py-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-2 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!health) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Health Score</h2>
            <p className="text-sm text-[#A3A3A3]">
              Your overall sync readiness and catalog health
            </p>
          </div>
          <Button onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? (
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="size-4 mr-2" />
            )}
            Calculate Score
          </Button>
        </div>
        {refreshing ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Loader2 className="size-10 text-[#E87420] animate-spin mb-4" />
              <h3 className="text-lg font-medium text-white mb-1">
                Calculating Health Score...
              </h3>
              <p className="text-sm text-[#A3A3A3]">
                Analyzing your catalog, metadata, and pipeline.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Activity className="size-12 text-[#333] mb-4" />
              <h3 className="text-lg font-medium text-white mb-1">
                Health score unavailable
              </h3>
              <p className="text-sm text-[#A3A3A3]">
                Click &quot;Calculate Score&quot; to analyze your sync readiness.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Health Score</h2>
          <p className="text-sm text-[#A3A3A3]">
            Your overall sync readiness and catalog health
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 className="size-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="size-4 mr-2" />
          )}
          Refresh Score
        </Button>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          {error}
        </div>
      )}

      {/* Score + Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Overall Score */}
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center py-8">
            <div
              className={cn(
                "flex items-center justify-center size-28 rounded-full border-4",
                scoreBorderColor(health.overall_score)
              )}
            >
              <span
                className={cn(
                  "text-4xl font-bold tabular-nums",
                  scoreColor(health.overall_score)
                )}
              >
                {health.overall_score}
              </span>
            </div>
            <p className="text-sm text-[#A3A3A3] mt-3">Overall Health Score</p>
            <p className="text-xs text-[#555] mt-1">
              {health.overall_score >= 70
                ? "Looking good! Keep it up."
                : health.overall_score >= 40
                  ? "Room for improvement."
                  : "Needs attention. Follow the recommendations below."}
            </p>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Score Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {CATEGORIES.map((cat) => {
              const val = health[cat.key];
              return (
                <div key={cat.key}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-[#A3A3A3]">
                      {cat.label}{" "}
                      <span className="text-[#555]">({cat.weight})</span>
                    </span>
                    <span
                      className={cn(
                        "font-medium tabular-nums",
                        scoreColor(val)
                      )}
                    >
                      {val}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#1A1A1A]">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        scoreBgColor(val)
                      )}
                      style={{ width: `${val}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Missing Items */}
      {health.missing_items?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="size-4 text-amber-400" />
              Issues to Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {health.missing_items.map((item, i) => (
                <Link
                  key={i}
                  href={item.action_url}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#111] hover:bg-[#1A1A1A] transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      {item.type}
                    </span>
                    <span className="text-sm text-[#A3A3A3]">
                      {item.message}
                    </span>
                  </div>
                  <ArrowRight className="size-4 text-[#555] group-hover:text-[#A3A3A3] shrink-0" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {health.recommendations?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {health.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-[#E87420] mt-0.5 shrink-0" />
                  <span className="text-[#A3A3A3]">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
