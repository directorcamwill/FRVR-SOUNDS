"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Loader2,
  Sparkles,
  FileText,
  Music,
  Film,
  Mic,
  Handshake,
  Target,
  UserRound,
  Image as ImageIcon,
  Store,
  Hash,
  ArrowUpRight,
  Lock,
  Globe,
} from "lucide-react";
import { WikiGlobeModal } from "./wiki-globe-modal";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { BrandModuleId, BrandWiki } from "@/types/brand";
import { BRAND_MODULES } from "@/lib/brand/modules";
import { computeModuleCompleteness } from "@/lib/brand/validation";
import { useMyAccess } from "@/hooks/use-my-access";
import { PLANS } from "@/lib/plans";

/**
 * Brand Wiki Rewards — the celebratory panel that appears once the artist
 * finishes all 7 Brand Journey modules. Frames the finished Wiki as the
 * reward that unlocks every downstream agent + generator in FRVR Sounds.
 *
 * Renders only when all 7 modules ≥80% per-module completeness.
 */

interface ToolCard {
  icon: typeof FileText;
  title: string;
  subtitle: string;
  href?: string;         // destination route
  action?: "generate_bios"; // special inline action
  status?: "live" | "soon";
}

const LIVE_TOOLS: ToolCard[] = [
  {
    icon: FileText,
    title: "Generate your bios",
    subtitle: "Short, medium, long + elevator pitch, drawn straight from your Identity module.",
    action: "generate_bios",
    status: "live",
  },
  {
    icon: Sparkles,
    title: "Content ideas",
    subtitle: "On-brand posts for IG · TikTok · X · LinkedIn · email · press.",
    href: "/content",
    status: "live",
  },
  {
    icon: Mic,
    title: "Lyrics in your voice",
    subtitle: "Songwriter drafts lines that pass your Voice DOs and DON'Ts.",
    href: "/song-lab",
    status: "live",
  },
  {
    icon: Music,
    title: "Production direction",
    subtitle: "Producer reads your Sonic DNA + references and writes the blueprint.",
    href: "/song-lab",
    status: "live",
  },
  {
    icon: Target,
    title: "Brand Fit grader",
    subtitle: "Score any track against your brand. Flags drift before you submit.",
    href: "/vault",
    status: "live",
  },
  {
    icon: Handshake,
    title: "Collaborator intros",
    subtitle: "Intro letters that lead with your Differentiators, not a generic pitch.",
    href: "/song-lab",
    status: "live",
  },
  {
    icon: Film,
    title: "Sync matching",
    subtitle: "Placement Matcher uses your Routes + Emotional Tags.",
    href: "/placements",
    status: "live",
  },
  {
    icon: UserRound,
    title: "Supervisor matching",
    subtitle: "Supervisor Matcher uses your Lane + Sync Targets.",
    href: "/supervisors",
    status: "live",
  },
];

const SOON_TOOLS: ToolCard[] = [
  {
    icon: Hash,
    title: "Social media profile builder",
    subtitle: "Handle, bio, link-in-bio, and pinned-post copy — all on-brand.",
    status: "soon",
  },
  {
    icon: ImageIcon,
    title: "Photo art direction",
    subtitle: "Press-photo shot lists + mood boards pulled from your Visual DNA.",
    status: "soon",
  },
  {
    icon: Store,
    title: "Products + offers",
    subtitle: "Services, merch, ticketing — priced and positioned for your Audience.",
    status: "soon",
  },
];

export function BrandWikiRewards({
  wiki,
  onAfterBios,
  onEditModule,
}: {
  wiki: BrandWiki;
  onAfterBios?: () => void;
  /** Jumps the Brand Journey to the clicked module (wired from page.tsx). */
  onEditModule?: (id: BrandModuleId) => void;
}) {
  const [generatingBios, setGeneratingBios] = useState(false);
  const [bios, setBios] = useState<null | {
    bio_short?: string;
    bio_medium?: string;
    bio_long?: string;
    elevator_pitch?: string;
    reasoning?: string;
    confidence?: number | null;
    auto_wrote?: boolean;
  }>(null);
  const [globeOpen, setGlobeOpen] = useState(false);
  const { access, loading: accessLoading } = useMyAccess();

  const wikiRecord = wiki as unknown as Record<string, unknown>;
  const allDone = BRAND_MODULES.every(
    (m) => computeModuleCompleteness(m.questions, wikiRecord) >= 80,
  );
  // Super-admins bypass the completion gate so operators can QA the activation
  // surface without grinding through every question. Plan gating still applies
  // via hasFeature() below.
  if (!allDone && !access.is_super_admin) return null;

  const activated = access.hasFeature("brand_wiki_activated");
  if (!accessLoading && !activated) {
    return <BrandWikiLockedUpsell />;
  }

  const generateBios = async () => {
    setGeneratingBios(true);
    setBios(null);
    try {
      const res = await fetch("/api/agents/brand-director", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "summarize_to_wiki",
          module_id: "identity",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 403) {
          throw new Error(
            data.error || "Bio generation is on Pro Catalog.",
          );
        }
        if (res.status === 429) {
          throw new Error(
            data.error ||
              "You've used all your agent runs this cycle. Resets next period.",
          );
        }
        throw new Error(data.error || "Bio generation failed");
      }
      const data = await res.json();
      setBios(data.summary ?? null);
      if (data.summary?.auto_wrote) {
        toast.success("Bios written to your Brand Wiki.");
      }
      onAfterBios?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bio generation failed");
    } finally {
      setGeneratingBios(false);
    }
  };

  return (
    <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.04] via-zinc-950 to-zinc-950 overflow-hidden">
      <CardContent className="p-6 space-y-6">
        {/* Hero */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-400" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-emerald-400/80">
              Brand Wiki · Activated
            </p>
          </div>
          <h3 className="text-2xl font-semibold text-white tracking-tight leading-tight">
            Your Brand Wiki is now open.
          </h3>
          <p className="text-sm text-white/60 max-w-2xl leading-relaxed">
            Every tool below reads from your Wiki the moment you run it.
            Sharper inputs produced sharper outputs — you just built the
            source of truth.
          </p>
          <div className="pt-2">
            <Button
              size="sm"
              onClick={() => setGlobeOpen(true)}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-[0_0_24px_rgba(220,38,38,0.25)]"
            >
              <Globe className="size-4 mr-2" />
              Open your Wiki as a 3D Constellation
            </Button>
          </div>
        </div>
        <WikiGlobeModal
          open={globeOpen}
          onOpenChange={setGlobeOpen}
          wiki={wiki}
          onEditModule={onEditModule}
        />

        {/* Primary CTA — bios */}
        <div className="rounded-lg border border-red-500/20 bg-red-500/[0.04] p-4 space-y-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-[0.2em] text-red-400/80">
                Start here
              </p>
              <p className="text-base font-semibold text-white">
                Generate your bios from the Identity module
              </p>
              <p className="text-xs text-white/60 max-w-xl">
                Short, medium, long, and elevator pitch. The Director writes
                them, you approve, they go into your Wiki.
              </p>
            </div>
            <Button
              size="sm"
              onClick={generateBios}
              disabled={generatingBios}
              className="bg-red-600 hover:bg-red-500 text-white shrink-0"
            >
              {generatingBios ? (
                <Loader2 className="size-3.5 mr-1.5 animate-spin" />
              ) : (
                <Sparkles className="size-3.5 mr-1.5" />
              )}
              {generatingBios ? "Writing…" : "Generate now"}
            </Button>
          </div>

          {bios && (
            <div className="space-y-2 pt-3 border-t border-white/5">
              {bios.auto_wrote ? (
                <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="size-3" />
                  Saved to your Wiki.
                </p>
              ) : (
                <p className="text-[11px] text-amber-300">
                  Low confidence — review before using.
                </p>
              )}
              <BioPreview label="Elevator pitch" value={bios.elevator_pitch} />
              <BioPreview label="Short bio" value={bios.bio_short} />
              <BioPreview label="Medium bio" value={bios.bio_medium} />
              <BioPreview label="Long bio" value={bios.bio_long} />
            </div>
          )}
        </div>

        {/* Unlocked tools */}
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/40">
            Unlocked by your Wiki
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {LIVE_TOOLS.filter((t) => t.action !== "generate_bios").map((t) => (
              <ToolCardRow key={t.title} tool={t} />
            ))}
          </div>
        </div>

        {/* Coming soon */}
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/30">
            Later chapters unlock
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {SOON_TOOLS.map((t) => (
              <ToolCardRow key={t.title} tool={t} />
            ))}
          </div>
        </div>

        {/* Module receipts */}
        <div className="pt-3 border-t border-white/5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2">
            Your finished modules
          </p>
          <div className="flex flex-wrap gap-1.5">
            {BRAND_MODULES.map((m) => (
              <span
                key={m.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.04] px-2.5 py-0.5 text-[11px] text-emerald-100"
              >
                <CheckCircle2 className="size-3" />
                {m.label}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Locked upsell (non-Studio users) ─────────────────────────────────────

function BrandWikiLockedUpsell() {
  const studio = PLANS.studio;
  return (
    <Card className="border-red-500/20 bg-gradient-to-br from-red-500/[0.04] via-zinc-950 to-zinc-950 overflow-hidden">
      <CardContent className="p-6 space-y-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Lock className="size-4 text-red-400" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-red-400/90">
              Brand Wiki · Locked
            </p>
          </div>
          <h3 className="text-2xl font-semibold text-white tracking-tight leading-tight">
            You finished the Journey. Activate your Wiki on {studio.name}.
          </h3>
          <p className="text-sm text-white/60 max-w-2xl leading-relaxed">
            The Brand Wiki is the payoff — a single source of truth that
            writes your bios, generates on-brand content, builds your social
            profile, photo direction, products, and every tool below. It
            unlocks on <span className="text-white">{studio.name}</span>{" "}
            (${studio.priceMonthly}/mo).
          </p>
        </div>

        {/* What you unlock */}
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/40">
            What activates
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              ...LIVE_TOOLS.filter((t) => t.action !== "generate_bios"),
              ...SOON_TOOLS,
            ].map((t) => (
              <LockedToolRow key={t.title} tool={t} />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 pt-3 border-t border-white/5 flex-wrap">
          <p className="text-[11px] text-white/40">
            Your finished modules stay saved. Upgrade anytime to activate.
          </p>
          <Link href="/pricing">
            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-500 text-white"
            >
              <Sparkles className="size-3.5 mr-1.5" />
              Upgrade to {studio.name}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function LockedToolRow({ tool }: { tool: ToolCard }) {
  const Icon = tool.icon;
  return (
    <div className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.01] p-3">
      <Icon className="size-4 mt-0.5 shrink-0 text-white/40" />
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-sm font-medium text-white/80 leading-tight">
          {tool.title}
        </p>
        <p className="text-[11px] text-white/40 leading-snug">
          {tool.subtitle}
        </p>
      </div>
      <Lock className="size-3 text-white/30 shrink-0 mt-1" />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────

function ToolCardRow({ tool }: { tool: ToolCard }) {
  const Icon = tool.icon;
  const isSoon = tool.status === "soon";
  const inner = (
    <div
      className={cn(
        "group relative flex items-start gap-3 rounded-lg border p-3 overflow-hidden transition-all",
        isSoon
          ? "border-white/5 bg-white/[0.01] opacity-60"
          : "border-red-500/15 bg-gradient-to-br from-red-500/[0.03] via-white/[0.01] to-white/[0.02] hover:border-red-500/50 hover:bg-red-500/[0.06] hover:shadow-[0_0_24px_rgba(220,38,38,0.18)]",
      )}
    >
      {/* Red laser sweep on hover */}
      {!isSoon && (
        <span
          aria-hidden
          className="absolute inset-y-0 -left-1/3 w-1/3 opacity-0 group-hover:opacity-100 group-hover:animate-[laser-sweep_900ms_ease-out]"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(220,38,38,0.22), transparent)",
          }}
        />
      )}
      {/* Left-edge laser line */}
      {!isSoon && (
        <span
          aria-hidden
          className="absolute left-0 top-2 bottom-2 w-[2px] bg-red-500/40 group-hover:bg-red-500 group-hover:shadow-[0_0_8px_rgba(220,38,38,0.8)] transition-all"
        />
      )}

      <Icon
        className={cn(
          "size-4 mt-0.5 shrink-0 transition-colors",
          isSoon ? "text-white/40" : "text-red-400 group-hover:text-red-300",
        )}
      />
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-white leading-tight">
            {tool.title}
          </p>
          {isSoon ? (
            <span className="text-[10px] uppercase tracking-wider text-white/30 shrink-0">
              soon
            </span>
          ) : tool.href ? (
            <ArrowUpRight className="size-3.5 text-white/30 group-hover:text-red-300 transition-colors shrink-0" />
          ) : null}
        </div>
        <p className="text-[11px] text-white/50 leading-snug">
          {tool.subtitle}
        </p>
      </div>
    </div>
  );
  if (tool.href && !isSoon) {
    return <Link href={tool.href}>{inner}</Link>;
  }
  return inner;
}

function BioPreview({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  if (!value) return null;
  return (
    <div className="rounded-md border border-white/5 bg-black/40 p-3 space-y-1">
      <p className="text-[10px] uppercase tracking-wider text-white/40">
        {label}
      </p>
      <p className="text-xs text-white/90 leading-relaxed">{value}</p>
    </div>
  );
}

// Re-export for consumer
export type { BrandModuleId };
