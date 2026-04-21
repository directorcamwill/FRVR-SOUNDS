"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Target } from "lucide-react";
import { toast } from "sonner";
import type { GuidedRecsOutput, GuidedRecommendation } from "@/lib/agents/guided-recs";

type Output = GuidedRecsOutput;

const priorityStyles: Record<string, string> = {
  high: "bg-red-500/10 text-red-400 border-red-500/30",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
};

const axisLabels: Record<string, string> = {
  metadata: "Metadata",
  arrangement: "Arrangement",
  mix: "Mix",
  deliverables: "Deliverables",
  pitch_positioning: "Pitch",
};

export function GuidedRecsPanel({
  songId,
  initial,
  initialAt,
}: {
  songId: string;
  initial?: Output | null;
  initialAt?: string | null;
}) {
  const [output, setOutput] = useState<Output | null>(initial ?? null);
  const [lastAt, setLastAt] = useState<string | null>(initialAt ?? null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/agents/guided-recs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ song_id: songId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Guided Recs failed");
      setOutput(data.output);
      setLastAt(data.output.generated_at);
      toast.success(
        `${data.output.recommendations.length} recommendations generated`
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Guided Recs failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="py-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Target className="size-4 text-[#DC2626]" />
            Guided Recommendations
          </h3>
          <Button
            size="sm"
            variant={output ? "outline" : "default"}
            onClick={run}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="size-3 animate-spin" />
            ) : output ? (
              <>
                <RefreshCw className="size-3 mr-1" />
                Re-run
              </>
            ) : (
              "Generate"
            )}
          </Button>
        </div>

        {!output && (
          <p className="text-[11px] text-[#A3A3A3] leading-relaxed">
            Run the Sync Strategist — reads your song&apos;s metadata, finds
            its closest real placements, and emits a prioritized action plan
            to close the gap.
          </p>
        )}

        {output && (
          <>
            {output.summary && (
              <div className="rounded-lg border border-[#1A1A1A] bg-[#0B0B0B] p-3">
                <p className="text-[10px] uppercase tracking-wider text-[#666] mb-1">
                  Summary
                </p>
                <p className="text-xs text-[#D4D4D4] leading-relaxed">
                  {output.summary}
                </p>
              </div>
            )}

            {output.pitch_positioning && (
              <div className="border-l-2 border-[#DC2626] pl-3 py-1">
                <p className="text-[10px] uppercase tracking-wider text-[#DC2626] font-semibold mb-0.5">
                  Pitch this as
                </p>
                <p className="text-xs text-[#D4D4D4] leading-relaxed">
                  {output.pitch_positioning}
                </p>
              </div>
            )}

            <div className="space-y-2">
              {(["high", "medium", "low"] as const).map((tier) => {
                const recs = output.recommendations.filter(
                  (r) => r.priority === tier
                );
                if (recs.length === 0) return null;
                return (
                  <div key={tier} className="space-y-1.5">
                    <p className="text-[10px] uppercase tracking-wider text-[#666]">
                      {tier} priority ({recs.length})
                    </p>
                    {recs.map((r: GuidedRecommendation, i) => (
                      <div
                        key={`${tier}-${i}`}
                        className="rounded-lg border border-[#1A1A1A] bg-[#0B0B0B] p-2.5 space-y-1"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs text-white font-medium leading-snug">
                            {r.action}
                          </p>
                          <div className="flex gap-1 shrink-0">
                            <Badge
                              variant="outline"
                              className={`text-[9px] capitalize ${priorityStyles[r.priority]}`}
                            >
                              {r.priority}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-[11px] text-[#A3A3A3] leading-relaxed">
                          {r.rationale}
                        </p>
                        <div className="flex items-center gap-2 pt-0.5">
                          <Badge variant="outline" className="text-[9px] bg-[#111]">
                            {axisLabels[r.axis] ?? r.axis}
                          </Badge>
                          {r.related_placement && (
                            <span className="text-[10px] text-[#8892a4] truncate">
                              ref: {r.related_placement}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>

            {lastAt && (
              <p className="text-[9px] uppercase tracking-wider text-[#555] pt-1">
                Updated{" "}
                {new Date(lastAt).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}{" "}
                · {output.match_count} matches · top score{" "}
                {output.top_match_score}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
