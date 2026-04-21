"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { GlowDot } from "@/components/ui/motion";
import {
  Activity,
  Bot,
  Brain,
  ChevronDown,
  ChevronUp,
  Megaphone,
  Sparkles,
  Zap,
  FileSearch,
  Dna,
  DollarSign,
  type LucideIcon,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

/**
 * AmbientActivityFeed — UPGRADE_SPEC [08]. v2 treatment of the agent log:
 *   - Collapsed by default (just a thin strip + expand chevron)
 *   - Filter chips: All / Orchestrator / Sync / Health
 *   - Expands to show up to 20 items
 *
 * v1's <ActivityFeed> is preserved unchanged (top-right grid slot in v1).
 */

interface AgentLog {
  id: string;
  agent_type: string;
  action: string;
  summary: string;
  created_at: string;
  tokens_used?: number;
  duration_ms?: number;
}

interface AgentConfig {
  icon: LucideIcon;
  color: string;
  label: string;
  group: FilterGroup;
}

type FilterGroup = "orchestrator" | "sync" | "health" | "other";
type Filter = "all" | FilterGroup;

const AGENT_CONFIG: Record<string, AgentConfig> = {
  orchestrator: {
    icon: Bot,
    color: "text-cyan-300",
    label: "Orchestrator",
    group: "orchestrator",
  },
  sync_engine: {
    icon: Sparkles,
    color: "text-red-400",
    label: "Sync Engine",
    group: "sync",
  },
  sync_brief: {
    icon: FileSearch,
    color: "text-red-300",
    label: "Sync Brief",
    group: "sync",
  },
  placement_dna: {
    icon: Dna,
    color: "text-cyan-400",
    label: "Placement DNA",
    group: "sync",
  },
  health_monitor: {
    icon: Activity,
    color: "text-emerald-400",
    label: "Health",
    group: "health",
  },
  market_intel: {
    icon: Brain,
    color: "text-[#c0c8d8]",
    label: "Intel",
    group: "other",
  },
  catalog_marketing: {
    icon: Megaphone,
    color: "text-[#c0c8d8]",
    label: "Marketing",
    group: "other",
  },
  royalty_scanner: {
    icon: DollarSign,
    color: "text-amber-300",
    label: "Royalties",
    group: "other",
  },
};

const FILTER_CHIPS: Array<{ key: Filter; label: string }> = [
  { key: "all", label: "All" },
  { key: "orchestrator", label: "Orchestrator" },
  { key: "sync", label: "Sync" },
  { key: "health", label: "Health" },
];

function configFor(agentType: string): AgentConfig {
  return (
    AGENT_CONFIG[agentType] ?? {
      icon: Zap,
      color: "text-[#666]",
      label: agentType,
      group: "other",
    }
  );
}

export function AmbientActivityFeed({
  logs,
  loading,
}: {
  logs: AgentLog[];
  loading: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return logs;
    return logs.filter((l) => configFor(l.agent_type).group === filter);
  }, [logs, filter]);

  const mostRecent = filtered[0];

  return (
    <div className="rounded-xl border border-[#1A1A1A] glass-card overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-white/[0.02] transition-colors"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3 min-w-0">
          <GlowDot color="red" size="sm" />
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#8892a4]">
            AI Live Feed
          </span>
          <span className="text-[11px] text-[#555] tabular-nums">
            · {filtered.length} event{filtered.length === 1 ? "" : "s"}
          </span>
          {!expanded && mostRecent && !loading && (
            <span className="text-xs text-[#A3A3A3] truncate min-w-0 hidden sm:inline">
              · {mostRecent.summary}
            </span>
          )}
        </div>
        <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-[#8892a4]">
          {expanded ? "Collapse" : "Expand"}
          {expanded ? (
            <ChevronUp className="size-3" />
          ) : (
            <ChevronDown className="size-3" />
          )}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <div className="border-t border-[#1A1A1A] px-4 py-3 space-y-3">
              {/* Filter chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {FILTER_CHIPS.map((chip) => (
                  <button
                    key={chip.key}
                    onClick={() => setFilter(chip.key)}
                    className={cn(
                      "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider transition-colors",
                      filter === chip.key
                        ? "border-red-500/40 bg-red-500/10 text-red-300"
                        : "border-[#1A1A1A] text-[#A3A3A3] hover:border-[#333] hover:text-white"
                    )}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Rows */}
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Skeleton className="size-7 rounded-full shrink-0" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-3 w-3/4" />
                        <Skeleton className="h-2 w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <p className="text-xs text-[#666]">
                  No activity in this filter.
                </p>
              ) : (
                <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {filtered.slice(0, 20).map((log) => {
                    const cfg = configFor(log.agent_type);
                    const Icon = cfg.icon;
                    return (
                      <li
                        key={log.id}
                        className="flex items-start gap-2.5 group"
                      >
                        <div
                          className={cn(
                            "flex items-center justify-center size-7 rounded-full bg-white/[0.02] border border-[#1A1A1A] shrink-0",
                            cfg.color,
                            "group-hover:border-red-500/20 transition-colors"
                          )}
                        >
                          <Icon className="size-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white truncate">
                            {log.summary}
                          </p>
                          <p className="text-[10px] text-[#555] tabular-nums">
                            {cfg.label} ·{" "}
                            {formatDistanceToNow(new Date(log.created_at), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
