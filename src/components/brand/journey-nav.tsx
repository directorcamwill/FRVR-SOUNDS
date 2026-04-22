"use client";

import { cn } from "@/lib/utils";
import { CheckCircle2, Lock } from "lucide-react";
import { BRAND_MODULES } from "@/lib/brand/modules";
import type { BrandModuleId, BrandWiki } from "@/types/brand";
import { computeModuleCompleteness } from "@/lib/brand/validation";

export function JourneyNav({
  wiki,
  currentModuleId,
  onSelectModule,
}: {
  wiki: BrandWiki;
  currentModuleId: BrandModuleId;
  onSelectModule: (id: BrandModuleId) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-red-500/60">
        The Journey
      </p>

      {BRAND_MODULES.map((mod) => {
        const pct = computeModuleCompleteness(
          mod.questions,
          wiki as unknown as Record<string, unknown>,
        );
        const active = mod.id === currentModuleId;
        const done = pct >= 80;

        return (
          <button
            key={mod.id}
            type="button"
            onClick={() => onSelectModule(mod.id)}
            className={cn(
              "group flex flex-col gap-1 text-left rounded-lg px-3 py-3 transition-colors",
              active
                ? "bg-red-500/10 border border-red-500/20"
                : "hover:bg-white/[0.03] border border-transparent",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={cn(
                  "text-sm font-medium tracking-tight",
                  active
                    ? "text-red-200"
                    : done
                      ? "text-white"
                      : "text-white/70 group-hover:text-white",
                )}
              >
                {mod.label}
              </span>
              {done ? (
                <CheckCircle2 className="size-3.5 text-emerald-400" />
              ) : (
                <span className="text-[10px] tabular-nums text-white/40">
                  {pct}%
                </span>
              )}
            </div>
            <p className="text-[11px] text-white/40 leading-snug">
              {mod.tagline}
            </p>
            <div className="h-[3px] w-full rounded-full bg-white/[0.04] overflow-hidden mt-1">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  done
                    ? "bg-emerald-500/70"
                    : pct > 0
                      ? "bg-red-500/70"
                      : "bg-transparent",
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          </button>
        );
      })}

      <div className="mt-4 space-y-1">
        <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-white/30">
          Later chapters
        </p>
        {["Monetization", "Content System", "Brand Rules"].map((label) => (
          <div
            key={label}
            className="flex items-center gap-2 px-3 py-2 text-[11px] text-white/30"
          >
            <Lock className="size-3" />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
