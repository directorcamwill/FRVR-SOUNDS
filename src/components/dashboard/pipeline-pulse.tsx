"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { GlowCard, AnimatedNumber } from "@/components/ui/motion";
import { GitBranch, ArrowUpRight, Minus, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { PIPELINE_STAGES } from "@/types/opportunity";
import type { Opportunity, OpportunityStage } from "@/types/opportunity";

/**
 * PipelinePulse — UPGRADE_SPEC [06]. Replaces the 2-number Pipeline Summary
 * with a horizontal stage bar + "new this week" momentum indicator per stage,
 * plus top 3 upcoming-deadline opportunities below.
 *
 * Computes everything client-side from the opportunities array the page
 * already fetches — no new endpoint, no extra round trip.
 */

const ACTIVE_STAGES: OpportunityStage[] = [
  "discovery",
  "qualified",
  "matched",
  "ready",
  "submitted",
  "pending",
];

const STAGE_ACCENT: Record<OpportunityStage, string> = {
  discovery: "text-[#A3A3A3]",
  qualified: "text-cyan-300",
  matched: "text-cyan-300",
  ready: "text-amber-300",
  submitted: "text-red-300",
  pending: "text-red-300",
  won: "text-emerald-300",
  lost: "text-[#555]",
};

interface PipelinePulseProps {
  opportunities: Opportunity[];
  loading?: boolean;
}

interface StageStat {
  stage: OpportunityStage;
  label: string;
  count: number;
  newThisWeek: number;
}

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function computeStageStats(
  opportunities: Opportunity[]
): { stages: StageStat[]; totalActive: number; wonCount: number } {
  const now = Date.now();
  const stages: StageStat[] = ACTIVE_STAGES.map((stage) => ({
    stage,
    label: PIPELINE_STAGES.find((s) => s.value === stage)?.label ?? stage,
    count: 0,
    newThisWeek: 0,
  }));
  const byStage = new Map<OpportunityStage, StageStat>(
    stages.map((s) => [s.stage, s])
  );

  let totalActive = 0;
  let wonCount = 0;

  for (const opp of opportunities) {
    if (opp.stage === "won") {
      wonCount += 1;
      continue;
    }
    if (opp.stage === "lost") continue;

    const stat = byStage.get(opp.stage);
    if (!stat) continue;
    stat.count += 1;
    totalActive += 1;

    const updated = Date.parse(opp.updated_at);
    if (Number.isFinite(updated) && now - updated <= ONE_WEEK_MS) {
      stat.newThisWeek += 1;
    }
  }

  return { stages, totalActive, wonCount };
}

function upcomingByDeadline(opportunities: Opportunity[]): Opportunity[] {
  const now = Date.now();
  return opportunities
    .filter(
      (o) =>
        o.stage !== "won" &&
        o.stage !== "lost" &&
        o.deadline &&
        Date.parse(o.deadline) >= now - ONE_WEEK_MS
    )
    .sort((a, b) => {
      const da = a.deadline ? Date.parse(a.deadline) : Infinity;
      const db = b.deadline ? Date.parse(b.deadline) : Infinity;
      return da - db;
    })
    .slice(0, 3);
}

function daysUntil(dateStr: string | null): { days: number; label: string; tone: "red" | "amber" | "chrome" } {
  if (!dateStr) return { days: Infinity, label: "no deadline", tone: "chrome" };
  const diffMs = Date.parse(dateStr) - Date.now();
  const days = Math.round(diffMs / (24 * 60 * 60 * 1000));
  if (days < 0)
    return { days, label: `${Math.abs(days)}d overdue`, tone: "red" };
  if (days === 0) return { days, label: "due today", tone: "red" };
  if (days <= 3) return { days, label: `${days}d left`, tone: "red" };
  if (days <= 7) return { days, label: `${days}d left`, tone: "amber" };
  return { days, label: `${days}d left`, tone: "chrome" };
}

export function PipelinePulse({ opportunities, loading }: PipelinePulseProps) {
  const { stages, totalActive, wonCount } = computeStageStats(opportunities);
  const upcoming = upcomingByDeadline(opportunities);

  return (
    <GlowCard className="p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <GitBranch className="size-4 text-red-500" />
          Pipeline Pulse
        </h3>
        <Link
          href="/pipeline"
          className="text-xs text-red-500 hover:text-red-400 transition-colors"
        >
          Open Pipeline
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      ) : opportunities.length === 0 ? (
        <p className="text-sm text-[#666]">
          No opportunities yet. Add one from{" "}
          <Link
            href="/pipeline"
            className="text-red-500 hover:text-red-400 transition-colors"
          >
            /pipeline
          </Link>
          .
        </p>
      ) : (
        <>
          {/* Summary counts */}
          <div className="flex items-center gap-4 mb-4 text-xs text-[#A3A3A3]">
            <span>
              <span className="text-white font-medium tabular-nums">
                <AnimatedNumber value={totalActive} />
              </span>{" "}
              active
            </span>
            {wonCount > 0 && (
              <span>
                <span className="text-emerald-400 font-medium tabular-nums">
                  <AnimatedNumber value={wonCount} />
                </span>{" "}
                won
              </span>
            )}
          </div>

          {/* Horizontal stage bar */}
          <div className="relative mb-5">
            <div
              aria-hidden
              className="absolute left-0 right-0 top-[22px] h-px bg-gradient-to-r from-[#1A1A1A] via-[#333] to-[#1A1A1A]"
            />
            <div className="relative grid grid-cols-3 sm:grid-cols-6 gap-1 sm:gap-0">
              {stages.map((s, i) => (
                <StageCell key={s.stage} stat={s} index={i} />
              ))}
            </div>
          </div>

          {/* Top 3 upcoming deadlines */}
          <div className="space-y-2">
            <p className="text-[10px] font-medium uppercase tracking-wider text-[#A3A3A3]">
              Next deadlines
            </p>
            {upcoming.length === 0 ? (
              <p className="text-xs text-[#666]">
                No upcoming deadlines in the pipeline.
              </p>
            ) : (
              upcoming.map((o) => {
                const d = daysUntil(o.deadline);
                const toneClass =
                  d.tone === "red"
                    ? "text-red-300"
                    : d.tone === "amber"
                      ? "text-amber-300"
                      : "text-[#c0c8d8]";
                return (
                  <Link
                    key={o.id}
                    href={`/pipeline/${o.id}`}
                    className="flex items-center justify-between gap-2 py-1.5 px-2 -mx-2 rounded hover:bg-white/[0.03] transition-colors group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Calendar
                        className={cn("size-3.5 shrink-0", toneClass)}
                      />
                      <span className="text-sm text-white truncate group-hover:text-red-400 transition-colors">
                        {o.title}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-medium uppercase tracking-wider tabular-nums shrink-0",
                        toneClass
                      )}
                    >
                      {d.label}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </>
      )}
    </GlowCard>
  );
}

function StageCell({ stat, index }: { stat: StageStat; index: number }) {
  const accent = STAGE_ACCENT[stat.stage];
  const dotActive = stat.count > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 + index * 0.05 }}
      className="flex flex-col items-center gap-1 relative"
    >
      {/* Node dot on the line */}
      <span
        className={cn(
          "relative z-10 size-2 rounded-full mt-[18px] shrink-0",
          dotActive
            ? "bg-red-500 shadow-[0_0_6px_rgba(220,38,38,0.6)]"
            : "bg-[#333]"
        )}
      />
      <p className="text-[9px] font-medium uppercase tracking-[0.15em] text-[#8892a4] text-center">
        {stat.label}
      </p>
      <div className="flex items-center gap-1">
        <span
          className={cn(
            "text-base font-bold tabular-nums",
            dotActive ? "text-white" : "text-[#555]"
          )}
        >
          <AnimatedNumber value={stat.count} />
        </span>
        {stat.newThisWeek > 0 ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-[9px] font-medium tabular-nums",
              accent
            )}
            title={`${stat.newThisWeek} new this week`}
          >
            <ArrowUpRight className="size-2.5" />
            {stat.newThisWeek}
          </span>
        ) : (
          dotActive && (
            <Minus className="size-2.5 text-[#555]" aria-label="no recent change" />
          )
        )}
      </div>
    </motion.div>
  );
}
