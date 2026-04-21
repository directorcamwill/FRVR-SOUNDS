"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, Calendar, Loader2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/**
 * OpportunityScanner — one-click "does this project match anything in my
 * pipeline right now?" Calls the deterministic matcher at
 * /api/opportunities/match-project, renders top 3 ranked results with
 * per-match score + reason chips + link to pipeline.
 */

interface Match {
  opportunity_id: string;
  title: string;
  company: string | null;
  opportunity_type: string | null;
  deadline: string | null;
  stage: string;
  score: number;
  reasons: string[];
}

function daysUntil(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const diff = Math.round(
    (Date.parse(dateStr) - Date.now()) / (24 * 60 * 60 * 1000)
  );
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return "due today";
  if (diff < 14) return `${diff}d left`;
  return `${diff}d left`;
}

function scoreTone(score: number): {
  text: string;
  dot: string;
  border: string;
} {
  if (score >= 70)
    return {
      text: "text-emerald-300",
      dot: "bg-emerald-500",
      border: "border-emerald-500/30",
    };
  if (score >= 40)
    return {
      text: "text-amber-300",
      dot: "bg-amber-500",
      border: "border-amber-500/30",
    };
  return {
    text: "text-[#c0c8d8]",
    dot: "bg-[#c0c8d8]",
    border: "border-[#c0c8d8]/30",
  };
}

export function OpportunityScanner({ projectId }: { projectId: string }) {
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [totalActive, setTotalActive] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/opportunities/match-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Scan failed");
      }
      const data = await res.json();
      setMatches(Array.isArray(data.matches) ? data.matches : []);
      setTotalActive(
        typeof data.total_active === "number" ? data.total_active : null
      );
      setExpanded(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setLoading(false);
    }
  };

  const visible = expanded ? matches ?? [] : (matches ?? []).slice(0, 3);
  const remaining = matches ? matches.length - visible.length : 0;

  return (
    <Card>
      <CardContent className="py-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Target className="size-4 text-red-500" />
              Opportunity Scanner
            </h3>
            <p className="text-[11px] text-[#A3A3A3] mt-0.5">
              Rank active pipeline opportunities against this project + brand.
            </p>
          </div>
          <Button
            size="sm"
            variant={matches ? "outline" : "default"}
            onClick={run}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="size-3.5 mr-1.5 animate-spin" />
            ) : (
              <Target className="size-3.5 mr-1.5" />
            )}
            {loading ? "Scanning" : matches ? "Re-scan" : "Scan"}
          </Button>
        </div>

        {loading && !matches && (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        )}

        {matches && matches.length === 0 && (
          <p className="text-xs text-[#A3A3A3]">
            No active opportunities in your pipeline yet. Add one from{" "}
            <Link
              href="/pipeline"
              className="text-red-400 hover:text-red-300 underline underline-offset-2"
            >
              /pipeline
            </Link>
            .
          </p>
        )}

        {matches && matches.length > 0 && (
          <>
            {totalActive !== null && (
              <p className="text-[10px] uppercase tracking-wider text-[#555]">
                Top {visible.length} of {matches.length} match
                {matches.length === 1 ? "" : "es"} (from {totalActive} active)
              </p>
            )}
            <div className="space-y-1.5">
              {visible.map((m) => {
                const tone = scoreTone(m.score);
                const deadline = daysUntil(m.deadline);
                return (
                  <Link
                    key={m.opportunity_id}
                    href={`/pipeline/${m.opportunity_id}`}
                    className={cn(
                      "block rounded-lg border p-2.5 transition-colors hover:bg-white/[0.02] group",
                      tone.border
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={cn(
                            "size-1.5 rounded-full shrink-0",
                            tone.dot
                          )}
                        />
                        <span className="text-sm font-medium text-white truncate group-hover:text-red-400 transition-colors">
                          {m.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={cn(
                            "text-xs font-bold tabular-nums",
                            tone.text
                          )}
                        >
                          {m.score}
                        </span>
                        <ChevronRight className="size-3.5 text-[#555] group-hover:text-red-400" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-[10px] text-[#A3A3A3]">
                      {m.company && <span>{m.company}</span>}
                      {m.opportunity_type && (
                        <span className="uppercase tracking-wider">
                          · {m.opportunity_type.replace(/_/g, " ")}
                        </span>
                      )}
                      {deadline && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="size-2.5" />
                          {deadline}
                        </span>
                      )}
                    </div>
                    {m.reasons.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {m.reasons.slice(0, 3).map((r, i) => (
                          <span
                            key={i}
                            className={cn(
                              "inline-flex items-center rounded border px-1.5 py-0.5 text-[9px]",
                              tone.border,
                              tone.text
                            )}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
            {remaining > 0 && !expanded && (
              <button
                onClick={() => setExpanded(true)}
                className="text-[10px] uppercase tracking-wider text-red-400 hover:text-red-300"
              >
                See all · {remaining} more →
              </button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
