"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Sparkles,
  Copy,
  Check,
  Hash,
  Image as ImageIcon,
  Store,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import type {
  RewardTool,
  SocialProfileOutput,
  PhotoDirectionOutput,
  OffersOutput,
} from "@/lib/agents/reward-tools";

interface BaseResult<T> {
  tool: RewardTool;
  output: T;
  reasoning: string;
  confidence: number | null;
}

type RewardResult =
  | BaseResult<SocialProfileOutput>
  | BaseResult<PhotoDirectionOutput>
  | BaseResult<OffersOutput>;

const TOOL_META: Record<
  RewardTool,
  { title: string; subtitle: string; icon: typeof Hash }
> = {
  social: {
    title: "Social media profile",
    subtitle:
      "Handle, bio, link-in-bio, and pinned post — all grounded in your Wiki.",
    icon: Hash,
  },
  photos: {
    title: "Photo art direction",
    subtitle:
      "Press-photo shot list + mood direction drawn from your Visual DNA.",
    icon: ImageIcon,
  },
  offers: {
    title: "Products + offers",
    subtitle:
      "Tiered offer stack priced and positioned for your audience.",
    icon: Store,
  },
};

export function RewardToolModal({
  tool,
  open,
  onOpenChange,
}: {
  tool: RewardTool;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RewardResult | null>(null);

  const meta = TOOL_META[tool];
  const Icon = meta.icon;

  const generate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/brand-rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error(data.error || "Unlocks on Sync Prepared.");
        }
        if (res.status === 429) {
          throw new Error(
            data.error ||
              "You've used all your agent runs this cycle. Resets next period.",
          );
        }
        throw new Error(data.error || "Failed to generate");
      }
      setResult(data as RewardResult);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto border-red-500/20 bg-zinc-950">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Icon className="size-4 text-red-400" />
            <DialogTitle className="text-white">{meta.title}</DialogTitle>
          </div>
          <DialogDescription className="text-white/60">
            {meta.subtitle}
          </DialogDescription>
        </DialogHeader>

        {!result && !loading && (
          <div className="flex flex-col items-center gap-3 py-10">
            <p className="text-sm text-white/60 max-w-md text-center leading-relaxed">
              Generate fresh copy grounded in your finished Brand Wiki. Uses
              one agent run.
            </p>
            <Button
              onClick={generate}
              className="bg-red-600 hover:bg-red-500 text-white"
            >
              <Sparkles className="size-3.5 mr-1.5" />
              Generate now
            </Button>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center gap-3 py-14">
            <Loader2 className="size-5 animate-spin text-red-400" />
            <p className="text-xs text-white/50">Writing…</p>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            {result.confidence !== null && result.confidence < 0.7 && (
              <div className="flex items-start gap-2 rounded-md border border-amber-500/20 bg-amber-500/[0.04] p-3">
                <AlertTriangle className="size-4 text-amber-300 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-200 leading-snug">
                  Low-confidence output — review before using. Sharper wiki
                  answers produce sharper copy.
                </p>
              </div>
            )}

            {tool === "social" && (
              <SocialResult
                output={(result as BaseResult<SocialProfileOutput>).output}
              />
            )}
            {tool === "photos" && (
              <PhotoResult
                output={(result as BaseResult<PhotoDirectionOutput>).output}
              />
            )}
            {tool === "offers" && (
              <OffersResult
                output={(result as BaseResult<OffersOutput>).output}
              />
            )}

            {result.reasoning && (
              <div className="rounded-md border border-white/5 bg-white/[0.02] p-3">
                <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">
                  Why this
                </p>
                <p className="text-xs text-white/70 leading-relaxed">
                  {result.reasoning}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <p className="text-[11px] text-white/40">
                {result.confidence !== null
                  ? `Confidence ${Math.round(result.confidence * 100)}%`
                  : ""}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={generate}
                className="text-white/60 hover:text-white hover:bg-white/5"
              >
                <Sparkles className="size-3.5 mr-1.5" />
                Regenerate
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Sub-renderers ────────────────────────────────────────────────────────

function CopyField({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <div className="rounded-md border border-white/5 bg-black/40 p-3 space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-wider text-white/40">
          {label}
        </p>
        <button
          onClick={copy}
          className="text-[11px] text-white/50 hover:text-red-300 flex items-center gap-1"
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p
        className={`text-sm text-white/90 ${multiline ? "leading-relaxed" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

function SocialResult({ output }: { output: SocialProfileOutput }) {
  return (
    <div className="space-y-3">
      {output.handle_ideas.length > 0 && (
        <div className="rounded-md border border-white/5 bg-black/40 p-3 space-y-1.5">
          <p className="text-[10px] uppercase tracking-wider text-white/40">
            Handle ideas
          </p>
          <div className="flex flex-wrap gap-1.5">
            {output.handle_ideas.map((h) => (
              <span
                key={h}
                className="inline-flex items-center rounded-full border border-red-500/20 bg-red-500/[0.06] px-2.5 py-0.5 text-[12px] text-white/90 font-mono"
              >
                @{h}
              </span>
            ))}
          </div>
        </div>
      )}
      <CopyField label="Bio (150 chars)" value={output.bio} multiline />
      <CopyField label="Link-in-bio CTA" value={output.link_in_bio_cta} />
      <CopyField label="Pinned post" value={output.pinned_post} multiline />
    </div>
  );
}

function PhotoResult({ output }: { output: PhotoDirectionOutput }) {
  return (
    <div className="space-y-3">
      {output.shot_list.length > 0 && (
        <div className="rounded-md border border-white/5 bg-black/40 p-3 space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-white/40">
            Shot list
          </p>
          <ol className="space-y-2">
            {output.shot_list.map((s, i) => (
              <li key={i} className="flex gap-3 text-xs">
                <span className="text-red-400 font-mono shrink-0 pt-0.5">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white/90 font-medium uppercase tracking-wider text-[10px]">
                      {s.type}
                    </span>
                    <span className="text-[10px] text-white/40">·</span>
                    <span className="text-[10px] text-white/50">{s.framing}</span>
                  </div>
                  <p className="text-white/80 leading-snug">{s.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
      <CopyField label="Lighting" value={output.lighting} multiline />
      <CopyField label="Wardrobe" value={output.wardrobe} multiline />
      <CopyField label="Location + set" value={output.location_notes} multiline />
      {output.mood_references.length > 0 && (
        <div className="rounded-md border border-white/5 bg-black/40 p-3 space-y-1.5">
          <p className="text-[10px] uppercase tracking-wider text-white/40">
            Mood references
          </p>
          <div className="flex flex-wrap gap-1.5">
            {output.mood_references.map((m) => (
              <span
                key={m}
                className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[11px] text-white/80"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function OffersResult({ output }: { output: OffersOutput }) {
  const order: Record<string, number> = { entry: 0, mid: 1, flagship: 2 };
  const sorted = [...output.offers].sort(
    (a, b) => (order[a.tier] ?? 9) - (order[b.tier] ?? 9),
  );
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2">
        {sorted.map((o, i) => (
          <div
            key={i}
            className="rounded-md border border-red-500/15 bg-gradient-to-br from-red-500/[0.03] to-white/[0.01] p-3 space-y-1.5"
          >
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="space-y-0.5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-red-400/80">
                  {o.tier} · {o.kind.replace(/_/g, " ")}
                </p>
                <p className="text-sm font-semibold text-white leading-tight">
                  {o.name}
                </p>
              </div>
              <span className="rounded-full border border-white/10 bg-black/40 px-2 py-0.5 text-[11px] font-mono text-white/80">
                {o.price_range}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-1 pt-1 border-t border-white/5">
              <p className="text-[11px] text-white/60 leading-snug">
                <span className="text-white/40">Audience fit — </span>
                {o.audience_fit}
              </p>
              <p className="text-[11px] text-white/60 leading-snug">
                <span className="text-white/40">Positioning — </span>
                {o.positioning}
              </p>
            </div>
          </div>
        ))}
      </div>
      {output.rationale && (
        <div className="rounded-md border border-white/5 bg-black/40 p-3">
          <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">
            Through-line
          </p>
          <p className="text-xs text-white/80 leading-relaxed">
            {output.rationale}
          </p>
        </div>
      )}
    </div>
  );
}
