"use client";

import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { GlowDot, ConfidencePill } from "@/components/ui/motion";
import { RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * FocusBar — replaces the "Welcome Back" banner in Command Center v2.
 * Surfaces the single most important thing the system is focused on right now,
 * with the orchestrator's self-assessed confidence and a system-active pulse.
 *
 * Per UPGRADE_SPEC [01]: full-width, 64–72px tall, bold focus line, confidence
 * pill + live dot + relative time on the right, ambient red gradient wash.
 *
 * Data source: existing /api/agents response (focus_area already returned).
 * Confidence was wired in PR-1c.
 */

interface FocusBarProps {
  focusArea?: string;
  confidence?: number | null;
  lastSyncAt?: Date | null;
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}

function formatRelative(date: Date | null | undefined): string {
  if (!date) return "—";
  const s = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

export function FocusBar({
  focusArea,
  confidence,
  lastSyncAt,
  loading,
  refreshing,
  onRefresh,
}: FocusBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        "relative overflow-hidden rounded-xl border border-[#1A1A1A]",
        "glass-card px-5 py-4"
      )}
    >
      {/* Ambient red wash left-to-right */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, rgba(220,38,38,0.08) 0%, rgba(220,38,38,0.02) 40%, transparent 100%)",
        }}
      />

      <div className="relative flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#8892a4]">
            Focused on
          </p>
          {loading ? (
            <Skeleton className="h-5 w-2/3 mt-1" />
          ) : (
            <h2
              className="mt-0.5 text-lg sm:text-xl font-semibold text-white tracking-tight truncate"
              title={focusArea}
            >
              {focusArea || "System is reading your current state…"}
            </h2>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {confidence != null && (
            <ConfidencePill score={confidence} showLabel={false} />
          )}

          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <GlowDot color="green" size="sm" />
            <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-emerald-400 tabular-nums">
              {refreshing
                ? "syncing"
                : lastSyncAt
                  ? formatRelative(lastSyncAt)
                  : "live"}
            </span>
          </div>

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className={cn(
                "inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md",
                "border border-[#1A1A1A] text-[#A3A3A3]",
                "hover:border-red-500/30 hover:text-white",
                "hover:shadow-[0_0_15px_rgba(220,38,38,0.1)] transition-all",
                "disabled:opacity-50 disabled:cursor-wait"
              )}
              aria-label="Refresh"
            >
              {refreshing ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RefreshCw className="size-3.5" />
              )}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
