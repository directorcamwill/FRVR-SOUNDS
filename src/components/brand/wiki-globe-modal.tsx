"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  X,
  Globe,
  Zap,
  Bot,
  ArrowUpRight,
  CheckCircle2,
  Circle,
  Mic,
  Pencil,
} from "lucide-react";
import { BRAND_MODULES } from "@/lib/brand/modules";
import { computeModuleCompleteness } from "@/lib/brand/validation";
import { MODULE_AGENTS, MODULE_DESCRIPTIONS } from "@/lib/brand/agent-map";
import { WikiOracle } from "./wiki-oracle";
import type { BrandModuleId, BrandWiki } from "@/types/brand";

const BrandWikiGlobe = dynamic(
  () => import("./wiki-globe").then((m) => m.BrandWikiGlobe),
  { ssr: false, loading: () => null },
);

// Single palette — laser red, chrome, tech blue. Red is the default; blue
// is the "selected / tech focus" accent. No per-module colors anywhere.
const LASER_RED = "#DC2626";
const TECH_BLUE = "#22d3ee";

const MODULE_ACCENT: Record<BrandModuleId, string> = {
  identity: LASER_RED,
  emotional: LASER_RED,
  positioning: LASER_RED,
  audience: LASER_RED,
  visual: LASER_RED,
  sonic: LASER_RED,
  routes: LASER_RED,
};

// Tech-blue used for the "currently open" dossier accent so the UI echoes
// the globe's selection state (marker turns blue when selected too).
function accentFor(selected: boolean): string {
  return selected ? TECH_BLUE : LASER_RED;
}

/**
 * Full-screen 3D Brand Wiki overlay. Clicking a globe marker slides in a
 * chrome/laser "dossier" panel from the right with that module's deep data.
 */

export function WikiGlobeModal({
  open,
  onOpenChange,
  wiki,
  initialSelectedModule = null,
  onEditModule,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wiki: BrandWiki;
  initialSelectedModule?: BrandModuleId | null;
  /** When provided, the dossier surfaces an "Edit this module" button that
   *  closes the globe + jumps the Brand Journey to that module. */
  onEditModule?: (id: BrandModuleId) => void;
}) {
  const [selectedModule, setSelectedModule] = useState<BrandModuleId | null>(
    initialSelectedModule,
  );
  const [oracleOpen, setOracleOpen] = useState(false);
  const [oracleSpeaking, setOracleSpeaking] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={{
          maxWidth: "100vw",
          width: "100vw",
          height: "100dvh",
          padding: 0,
          gap: 0,
          borderRadius: 0,
          border: "none",
          background: "#000",
          ringWidth: 0,
        } as React.CSSProperties}
        className={cn(
          "flex flex-col overflow-hidden",
        )}
      >
        {/* Scanline overlay — subtle HUD feel across the whole surface. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[5] mix-blend-overlay opacity-[0.06]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, rgba(255,255,255,0.6) 0px, rgba(255,255,255,0.6) 1px, transparent 1px, transparent 3px)",
          }}
        />

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2">
            <Globe className="size-4 text-red-500 animate-pulse" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-red-500/80">
              The Brand Wiki
            </p>
          </div>
          <div className="pointer-events-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOracleOpen((o) => !o)}
              className={cn(
                "text-red-200 hover:text-white hover:bg-red-500/10 border border-red-500/30 bg-red-500/[0.04] gap-1.5",
                oracleOpen && "bg-red-500/10 border-red-500/60",
              )}
            >
              <Mic className="size-3.5" />
              {oracleOpen ? "Close Oracle" : "Ask the Wiki"}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="text-white/70 hover:text-white hover:bg-white/5"
            >
              <X className="size-5" />
            </Button>
          </div>
        </div>

        {/* Globe canvas */}
        <div className="absolute inset-0">
          <BrandWikiGlobe
            wiki={wiki}
            selectedModule={selectedModule}
            onSelectModule={setSelectedModule}
            speaking={oracleSpeaking}
          />
        </div>

        {/* Idle helper hint */}
        {!selectedModule && !oracleOpen && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">
              Drag to rotate · Click a marker to open its dossier · Ask the Wiki to speak
            </p>
          </div>
        )}

        {/* Right-side panel — Oracle takes priority over dossier when open */}
        {oracleOpen ? (
          <aside
            className={cn(
              "absolute right-0 top-0 bottom-0 z-20 w-full sm:w-[440px] pointer-events-auto",
              "animate-[slide-in-right_280ms_ease-out_forwards]",
            )}
          >
            <WikiOracle
              focusModule={selectedModule}
              onClose={() => setOracleOpen(false)}
              onSpeakingChange={setOracleSpeaking}
            />
          </aside>
        ) : selectedModule ? (
          <ModuleDossier
            wiki={wiki}
            moduleId={selectedModule}
            onClose={() => setSelectedModule(null)}
            onAskAbout={() => setOracleOpen(true)}
            onEditModule={
              onEditModule
                ? (id) => {
                    onOpenChange(false);
                    onEditModule(id);
                  }
                : undefined
            }
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

// ─── Dossier ──────────────────────────────────────────────────────────────

function ModuleDossier({
  wiki,
  moduleId,
  onClose,
  onAskAbout,
  onEditModule,
}: {
  wiki: BrandWiki;
  moduleId: BrandModuleId;
  onClose: () => void;
  onAskAbout?: () => void;
  onEditModule?: (id: BrandModuleId) => void;
}) {
  const mod = BRAND_MODULES.find((m) => m.id === moduleId);
  if (!mod) return null;

  const wikiRecord = wiki as unknown as Record<string, unknown>;
  const pct = computeModuleCompleteness(mod.questions, wikiRecord);
  // The dossier is always the "selected" state — accent = tech blue.
  const accent = accentFor(true);
  const agents = MODULE_AGENTS[moduleId] ?? [];
  const description = MODULE_DESCRIPTIONS[moduleId];

  return (
    <aside
      className={cn(
        "absolute right-0 top-0 bottom-0 z-20 w-full sm:w-[440px] pointer-events-auto",
        "animate-[slide-in-right_280ms_ease-out_forwards]",
      )}
    >
      {/* Chrome frame */}
      <div
        className="relative h-full flex flex-col overflow-hidden border-l backdrop-blur-2xl"
        style={{
          borderColor: `${accent}40`,
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(10,10,12,0.92) 40%, rgba(0,0,0,0.95) 100%)",
          boxShadow: `-24px 0 48px -12px ${accent}25, inset 1px 0 0 ${accent}30`,
        }}
      >
        {/* Red laser line — top */}
        <div
          aria-hidden
          className="absolute top-0 left-0 right-0 h-[1px] opacity-90"
          style={{
            background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
            boxShadow: `0 0 12px ${accent}`,
          }}
        />

        {/* Scanline wash */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, rgba(255,255,255,0.6) 0px, rgba(255,255,255,0.6) 1px, transparent 1px, transparent 3px)",
          }}
        />

        {/* Header */}
        <div className="relative flex items-start justify-between px-5 pt-5 pb-4 shrink-0 border-b border-white/5">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="size-1.5 rounded-full"
                style={{
                  background: accent,
                  boxShadow: `0 0 10px ${accent}`,
                }}
              />
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.3em]"
                style={{ color: accent }}
              >
                Module Dossier
              </p>
            </div>
            <h3 className="text-2xl font-semibold text-white tracking-tight leading-tight">
              {mod.label}
            </h3>
            <p className="text-xs text-white/50 leading-snug pr-4">
              {description}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dossier"
            className="text-white/40 hover:text-white transition-colors shrink-0 -mr-1"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Completeness ring + stats */}
        <div className="relative flex items-center gap-4 px-5 py-4 shrink-0 border-b border-white/5">
          <CompletenessRing pct={pct} color={accent} />
          <div className="space-y-1.5 flex-1">
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                Filled
              </span>
              <span className="text-[11px] tabular-nums text-white/80 font-mono">
                {mod.questions.filter((q) =>
                  isFilled(wikiRecord[q.field_key]),
                ).length}
                <span className="text-white/30"> / {mod.questions.length}</span>
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                Agents consuming
              </span>
              <span className="text-[11px] tabular-nums text-white/80 font-mono">
                {agents.length}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                Status
              </span>
              <span
                className="text-[11px] font-mono uppercase tracking-wider"
                style={{ color: pct >= 80 ? "#10B981" : pct >= 40 ? "#F59E0B" : "#ef4444" }}
              >
                {pct >= 80 ? "Active" : pct >= 40 ? "Partial" : "Sparse"}
              </span>
            </div>
          </div>
        </div>

        {/* Data records */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <p className="text-[10px] uppercase tracking-[0.25em] text-white/40 flex items-center gap-2">
            <Zap className="size-3" style={{ color: accent }} />
            Recorded Data
          </p>

          {mod.questions.map((q) => {
            const v = wikiRecord[q.field_key];
            const filled = isFilled(v);
            return (
              <div
                key={q.id}
                className={cn(
                  "rounded-md border p-3 transition-colors relative overflow-hidden",
                  filled
                    ? "border-white/10 bg-white/[0.02]"
                    : "border-white/5 bg-white/[0.01]",
                )}
              >
                {filled && (
                  <div
                    aria-hidden
                    className="absolute left-0 top-0 bottom-0 w-[2px]"
                    style={{
                      background: accent,
                      boxShadow: `0 0 8px ${accent}`,
                    }}
                  />
                )}
                <div className="flex items-start gap-2 mb-1">
                  {filled ? (
                    <CheckCircle2
                      className="size-3 mt-0.5 shrink-0"
                      style={{ color: accent }}
                    />
                  ) : (
                    <Circle className="size-3 mt-0.5 shrink-0 text-white/20" />
                  )}
                  <p
                    className={cn(
                      "text-[10px] uppercase tracking-wider leading-tight",
                      filled ? "text-white/70" : "text-white/40",
                    )}
                  >
                    {q.prompt}
                  </p>
                </div>
                <p
                  className={cn(
                    "text-xs leading-relaxed pl-5 font-mono",
                    filled ? "text-white/90" : "text-white/30 italic",
                  )}
                >
                  {displayValue(v)}
                </p>
              </div>
            );
          })}
        </div>

        {/* Primary actions */}
        <div className="shrink-0 px-5 py-4 border-t border-white/5 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {onEditModule && (
              <Button
                type="button"
                size="sm"
                onClick={() => onEditModule(moduleId)}
                variant="outline"
                className="justify-center bg-white/[0.02] hover:bg-white/[0.06] border-white/15 text-white"
              >
                <Pencil className="size-3.5 mr-1.5" />
                Edit module
              </Button>
            )}
            {onAskAbout && (
              <Button
                type="button"
                size="sm"
                onClick={onAskAbout}
                className="justify-center bg-red-500/10 hover:bg-red-500/20 text-red-200 border border-red-500/30"
                variant="outline"
              >
                <Mic className="size-3.5 mr-1.5" />
                Ask the Wiki
              </Button>
            )}
          </div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-white/40 flex items-center gap-2 pt-1">
            <Bot className="size-3" style={{ color: accent }} />
            Agents that read this module
          </p>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {agents.map((a) => {
              const inner = (
                <div
                  className={cn(
                    "flex items-center gap-2 rounded border border-white/10 bg-black/40 px-2.5 py-1.5 transition-colors",
                    a.href && "hover:border-white/20 hover:bg-white/[0.03]",
                  )}
                >
                  <span
                    className="size-1 rounded-full shrink-0"
                    style={{ background: accent, boxShadow: `0 0 6px ${accent}` }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-white leading-tight">
                      {a.label}
                    </p>
                    <p className="text-[10px] text-white/40 leading-tight line-clamp-1">
                      {a.purpose}
                    </p>
                  </div>
                  {a.href && (
                    <ArrowUpRight className="size-3 text-white/30 shrink-0" />
                  )}
                </div>
              );
              return a.href ? (
                <Link key={a.id} href={a.href}>
                  {inner}
                </Link>
              ) : (
                <div key={a.id}>{inner}</div>
              );
            })}
          </div>
        </div>

        {/* Red laser line — bottom */}
        <div
          aria-hidden
          className="absolute bottom-0 left-0 right-0 h-[1px] opacity-70"
          style={{
            background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
            boxShadow: `0 0 10px ${accent}`,
          }}
        />
      </div>
    </aside>
  );
}

function CompletenessRing({ pct, color }: { pct: number; color: string }) {
  const r = 24;
  const c = 2 * Math.PI * r;
  const offset = c - (c * pct) / 100;
  return (
    <div className="relative size-[72px] shrink-0">
      <svg viewBox="0 0 64 64" className="size-full -rotate-90">
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="3"
        />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{
            filter: `drop-shadow(0 0 6px ${color})`,
            transition: "stroke-dashoffset 600ms ease-out",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold tabular-nums text-white leading-none">
          {pct}
        </span>
        <span className="text-[9px] text-white/40 tracking-wider uppercase">
          %
        </span>
      </div>
    </div>
  );
}

// ─── helpers ──────────────────────────────────────────────────────────────

function isFilled(v: unknown): boolean {
  if (v == null) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v).length > 0;
  if (typeof v === "number") return Number.isFinite(v);
  return true;
}

function displayValue(v: unknown): string {
  if (v == null) return "—";
  if (typeof v === "string") return v || "—";
  if (Array.isArray(v)) {
    if (v.length === 0) return "—";
    if (v.every((x) => typeof x === "string")) return (v as string[]).join(" · ");
    return (v as unknown[])
      .map((item) => {
        if (item && typeof item === "object") {
          return Object.values(item as Record<string, unknown>).join(" — ");
        }
        return String(item);
      })
      .join(" · ");
  }
  if (typeof v === "number") return String(v);
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}
