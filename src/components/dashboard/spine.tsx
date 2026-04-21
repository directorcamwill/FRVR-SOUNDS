"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedNumber } from "@/components/ui/motion";
import {
  FileSearch,
  FlaskConical,
  Sliders,
  Package,
  GitBranch,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SpineResponse, SpineNode as SpineNodeData, SpineStatus } from "@/app/api/spine/route";

/**
 * Spine — 5-node horizontal strip visualizing the product flow:
 * INTELLIGENCE → CREATION → FINISHING → DELIVERY → ECOSYSTEM
 *
 * Each node is a glowing circle with a live count + status dot + CTA.
 * Thin signal line between nodes carries a traveling pulse to signal flow.
 *
 * Horizontal scroll on small screens, full row on desktop. Matches
 * UPGRADE_SPEC [02]. Palette: chrome idle, red active, cyan accent; status
 * dots are green/amber/red for urgency readouts.
 */

const NODE_CONFIG: Array<{
  key: keyof SpineResponse;
  label: string;
  icon: LucideIcon;
}> = [
  { key: "intelligence", label: "Intelligence", icon: FileSearch },
  { key: "creation", label: "Creation", icon: FlaskConical },
  { key: "finishing", label: "Finishing", icon: Sliders },
  { key: "delivery", label: "Delivery", icon: Package },
  { key: "ecosystem", label: "Ecosystem", icon: GitBranch },
];

export function Spine({
  data,
  loading,
}: {
  data: SpineResponse | null;
  loading?: boolean;
}) {
  return (
    <div className="relative">
      {/* Signal line behind nodes */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-12 right-12 top-1/2 -translate-y-1/2 h-px opacity-50"
        style={{
          background:
            "linear-gradient(90deg, rgba(220,38,38,0) 0%, rgba(220,38,38,0.4) 20%, rgba(34,211,238,0.4) 80%, rgba(34,211,238,0) 100%)",
        }}
      />
      {/* Traveling pulse along the signal line */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-1/2 -translate-y-1/2 size-2 rounded-full"
        style={{
          background: "#22d3ee",
          boxShadow: "0 0 12px rgba(34,211,238,0.8)",
          left: "3rem",
        }}
        animate={{ left: ["3rem", "calc(100% - 3rem)"] }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "linear",
          repeatDelay: 2,
        }}
      />

      <div className="relative flex items-stretch gap-2 overflow-x-auto sm:gap-3 sm:overflow-visible py-2">
        {NODE_CONFIG.map((cfg, i) => (
          <SpineNodeView
            key={cfg.key}
            index={i}
            label={cfg.label}
            icon={cfg.icon}
            node={data ? data[cfg.key] : null}
            loading={!!loading}
          />
        ))}
      </div>
    </div>
  );
}

const STATUS_DOT: Record<SpineStatus, string> = {
  ok: "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]",
  warn: "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]",
  alert: "bg-red-500 shadow-[0_0_6px_rgba(220,38,38,0.8)]",
};

function SpineNodeView({
  index,
  label,
  icon: Icon,
  node,
  loading,
}: {
  index: number;
  label: string;
  icon: LucideIcon;
  node: SpineNodeData | null;
  loading: boolean;
}) {
  const active = !!node && node.count > 0;
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: 0.1 + index * 0.08,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={cn(
        "group relative flex flex-col items-center gap-2 shrink-0",
        "w-[96px] sm:w-auto sm:flex-1 sm:min-w-0"
      )}
    >
      <p className="text-[9px] sm:text-[10px] font-medium uppercase tracking-[0.18em] text-[#8892a4] text-center">
        {label}
      </p>

      <div
        className={cn(
          "relative flex items-center justify-center rounded-full border",
          "size-16 sm:size-20 shrink-0 bg-black",
          "motion-safe:transition-all motion-safe:duration-300",
          active
            ? "border-red-500/40 shadow-[0_0_20px_rgba(220,38,38,0.2)] group-hover:shadow-[0_0_30px_rgba(220,38,38,0.35)] group-hover:border-red-500/60"
            : "border-[#1A1A1A] group-hover:border-[#c0c8d8]/20"
        )}
      >
        {/* Status dot */}
        {node && (
          <span
            className={cn(
              "absolute -top-0.5 -right-0.5 size-2 rounded-full",
              STATUS_DOT[node.status]
            )}
            aria-label={`status ${node.status}`}
          />
        )}

        {loading || !node ? (
          <div className="flex flex-col items-center gap-1">
            <Icon className="size-4 text-[#333]" />
            <Skeleton className="h-3 w-5" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-0.5">
            <Icon
              className={cn(
                "size-3.5",
                active ? "text-red-400" : "text-[#555]"
              )}
            />
            <span
              className={cn(
                "text-base sm:text-lg font-bold tabular-nums leading-none",
                active ? "text-white" : "text-[#666]"
              )}
            >
              <AnimatedNumber value={node.count} />
            </span>
          </div>
        )}
      </div>

      <p
        className={cn(
          "text-[9px] sm:text-[10px] text-center max-w-[96px] sm:max-w-none leading-tight",
          active
            ? "text-[#c0c8d8] group-hover:text-white"
            : "text-[#555] group-hover:text-[#A3A3A3]",
          "motion-safe:transition-colors"
        )}
      >
        {loading || !node ? "—" : node.cta}
      </p>
    </motion.div>
  );

  if (!node || loading) return content;
  return (
    <Link
      href={node.route}
      className="sm:flex-1 sm:min-w-0 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 rounded-full"
    >
      {content}
    </Link>
  );
}
