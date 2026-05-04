"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Save,
  CircleGauge,
  Send,
  ArrowLeft,
  Sparkles,
  Zap,
  Target,
  Copy,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { BrandWiki, ContentPillar, HookTemplate } from "@/types/brand";

interface ContentPiece {
  id: string;
  artist_id: string;
  platform: string | null;
  pillar_id: string | null;
  format_id: string | null;
  hook: string | null;
  body: string | null;
  cta: string | null;
  fit_status:
    | "draft"
    | "revise"
    | "ship_ready"
    | "anchor"
    | "shipped"
    | "archived"
    | null;
  fit_score: ContentFitScore | null;
  performance: PiecePerformance | null;
  external_url: string | null;
  shipped_at: string | null;
  created_at: string;
  updated_at: string;
}

interface PiecePerformance {
  views?: number;
  saves?: number;
  replies?: number;
  sends?: number;
  follows_from?: number;
  sales_attributed?: number;
}

interface ContentFitScore {
  identity_match: number;
  emotional_accuracy: number;
  audience_relevance: number;
  platform_fit: number;
  total: number;
  flags: string[];
  suggestions: Array<{ dimension: string; suggestion: string }>;
  reasoning: string;
  confidence: number | null;
  scored_at: string;
}

const PLATFORM_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "x", label: "X" },
  { value: "newsletter", label: "Newsletter" },
];

export default function DraftEditorPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 max-w-4xl mx-auto">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96" />
        </div>
      }
    >
      <DraftEditorContent />
    </Suspense>
  );
}

function DraftEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingId = searchParams.get("id");
  const initialPlatform = searchParams.get("platform") ?? "instagram";
  const scheduledForParam = searchParams.get("scheduled_for"); // YYYY-MM-DD

  const [wiki, setWiki] = useState<BrandWiki | null>(null);
  const [piece, setPiece] = useState<ContentPiece | null>(null);
  const [loading, setLoading] = useState(true);

  const [platform, setPlatform] = useState(initialPlatform);
  const [pillarId, setPillarId] = useState("");
  const [hook, setHook] = useState("");
  const [body, setBody] = useState("");
  const [cta, setCta] = useState("");
  const [scheduledFor, setScheduledFor] = useState<string | null>(
    scheduledForParam,
  );

  const [saving, setSaving] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [refineLoading, setRefineLoading] = useState<
    "viral" | "niche" | "multiply" | null
  >(null);
  const [refineProposal, setRefineProposal] = useState<{
    kind: "viral" | "niche";
    hook: string;
    body: string;
    cta: string;
    delta_message: string;
    delta_score: number | null;
    reasoning: string;
  } | null>(null);
  const [variants, setVariants] = useState<Array<{
    platform: string;
    hook: string;
    body: string;
    cta: string;
    notes: string;
  }> | null>(null);

  const fitScore = piece?.fit_score ?? null;
  const fitStatus = piece?.fit_status ?? "draft";

  const pillars = (wiki?.content_pillars ?? []) as ContentPillar[];
  const hooks = (wiki?.hook_library ?? []) as HookTemplate[];

  // ── Initial load ─────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [wikiRes, pieceRes] = await Promise.all([
          fetch("/api/brand-wiki"),
          editingId
            ? fetch(`/api/content-pieces?limit=100`)
            : Promise.resolve(null),
        ]);
        if (!wikiRes.ok) throw new Error("Failed to load Brand Wiki");
        const wikiData = await wikiRes.json();
        if (cancelled) return;
        setWiki(wikiData.wiki);

        if (editingId && pieceRes && pieceRes.ok) {
          const pieceData = await pieceRes.json();
          const found = (pieceData.pieces ?? []).find(
            (p: ContentPiece) => p.id === editingId,
          );
          if (found) {
            setPiece(found);
            setPlatform(found.platform ?? "instagram");
            setPillarId(found.pillar_id ?? "");
            setHook(found.hook ?? "");
            setBody(found.body ?? "");
            setCta(found.cta ?? "");
          }
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Load failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editingId]);

  // ── Save ─────────────────────────────────────────────────────────────────
  const save = useCallback(async (): Promise<ContentPiece | null> => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        platform,
        pillar_id: pillarId || null,
        hook,
        body,
        cta,
      };
      // For new drafts created from a calendar slot, persist the scheduled date.
      if (!piece && scheduledFor) {
        payload.scheduled_for = `${scheduledFor}T12:00:00Z`;
      }
      const res = piece
        ? await fetch("/api/content-pieces", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: piece.id, ...payload }),
          })
        : await fetch("/api/content-pieces", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setPiece(data.piece);
      toast.success(piece ? "Saved." : "Draft created.");
      // If creating, swap to edit mode so further saves PUT.
      if (!piece && data.piece?.id) {
        router.replace(`/execution/draft?id=${data.piece.id}`);
      }
      return data.piece as ContentPiece;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
      return null;
    } finally {
      setSaving(false);
    }
  }, [platform, pillarId, hook, body, cta, piece, scheduledFor, router]);

  // ── Score ────────────────────────────────────────────────────────────────
  const score = useCallback(async () => {
    let target = piece;
    if (!target) {
      target = await save();
      if (!target) return;
    }
    setScoring(true);
    try {
      const res = await fetch(`/api/content-pieces/${target.id}/score`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scoring failed");
      setPiece(data.piece);
      const total = data.fit_score?.total ?? 0;
      toast.success(
        `Scored ${(total * 100).toFixed(0)}% — ${data.fit_status === "anchor" ? "anchor piece" : data.fit_status === "ship_ready" ? "ship-ready" : "needs revision"}.`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Scoring failed");
    } finally {
      setScoring(false);
    }
  }, [piece, save]);

  // ── Ship ─────────────────────────────────────────────────────────────────
  const ship = useCallback(async () => {
    if (!piece) {
      toast.error("Save the draft first.");
      return;
    }
    if (!fitScore || fitScore.total < 0.75) {
      toast.error("Score must be ≥0.75 to ship. Run Score first or revise.");
      return;
    }
    try {
      const res = await fetch("/api/content-pieces", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: piece.id,
          fit_status: "shipped",
          shipped_at: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ship failed");
      setPiece(data.piece);
      toast.success("Shipped.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ship failed");
    }
  }, [piece, fitScore]);

  const canShip = fitScore && fitScore.total >= 0.75 && fitStatus !== "shipped";

  // ── Refine handlers ──────────────────────────────────────────────────────
  const refine = useCallback(
    async (kind: "viral" | "niche") => {
      if (!hook && !body) {
        toast.error("Write something first.");
        return;
      }
      setRefineLoading(kind);
      try {
        const res = await fetch("/api/agents/brand-director", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: kind === "viral" ? "make_more_viral" : "make_more_niche",
            piece: { platform, hook, body, cta },
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Refine failed");
        setRefineProposal({
          kind,
          hook: data.refined.hook ?? "",
          body: data.refined.body ?? "",
          cta: data.refined.cta ?? "",
          delta_message: data.refined.delta_message ?? "",
          delta_score: data.refined.delta_score,
          reasoning: data.refined.reasoning ?? "",
        });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Refine failed");
      } finally {
        setRefineLoading(null);
      }
    },
    [hook, body, cta, platform],
  );

  const acceptRefine = () => {
    if (!refineProposal) return;
    setHook(refineProposal.hook);
    setBody(refineProposal.body);
    setCta(refineProposal.cta);
    setRefineProposal(null);
    toast.success("Replaced. Save when you're ready.");
  };

  const multiply = useCallback(async () => {
    if (!hook && !body) {
      toast.error("Write something first.");
      return;
    }
    setRefineLoading("multiply");
    try {
      const res = await fetch("/api/agents/brand-director", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "multiply_post",
          piece: { platform, hook, body, cta },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Multiply failed");
      setVariants(data.variants ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Multiply failed");
    } finally {
      setRefineLoading(null);
    }
  }, [hook, body, cta, platform]);

  const saveVariantAsDraft = useCallback(
    async (v: {
      platform: string;
      hook: string;
      body: string;
      cta: string;
    }) => {
      try {
        const res = await fetch("/api/content-pieces", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            platform: v.platform,
            hook: v.hook,
            body: v.body,
            cta: v.cta,
            pillar_id: pillarId || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Save failed");
        toast.success(
          `Saved as new draft for ${v.platform}. Open it from the Scoring panel.`,
        );
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Save failed");
      }
    },
    [pillarId],
  );

  if (loading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link
            href="/execution"
            className="inline-flex items-center text-xs text-white/50 hover:text-white"
          >
            <ArrowLeft className="size-3 mr-1" />
            Back to Weekly Execution
          </Link>
          <h1 className="text-2xl font-bold text-white mt-1">
            {editingId ? "Edit draft" : "New draft"}
          </h1>
          <p className="text-sm text-[#A3A3A3]">
            Pick a pillar, write the piece, score it against your Wiki, ship when ready.
          </p>
        </div>
        <StatusBadge status={fitStatus} />
      </div>

      {fitStatus === "shipped" && piece && (
        <PerformanceSection
          piece={piece}
          onSaved={(updated) => setPiece(updated)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Editor */}
        <Card className="lg:col-span-2 border-white/10 bg-zinc-950/60">
          <CardContent className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="platform">Platform</Label>
                <select
                  id="platform"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full mt-1.5 rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white"
                >
                  {PLATFORM_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="pillar">Pillar</Label>
                <select
                  id="pillar"
                  value={pillarId}
                  onChange={(e) => setPillarId(e.target.value)}
                  className="w-full mt-1.5 rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white"
                >
                  <option value="">— none / freeform —</option>
                  {pillars.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {pillars.length === 0 && (
                  <p className="text-xs text-white/40 mt-1">
                    No pillars yet — fill Module 8 in the Brand Journey to lock 3.
                  </p>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="hook">Hook</Label>
                {hooks.length > 0 && (
                  <HookPicker hooks={hooks} onPick={setHook} />
                )}
              </div>
              <Input
                id="hook"
                value={hook}
                onChange={(e) => setHook(e.target.value)}
                placeholder="The first line. ≤140 chars."
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="body">Body</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="The script / caption / VO. The whole thing."
                rows={8}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="cta">CTA</Label>
              <Input
                id="cta"
                value={cta}
                onChange={(e) => setCta(e.target.value)}
                placeholder="Save the post. / Subscribe. / Reply with...."
                className="mt-1.5"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/5">
              <Button
                onClick={save}
                disabled={saving}
                variant="outline"
                size="sm"
              >
                {saving ? (
                  <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Save className="size-3.5 mr-1.5" />
                )}
                Save
              </Button>
              <Button
                onClick={score}
                disabled={scoring || (!hook && !body)}
                size="sm"
                className="bg-red-600 hover:bg-red-500 text-white"
              >
                {scoring ? (
                  <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                ) : (
                  <CircleGauge className="size-3.5 mr-1.5" />
                )}
                Score against Wiki
              </Button>
              <Button
                onClick={ship}
                disabled={!canShip}
                size="sm"
                variant="outline"
                className={cn(
                  canShip
                    ? "border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10"
                    : "",
                )}
              >
                <Send className="size-3.5 mr-1.5" />
                Ship
              </Button>
            </div>

            {/* ── Refine toolbar ── */}
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/5">
              <span className="text-[10px] uppercase tracking-wider text-white/50 mr-1">
                Director&apos;s refines
              </span>
              <Button
                onClick={() => refine("viral")}
                disabled={!!refineLoading || (!hook && !body)}
                size="sm"
                variant="outline"
                className="border-orange-500/40 text-orange-300 hover:bg-orange-500/10"
              >
                {refineLoading === "viral" ? (
                  <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Zap className="size-3.5 mr-1.5" />
                )}
                More viral
              </Button>
              <Button
                onClick={() => refine("niche")}
                disabled={!!refineLoading || (!hook && !body)}
                size="sm"
                variant="outline"
                className="border-violet-500/40 text-violet-300 hover:bg-violet-500/10"
              >
                {refineLoading === "niche" ? (
                  <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Target className="size-3.5 mr-1.5" />
                )}
                More niche
              </Button>
              <Button
                onClick={multiply}
                disabled={!!refineLoading || (!hook && !body)}
                size="sm"
                variant="outline"
                className="border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10"
              >
                {refineLoading === "multiply" ? (
                  <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Copy className="size-3.5 mr-1.5" />
                )}
                Multiply across platforms
              </Button>
            </div>

            {/* ── Refine proposal (viral / niche) ── */}
            {refineProposal && (
              <RefineProposal
                proposal={refineProposal}
                originalHook={hook}
                originalBody={body}
                originalCta={cta}
                onAccept={acceptRefine}
                onDiscard={() => setRefineProposal(null)}
              />
            )}

            {/* ── Multiply variants ── */}
            {variants && variants.length > 0 && (
              <VariantsList
                variants={variants}
                onClose={() => setVariants(null)}
                onSaveAsDraft={saveVariantAsDraft}
              />
            )}
          </CardContent>
        </Card>

        {/* Score panel */}
        <Card className="border-white/10 bg-zinc-950/60">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm text-[#A3A3A3]">
              <CircleGauge className="size-4" />
              Content Fit
            </div>
            {fitScore ? (
              <>
                <div className="space-y-2">
                  <ScoreBar
                    label="Identity Match"
                    value={fitScore.identity_match}
                  />
                  <ScoreBar
                    label="Emotional Accuracy"
                    value={fitScore.emotional_accuracy}
                  />
                  <ScoreBar
                    label="Audience Relevance"
                    value={fitScore.audience_relevance}
                  />
                  <ScoreBar
                    label="Platform Fit"
                    value={fitScore.platform_fit}
                  />
                </div>
                <div className="pt-3 border-t border-white/5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-white/50">
                      Total
                    </span>
                    <span
                      className={cn(
                        "text-xl font-semibold tabular-nums",
                        fitScore.total >= 0.9
                          ? "text-emerald-300"
                          : fitScore.total >= 0.75
                            ? "text-emerald-400"
                            : fitScore.total >= 0.5
                              ? "text-amber-300"
                              : "text-red-300",
                      )}
                    >
                      {(fitScore.total * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                {fitScore.flags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {fitScore.flags.map((f) => (
                      <Badge
                        key={f}
                        className="bg-red-500/10 border-red-500/30 text-red-300"
                      >
                        {f.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                )}
                {fitScore.suggestions.length > 0 && (
                  <div className="space-y-1.5 pt-3 border-t border-white/5">
                    <p className="text-xs uppercase tracking-wider text-white/50">
                      Director&apos;s suggestions
                    </p>
                    {fitScore.suggestions.map((s, i) => (
                      <div key={i} className="text-xs text-[#D4D4D4]">
                        <span className="text-white/40">
                          {s.dimension.replace(/_/g, " ")}:
                        </span>{" "}
                        {s.suggestion}
                      </div>
                    ))}
                  </div>
                )}
                {fitScore.reasoning && (
                  <p className="text-xs italic text-white/50 leading-relaxed pt-2 border-t border-white/5">
                    {fitScore.reasoning}
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-white/50">
                Score this piece to see Identity / Emotional / Audience / Platform fit.
                Below 0.75 = revise. ≥0.75 = ship-ready. ≥0.90 = anchor piece.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    draft: { label: "Draft", className: "bg-white/5 border-white/10 text-white/70" },
    revise: { label: "Revise", className: "bg-amber-500/15 border-amber-500/30 text-amber-300" },
    ship_ready: { label: "Ship-ready", className: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300" },
    anchor: { label: "Anchor piece", className: "bg-violet-500/15 border-violet-500/30 text-violet-300" },
    shipped: { label: "Shipped", className: "bg-cyan-500/15 border-cyan-500/30 text-cyan-300" },
    archived: { label: "Archived", className: "bg-white/5 border-white/10 text-white/40" },
  };
  const m = map[status] ?? map.draft;
  return <Badge className={m.className}>{m.label}</Badge>;
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  const color =
    value >= 0.75 ? "bg-emerald-400" : value >= 0.5 ? "bg-amber-400" : "bg-red-400";
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-[#D4D4D4]">{label}</span>
        <span className="text-white/60 tabular-nums">{pct}%</span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className={cn("h-full transition-all", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function PerformanceSection({
  piece,
  onSaved,
}: {
  piece: ContentPiece;
  onSaved: (p: ContentPiece) => void;
}) {
  const initial = piece.performance ?? {};
  const [views, setViews] = useState<string>(numStr(initial.views));
  const [saves, setSaves] = useState<string>(numStr(initial.saves));
  const [replies, setReplies] = useState<string>(numStr(initial.replies));
  const [sends, setSends] = useState<string>(numStr(initial.sends));
  const [followsFrom, setFollowsFrom] = useState<string>(
    numStr(initial.follows_from),
  );
  const [salesAttributed, setSalesAttributed] = useState<string>(
    numStr(initial.sales_attributed),
  );
  const [externalUrl, setExternalUrl] = useState<string>(piece.external_url ?? "");
  const [savingPerf, setSavingPerf] = useState(false);

  const save = async () => {
    setSavingPerf(true);
    try {
      const performance: PiecePerformance = {
        views: parseIntOrZero(views),
        saves: parseIntOrZero(saves),
        replies: parseIntOrZero(replies),
        sends: parseIntOrZero(sends),
        follows_from: parseIntOrZero(followsFrom),
        sales_attributed: parseIntOrZero(salesAttributed),
      };
      const res = await fetch("/api/content-pieces", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: piece.id,
          performance,
          external_url: externalUrl || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      onSaved(data.piece);
      toast.success("Performance saved.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingPerf(false);
    }
  };

  return (
    <Card className="border-white/10 bg-zinc-950/60">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-white">
              Performance entry
            </h2>
            <p className="text-xs text-white/50">
              Numbers feed the Weekly Feedback Loop. Update whenever — last
              entry wins.
            </p>
          </div>
          <Button
            onClick={save}
            disabled={savingPerf}
            variant="outline"
            size="sm"
          >
            {savingPerf ? (
              <Loader2 className="size-3.5 mr-1.5 animate-spin" />
            ) : (
              <Save className="size-3.5 mr-1.5" />
            )}
            Save metrics
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <NumberField label="Views" value={views} onChange={setViews} />
          <NumberField label="Saves" value={saves} onChange={setSaves} />
          <NumberField label="Replies" value={replies} onChange={setReplies} />
          <NumberField label="Sends" value={sends} onChange={setSends} />
          <NumberField
            label="Follows from"
            value={followsFrom}
            onChange={setFollowsFrom}
          />
          <NumberField
            label="Sales attributed"
            value={salesAttributed}
            onChange={setSalesAttributed}
          />
        </div>

        <div>
          <Label htmlFor="external_url">External URL (the live post)</Label>
          <Input
            id="external_url"
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            placeholder="https://www.instagram.com/reel/..."
            className="mt-1.5"
            type="url"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label className="text-xs text-white/60">{label}</Label>
      <Input
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 tabular-nums"
      />
    </div>
  );
}

function numStr(n: number | undefined): string {
  return typeof n === "number" && Number.isFinite(n) ? String(n) : "";
}

function parseIntOrZero(s: string): number {
  const n = parseInt(s, 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function RefineProposal({
  proposal,
  originalHook,
  originalBody,
  originalCta,
  onAccept,
  onDiscard,
}: {
  proposal: {
    kind: "viral" | "niche";
    hook: string;
    body: string;
    cta: string;
    delta_message: string;
    delta_score: number | null;
    reasoning: string;
  };
  originalHook: string;
  originalBody: string;
  originalCta: string;
  onAccept: () => void;
  onDiscard: () => void;
}) {
  const accent =
    proposal.kind === "viral"
      ? { border: "border-orange-500/40", text: "text-orange-300", label: "More viral" }
      : { border: "border-violet-500/40", text: "text-violet-300", label: "More niche" };

  return (
    <Card className={cn("mt-3", accent.border, "bg-zinc-950/60")}>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className={accent.text}>{accent.label}</span>
            {typeof proposal.delta_score === "number" && (
              <span className="text-xs text-white/50 tabular-nums">
                Δ {proposal.delta_score >= 0 ? "+" : ""}
                {proposal.delta_score.toFixed(2)}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onDiscard}
              className="border-white/10"
            >
              <X className="size-3.5 mr-1" />
              Keep mine
            </Button>
            <Button
              size="sm"
              onClick={onAccept}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <Check className="size-3.5 mr-1" />
              Accept
            </Button>
          </div>
        </div>

        {proposal.delta_message && (
          <p className="text-xs text-white/60 italic">
            {proposal.delta_message}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <DiffColumn label="Original" hook={originalHook} body={originalBody} cta={originalCta} muted />
          <DiffColumn
            label="Proposed"
            hook={proposal.hook}
            body={proposal.body}
            cta={proposal.cta}
            accent={accent.text}
          />
        </div>

        {proposal.reasoning && (
          <p className="text-xs text-white/40 italic pt-2 border-t border-white/5">
            Director&apos;s reasoning: {proposal.reasoning}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function DiffColumn({
  label,
  hook,
  body,
  cta,
  muted,
  accent,
}: {
  label: string;
  hook: string;
  body: string;
  cta: string;
  muted?: boolean;
  accent?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-md border p-3 space-y-2",
        muted ? "border-white/5 bg-white/[0.02]" : "border-white/10 bg-black/30",
      )}
    >
      <p
        className={cn(
          "text-[10px] uppercase tracking-wider",
          accent ?? "text-white/50",
        )}
      >
        {label}
      </p>
      <div className="space-y-1.5 text-xs text-[#D4D4D4]">
        {hook && (
          <p>
            <span className="text-white/40 mr-1">hook:</span>
            {hook}
          </p>
        )}
        {body && (
          <p className="whitespace-pre-line">
            <span className="text-white/40 mr-1">body:</span>
            {body}
          </p>
        )}
        {cta && (
          <p>
            <span className="text-white/40 mr-1">cta:</span>
            {cta}
          </p>
        )}
      </div>
    </div>
  );
}

function VariantsList({
  variants,
  onClose,
  onSaveAsDraft,
}: {
  variants: Array<{
    platform: string;
    hook: string;
    body: string;
    cta: string;
    notes: string;
  }>;
  onClose: () => void;
  onSaveAsDraft: (v: { platform: string; hook: string; body: string; cta: string }) => void | Promise<void>;
}) {
  return (
    <Card className="mt-3 border-cyan-500/30 bg-zinc-950/60">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-cyan-300">
            <Copy className="size-4" />
            Platform variants ({variants.length})
          </div>
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="size-3.5" />
          </Button>
        </div>
        <ul className="space-y-3">
          {variants.map((v, i) => (
            <li
              key={i}
              className="rounded-md border border-white/5 bg-white/[0.02] p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-cyan-300">
                  {v.platform}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSaveAsDraft(v)}
                >
                  <Save className="size-3 mr-1" />
                  Save as new draft
                </Button>
              </div>
              <div className="space-y-1 text-xs text-[#D4D4D4]">
                {v.hook && (
                  <p>
                    <span className="text-white/40 mr-1">hook:</span>
                    {v.hook}
                  </p>
                )}
                {v.body && (
                  <p className="whitespace-pre-line">
                    <span className="text-white/40 mr-1">body:</span>
                    {v.body}
                  </p>
                )}
                {v.cta && (
                  <p>
                    <span className="text-white/40 mr-1">cta:</span>
                    {v.cta}
                  </p>
                )}
              </div>
              {v.notes && (
                <p className="text-[11px] text-white/40 italic">{v.notes}</p>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function HookPicker({
  hooks,
  onPick,
}: {
  hooks: HookTemplate[];
  onPick: (text: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const sample = useMemo(
    () => hooks.slice(0, 10),
    [hooks],
  );
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center text-xs text-white/60 hover:text-white"
      >
        <Sparkles className="size-3 mr-1" />
        From your library
      </button>
      {open && (
        <div className="absolute right-0 top-6 z-10 w-80 rounded-md border border-white/10 bg-zinc-950 shadow-lg p-2 max-h-72 overflow-y-auto">
          {sample.length === 0 ? (
            <p className="text-xs text-white/50 p-2">
              No hooks yet — generate them in Module 8.
            </p>
          ) : (
            sample.map((h) => (
              <button
                key={h.id}
                onClick={() => {
                  onPick(h.text);
                  setOpen(false);
                }}
                className="block w-full text-left text-xs text-[#D4D4D4] px-2 py-1.5 rounded hover:bg-white/5"
              >
                {h.text}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
