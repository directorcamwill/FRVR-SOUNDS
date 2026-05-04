"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Calendar,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedbackRunRow {
  id: string;
  period_start: string;
  period_end: string;
  signals: {
    top_signal: { kind: string; key: string; lift: number; delta_from_baseline: number; pieces: number; message: string } | null;
    top_anti_signal: { kind: string; key: string; lift: number; delta_from_baseline: number; pieces: number; message: string } | null;
    by_pillar: Array<{ key: string; pieces: number; lift: number; totals: { views?: number; saves?: number; follows_from?: number } }>;
    by_emotion: Array<{ key: string; pieces: number; lift: number; totals: { views?: number } }>;
    totals: { views?: number; saves?: number; follows_from?: number; sales_attributed?: number };
    wow: { views: number; saves: number; follows_from: number; sales_attributed: number; pieces_shipped: number };
    baseline_lift: number | null;
    pieces_shipped: number;
    pieces_with_data: number;
  } | null;
  applied: boolean;
  created_at: string;
}

export default function FeedbackHistoryPage() {
  const [runs, setRuns] = useState<FeedbackRunRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/feedback-runs");
        const data = await res.json();
        if (cancelled) return;
        setRuns(data.runs ?? []);
        if (data.warning) setWarning(data.warning);
      } catch {
        // swallow — empty list will render
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <Link
          href="/execution"
          className="inline-flex items-center text-xs text-white/50 hover:text-white"
        >
          <ArrowLeft className="size-3 mr-1" />
          Back to Weekly Execution
        </Link>
        <div className="flex items-center gap-2 mt-2">
          <History className="size-5 text-[#DC2626]" />
          <h1 className="text-2xl font-bold text-white">Feedback history</h1>
        </div>
        <p className="text-sm text-[#A3A3A3] mt-1">
          Every Monday digest persists here. Read backwards to spot what worked, what didn&apos;t, and how your pillars shifted week over week.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : runs.length === 0 ? (
        <Card className="border-white/10 bg-zinc-950/60">
          <CardContent className="p-6 space-y-3">
            <p className="text-sm text-[#D4D4D4]">
              No history yet. The first Monday digest after you ship a piece with performance data will appear here.
            </p>
            <p className="text-xs text-white/50">
              {warning ?? "Ship a draft from the editor and enter performance numbers — your next weekly run captures the signal."}
            </p>
            <Link
              href="/execution/draft"
              className="inline-flex items-center gap-1.5 mt-1 text-xs text-[#DC2626] hover:underline"
            >
              Open the draft editor <ArrowRight className="size-3" />
            </Link>
          </CardContent>
        </Card>
      ) : (
        <ol className="relative space-y-4 border-l border-white/10 pl-6">
          {runs.map((run) => (
            <RunCard key={run.id} run={run} />
          ))}
        </ol>
      )}
    </div>
  );
}

function RunCard({ run }: { run: FeedbackRunRow }) {
  const s = run.signals;
  const pieces = s?.pieces_shipped ?? 0;
  const wow = s?.wow.pieces_shipped ?? 0;

  return (
    <li className="relative">
      <span className="absolute -left-[33px] top-3 size-3 rounded-full bg-[#DC2626]/40 border-2 border-[#DC2626]" />
      <Card className="border-white/10 bg-zinc-950/60">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/50">
                <Calendar className="size-3" />
                {fmtDate(run.period_start)} → {fmtDate(run.period_end)}
              </div>
              <div className="mt-1 text-sm text-[#D4D4D4]">
                <span className="font-semibold text-white tabular-nums">
                  {pieces}
                </span>{" "}
                piece{pieces === 1 ? "" : "s"} shipped
                {wow !== 0 && (
                  <span
                    className={cn(
                      "ml-2 text-xs tabular-nums",
                      wow > 0 ? "text-emerald-300" : "text-red-300",
                    )}
                  >
                    {wow > 0 ? "+" : ""}
                    {wow} vs prev
                  </span>
                )}
              </div>
            </div>
            {s && s.baseline_lift !== null && (
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-white/50">
                  Baseline lift
                </p>
                <p className="text-sm text-white tabular-nums">
                  {(s.baseline_lift * 100).toFixed(1)}%
                </p>
              </div>
            )}
          </div>

          {(s?.top_signal || s?.top_anti_signal) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
              {s?.top_signal && (
                <div className="rounded-md border border-emerald-500/30 bg-emerald-500/[0.04] p-2.5">
                  <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-emerald-300">
                    <TrendingUp className="size-3" />
                    Top signal
                  </div>
                  <p className="mt-1 text-xs text-[#D4D4D4] leading-snug">
                    {s.top_signal.message}
                  </p>
                </div>
              )}
              {s?.top_anti_signal && (
                <div className="rounded-md border border-red-500/30 bg-red-500/[0.04] p-2.5">
                  <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-red-300">
                    <TrendingDown className="size-3" />
                    Anti-signal
                  </div>
                  <p className="mt-1 text-xs text-[#D4D4D4] leading-snug">
                    {s.top_anti_signal.message}
                  </p>
                </div>
              )}
            </div>
          )}

          {s && s.by_pillar.length > 0 && (
            <div className="pt-2 border-t border-white/5">
              <p className="text-[10px] uppercase tracking-wider text-white/50">
                Lift by pillar
              </p>
              <ul className="mt-1.5 space-y-1">
                {s.by_pillar.slice(0, 4).map((b) => (
                  <li
                    key={b.key}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-[#D4D4D4] truncate flex-1">
                      {b.key}{" "}
                      <span className="text-white/40">
                        · {b.pieces} piece{b.pieces === 1 ? "" : "s"}
                      </span>
                    </span>
                    <span className="text-white/60 tabular-nums">
                      {(b.lift * 100).toFixed(1)}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!s && (
            <p className="text-xs italic text-white/40">
              No signals captured for this period.
            </p>
          )}
        </CardContent>
      </Card>
    </li>
  );
}

function fmtDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
