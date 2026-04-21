"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfidencePill } from "@/components/ui/motion";
import { ChevronRight, Sparkles, ListChecks, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Move, MoveCategory, MoveSource } from "@/types/move";

/**
 * NextMoves — UPGRADE_SPEC [03]. Merges orchestrator priority actions +
 * today's / overdue daily tasks + unread alerts into one ranked list.
 * Cap at 5 visible, "See all" expands. Sorted by urgency × confidence.
 *
 * Inputs are kept loose on purpose (dumb-component with a computation core):
 * the page feeds whatever it already has; we normalize here.
 */

interface OrchestratorAction {
  title: string;
  description: string;
  urgency: "high" | "medium" | "low";
  action_url: string;
  category: string;
  confidence?: number | null;
}

interface TaskInput {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  priority?: string | null;
  status?: string | null;
  due_date?: string | null;
}

interface AlertInput {
  id: string;
  title: string;
  message: string;
  severity: string;
  agent_type?: string | null;
  action_url?: string | null;
}

interface NextMovesProps {
  orchestratorActions?: OrchestratorAction[];
  todayTasks?: TaskInput[];
  overdueTasks?: TaskInput[];
  alerts?: AlertInput[];
  loading?: boolean;
}

// ───────────────────────── Category styling ─────────────────────────
const CATEGORY_STYLES: Record<
  MoveCategory,
  { stripe: string; label: string; text: string }
> = {
  intelligence: {
    stripe: "bg-cyan-500",
    label: "Intelligence",
    text: "text-cyan-300",
  },
  creation: {
    stripe: "bg-red-500",
    label: "Creation",
    text: "text-red-300",
  },
  finishing: {
    stripe: "bg-amber-500",
    label: "Finishing",
    text: "text-amber-300",
  },
  delivery: {
    stripe: "bg-cyan-400",
    label: "Delivery",
    text: "text-cyan-200",
  },
  ecosystem: {
    stripe: "bg-[#c0c8d8]",
    label: "Ecosystem",
    text: "text-[#c0c8d8]",
  },
};

const URGENCY_STYLES: Record<Move["urgency"], string> = {
  high: "bg-red-500/15 text-red-300 border-red-500/30",
  medium: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  low: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
};

const SOURCE_ICON: Record<MoveSource, React.ComponentType<{ className?: string }>> = {
  orchestrator: Sparkles,
  task: ListChecks,
  review_queue: AlertCircle,
};

// ───────────────────────── Normalization ─────────────────────────

// Orchestrator categories → Move categories (spine axes)
function normalizeOrchestratorCategory(raw: string | undefined): MoveCategory {
  switch (raw) {
    case "sync_readiness":
      return "finishing";
    case "opportunity":
      return "ecosystem";
    case "metadata":
      return "creation";
    case "submission":
      return "delivery";
    case "catalog":
      return "creation";
    case "intelligence":
    case "creation":
    case "finishing":
    case "delivery":
    case "ecosystem":
      return raw;
    default:
      return "ecosystem";
  }
}

function normalizeTaskCategory(raw: string | null | undefined): MoveCategory {
  switch (raw) {
    case "music":
      return "creation";
    case "sync":
      return "finishing";
    case "content":
      return "delivery";
    case "business":
    case "admin":
    case "learning":
    case "general":
      return "ecosystem";
    default:
      return "ecosystem";
  }
}

function normalizeAlertCategory(
  agentType: string | null | undefined
): MoveCategory {
  switch (agentType) {
    case "sync_engine":
    case "sync_brief":
    case "placement_dna":
    case "market_intel":
      return "intelligence";
    case "health_monitor":
    case "catalog_marketing":
      return "creation";
    case "orchestrator":
      return "ecosystem";
    default:
      return "ecosystem";
  }
}

function taskUrgency(
  priority: string | null | undefined,
  overdue: boolean
): Move["urgency"] {
  if (overdue) return "high";
  if (priority === "urgent" || priority === "high") return "high";
  if (priority === "medium") return "medium";
  return "low";
}

function alertUrgency(severity: string | null | undefined): Move["urgency"] {
  if (severity === "urgent") return "high";
  if (severity === "warning") return "medium";
  return "low";
}

function composeMoves(props: NextMovesProps): Move[] {
  const moves: Move[] = [];

  (props.orchestratorActions ?? []).forEach((a, i) => {
    moves.push({
      id: `orch-${i}`,
      title: a.title,
      description: a.description,
      urgency: a.urgency,
      confidence: a.confidence ?? null,
      category: normalizeOrchestratorCategory(a.category),
      action_url: a.action_url,
      source: "orchestrator",
    });
  });

  (props.overdueTasks ?? [])
    .filter((t) => t.status !== "done" && t.status !== "cancelled")
    .forEach((t) => {
      moves.push({
        id: `task-${t.id}`,
        title: t.title,
        description: t.description || "Overdue task",
        urgency: taskUrgency(t.priority, true),
        confidence: 1,
        category: normalizeTaskCategory(t.category),
        action_url: "/daily",
        source: "task",
      });
    });

  (props.todayTasks ?? [])
    .filter((t) => t.status !== "done" && t.status !== "cancelled")
    .forEach((t) => {
      moves.push({
        id: `task-${t.id}`,
        title: t.title,
        description: t.description || "Scheduled for today",
        urgency: taskUrgency(t.priority, false),
        confidence: 1,
        category: normalizeTaskCategory(t.category),
        action_url: "/daily",
        source: "task",
      });
    });

  (props.alerts ?? []).forEach((al) => {
    moves.push({
      id: `alert-${al.id}`,
      title: al.title,
      description: al.message,
      urgency: alertUrgency(al.severity),
      confidence: null,
      category: normalizeAlertCategory(al.agent_type),
      action_url: al.action_url || "/command-center",
      source: "review_queue",
    });
  });

  // Rank: urgency × confidence. Confidence defaults to 0.8 when missing so
  // "known-unknowns" don't dominate known-low-confidence items.
  const urgencyWeight: Record<Move["urgency"], number> = {
    high: 3,
    medium: 2,
    low: 1,
  };
  const score = (m: Move) =>
    urgencyWeight[m.urgency] * (m.confidence ?? 0.8);

  // Dedupe by title (within same category) — orchestrator often echoes tasks.
  const seen = new Map<string, Move>();
  for (const m of moves) {
    const key = `${m.category}::${m.title.trim().toLowerCase()}`;
    const existing = seen.get(key);
    if (!existing || score(m) > score(existing)) {
      seen.set(key, m);
    }
  }

  return [...seen.values()].sort((a, b) => score(b) - score(a));
}

// ───────────────────────── View ─────────────────────────

export function NextMoves(props: NextMovesProps) {
  const [expanded, setExpanded] = useState(false);
  const moves = useMemo(() => composeMoves(props), [props]);
  const visible = expanded ? moves : moves.slice(0, 5);
  const remaining = moves.length - visible.length;

  return (
    <Card className="glass-card border-[#1A1A1A]">
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle>Next Moves</CardTitle>
          {!props.loading && (
            <p className="text-xs text-[#A3A3A3] mt-1">
              <span className="text-white font-medium tabular-nums">
                {moves.length}
              </span>{" "}
              across{" "}
              {countCategories(moves)} categor
              {countCategories(moves) === 1 ? "y" : "ies"}
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {props.loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="p-3 rounded-lg bg-white/[0.02] space-y-2"
              >
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        ) : moves.length === 0 ? (
          <p className="text-sm text-[#666]">
            You&apos;re caught up. The orchestrator will surface new moves on the
            next refresh.
          </p>
        ) : (
          <div className="space-y-2">
            {visible.map((m) => (
              <MoveCard key={m.id} move={m} />
            ))}
            {remaining > 0 && !expanded && (
              <button
                onClick={() => setExpanded(true)}
                className="text-xs font-medium uppercase tracking-wider text-red-400 hover:text-red-300 transition-colors pt-1"
              >
                See all · {remaining} more →
              </button>
            )}
            {expanded && moves.length > 5 && (
              <button
                onClick={() => setExpanded(false)}
                className="text-xs font-medium uppercase tracking-wider text-[#A3A3A3] hover:text-white transition-colors pt-1"
              >
                Collapse
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function countCategories(moves: Move[]): number {
  return new Set(moves.map((m) => m.category)).size;
}

function MoveCard({ move }: { move: Move }) {
  const cat = CATEGORY_STYLES[move.category];
  const SourceIcon = SOURCE_ICON[move.source];

  return (
    <Link
      href={move.action_url}
      className={cn(
        "relative flex items-start gap-3 p-3 rounded-lg glass-card",
        "motion-safe:transition-all motion-safe:duration-300 group",
        "hover:border-red-500/20 hover:shadow-[0_0_20px_rgba(220,38,38,0.08)]"
      )}
    >
      {/* Category stripe */}
      <span
        aria-hidden
        className={cn(
          "absolute left-0 top-2 bottom-2 w-0.5 rounded-full",
          cat.stripe
        )}
      />

      <div className="flex-1 min-w-0 pl-1.5">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <SourceIcon
            className={cn("size-3 shrink-0", cat.text)}
          />
          <span
            className={cn(
              "inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium uppercase tracking-wider border",
              URGENCY_STYLES[move.urgency]
            )}
          >
            {move.urgency}
          </span>
          <span
            className={cn(
              "text-[9px] font-medium uppercase tracking-[0.15em]",
              cat.text
            )}
          >
            {cat.label}
          </span>
          <span className="text-sm font-medium text-white truncate flex-1 min-w-0">
            {move.title}
          </span>
        </div>
        <p className="text-xs text-[#A3A3A3] line-clamp-2 leading-relaxed">
          {move.description}
        </p>
        {move.confidence != null && (
          <div className="mt-2">
            <ConfidencePill score={move.confidence} showLabel={false} />
          </div>
        )}
      </div>
      <ChevronRight className="size-4 text-[#555] group-hover:text-red-500 mt-1 shrink-0 transition-colors" />
    </Link>
  );
}
