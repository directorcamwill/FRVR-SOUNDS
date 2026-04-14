"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { ScoreRadarChart } from "./score-radar-chart";
import { Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SyncScore } from "@/types/song";

interface SyncScoreDisplayProps {
  songId: string;
  score: SyncScore | null;
  onScored: () => void;
}

const DIMENSIONS = [
  { key: "arrangement_score" as const, label: "Arrangement", weight: "25%" },
  { key: "production_score" as const, label: "Production", weight: "15%" },
  { key: "mix_score" as const, label: "Mix", weight: "15%" },
  { key: "usability_score" as const, label: "Usability", weight: "20%" },
  { key: "market_fit_score" as const, label: "Market Fit", weight: "15%" },
  { key: "brand_safety_score" as const, label: "Brand Safety", weight: "5%" },
  { key: "deliverables_score" as const, label: "Deliverables", weight: "5%" },
];

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

export function SyncScoreDisplay({ songId, score, onScored }: SyncScoreDisplayProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScore = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/songs/${songId}/sync-score`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Scoring failed");
      }
      onScored();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scoring failed");
    } finally {
      setLoading(false);
    }
  };

  if (!score && !loading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Sparkles className="size-12 text-[#333] mb-4" />
          <h3 className="text-lg font-medium text-white mb-1">
            No Sync Score Yet
          </h3>
          <p className="text-sm text-[#A3A3A3] mb-4 text-center max-w-sm">
            Run the AI sync scoring engine to evaluate this track across 7
            dimensions of sync licensing readiness.
          </p>
          {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
          <Button onClick={handleScore}>
            <Sparkles className="size-4 mr-2" />
            Score My Track
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="size-10 text-[#DC2626] animate-spin mb-4" />
          <h3 className="text-lg font-medium text-white mb-1">
            Analyzing Track...
          </h3>
          <p className="text-sm text-[#A3A3A3]">
            Our AI is evaluating your song for sync placement readiness.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!score) return null;

  return (
    <div className="space-y-4">
      {/* Overall Score */}
      <Card>
        <CardContent className="flex flex-col items-center py-6">
          <div
            className={cn(
              "flex items-center justify-center size-24 rounded-full border-4 mb-3",
              score.overall_score >= 70
                ? "border-emerald-400"
                : score.overall_score >= 40
                  ? "border-amber-400"
                  : "border-red-400"
            )}
          >
            <span
              className={cn(
                "text-3xl font-bold tabular-nums",
                scoreColor(score.overall_score)
              )}
            >
              {score.overall_score}
            </span>
          </div>
          <p className="text-sm text-[#A3A3A3]">Overall Sync Score</p>
        </CardContent>
      </Card>

      {/* Radar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Score Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <ScoreRadarChart score={score} />
        </CardContent>
      </Card>

      {/* Dimension Bars */}
      <Card>
        <CardHeader>
          <CardTitle>Dimensions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {DIMENSIONS.map((dim) => {
            const val = score[dim.key];
            return (
              <div key={dim.key}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-[#A3A3A3]">
                    {dim.label}{" "}
                    <span className="text-[#555]">({dim.weight})</span>
                  </span>
                  <span className={cn("font-medium tabular-nums", scoreColor(val))}>
                    {val}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[#1A1A1A]">
                  <div
                    className={cn("h-full rounded-full transition-all", scoreBgColor(val))}
                    style={{ width: `${val}%` }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* AI Analysis */}
      {score.ai_analysis && (
        <Card>
          <CardHeader>
            <CardTitle>AI Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[#A3A3A3] whitespace-pre-line leading-relaxed">
              {score.ai_analysis}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {score.ai_recommendations?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {score.ai_recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-[#DC2626] mt-0.5 shrink-0" />
                  <span className="text-[#A3A3A3]">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Re-score button */}
      <Button
        variant="outline"
        className="w-full"
        onClick={handleScore}
        disabled={loading}
      >
        <Sparkles className="size-4 mr-2" />
        Re-Score Track
      </Button>

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
