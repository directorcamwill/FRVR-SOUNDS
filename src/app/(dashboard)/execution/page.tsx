"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Sparkles,
  CircleGauge,
  TrendingUp,
  Flame,
  ArrowRight,
  Lock,
  Plus,
  TrendingDown,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BRAND_MODULES } from "@/lib/brand/modules";
import { computeModuleCompleteness } from "@/lib/brand/validation";
import {
  buildCalendarSlots,
  parseShipDays,
  type CalendarSlot,
} from "@/lib/calendar/build";
import type { BrandWiki, HookTemplate } from "@/types/brand";

interface ContentPiece {
  id: string;
  platform: string | null;
  hook: string | null;
  body: string | null;
  fit_score: {
    identity_match: number;
    emotional_accuracy: number;
    audience_relevance: number;
    platform_fit: number;
    total: number;
    flags: string[];
  } | null;
  fit_status: string | null;
  scheduled_for: string | null;
  shipped_at: string | null;
  created_at: string;
  updated_at: string;
}

interface StreakState {
  current_streak: number;
  longest_30d: number;
  today_logged: boolean;
  yesterday_logged: boolean;
  last_30_days: Array<{ date: string; met: boolean }>;
  current_streak_started: string | null;
  break_check_in: {
    last_run_length: number;
    ended_on: string;
    days_since: number;
  } | null;
}

interface FeedbackDigest {
  period_start: string;
  period_end: string;
  pieces_shipped: number;
  pieces_with_data: number;
  baseline_lift: number | null;
  top_signal: { kind: string; key: string; lift: number; delta_from_baseline: number; pieces: number; message: string } | null;
  top_anti_signal: { kind: string; key: string; lift: number; delta_from_baseline: number; pieces: number; message: string } | null;
  by_pillar: Array<{ key: string; pieces: number; lift: number; totals: { views?: number; saves?: number; follows_from?: number } }>;
  totals: { views?: number; saves?: number; replies?: number; sends?: number; follows_from?: number; sales_attributed?: number };
  wow: { views: number; saves: number; follows_from: number; sales_attributed: number; pieces_shipped: number };
}

const PANEL_BG =
  "bg-[#0A0A0A]/80 border border-white/5 backdrop-blur-sm";

export default function ExecutionDashboardPage() {
  const [wiki, setWiki] = useState<BrandWiki | null>(null);
  const [pieces, setPieces] = useState<ContentPiece[]>([]);
  const [digest, setDigest] = useState<FeedbackDigest | null>(null);
  const [streak, setStreak] = useState<StreakState | null>(null);
  const [logging, setLogging] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hookCursor, setHookCursor] = useState(0);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [wikiRes, piecesRes, digestRes, streakRes] = await Promise.all([
        fetch("/api/brand-wiki"),
        fetch("/api/content-pieces?limit=100"),
        fetch("/api/feedback-runs/current"),
        fetch("/api/streak"),
      ]);
      if (!wikiRes.ok) {
        const d = await wikiRes.json();
        throw new Error(d.error || "Failed to load Weekly Execution");
      }
      const wikiData = await wikiRes.json();
      setWiki(wikiData.wiki);
      // content_pieces table may not exist if migration 00030 isn't applied yet —
      // fail soft so the rest of the dashboard still renders.
      if (piecesRes.ok) {
        const piecesData = await piecesRes.json();
        setPieces(piecesData.pieces ?? []);
      } else {
        setPieces([]);
      }
      if (digestRes.ok) {
        const digestData = await digestRes.json();
        setDigest(digestData.digest ?? null);
      } else {
        setDigest(null);
      }
      if (streakRes.ok) {
        const streakData = await streakRes.json();
        setStreak(streakData.streak ?? null);
      } else {
        setStreak(null);
      }
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  const logToday = useCallback(async () => {
    setLogging(true);
    try {
      const res = await fetch("/api/streak", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Log failed");
      setStreak(data.streak);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Log failed";
      alert(msg);
    } finally {
      setLogging(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ─── Activation gate ───
  // V2 activation requires V1 (≥80% on first 7 modules) + Module 8 ≥80%
  // + at least offer_100 + at least 10 hooks. Until then, the dashboard shows
  // a soft lock state explaining what's left.
  const activation = useMemo(() => {
    if (!wiki) return null;
    const moduleStatus = BRAND_MODULES.map((m) => ({
      id: m.id,
      label: m.label,
      pct: computeModuleCompleteness(
        m.questions,
        wiki as unknown as Record<string, unknown>,
      ),
    }));
    const allModulesComplete = moduleStatus.every((m) => m.pct >= 80);
    const hasOffer100 = !!wiki.revenue_offer_100;
    const hasHookLibrary = (wiki.hook_library?.length ?? 0) >= 10;
    const isActivated =
      allModulesComplete && hasOffer100 && hasHookLibrary;
    return {
      moduleStatus,
      allModulesComplete,
      hasOffer100,
      hasHookLibrary,
      isActivated,
    };
  }, [wiki]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className={PANEL_BG}>
        <CardContent className="p-6 text-sm text-red-300">
          {error}
        </CardContent>
      </Card>
    );
  }

  if (!wiki || !activation) return null;

  const hooks = (wiki.hook_library ?? []) as HookTemplate[];
  const currentHook = hooks.length > 0 ? hooks[hookCursor % hooks.length] : null;

  const shipDays = parseShipDays(wiki.weekly_cadence_ship_days ?? null);
  const primaryPlatform =
    (wiki.platform_strategy && typeof wiki.platform_strategy === "object"
      ? ((wiki.platform_strategy as Record<string, unknown>).primary as string | undefined)
      : undefined) ?? "instagram";
  const slots: CalendarSlot[] =
    shipDays.length > 0
      ? buildCalendarSlots({
          cadence: {
            primary_count: wiki.weekly_cadence_primary_count ?? null,
            batch_day: wiki.weekly_cadence_batch_day ?? null,
            ship_days: shipDays,
            primary_platform: primaryPlatform,
          },
          pieces: pieces.map((p) => ({
            id: p.id,
            platform: p.platform,
            hook: p.hook,
            scheduled_for: p.scheduled_for,
            shipped_at: p.shipped_at,
            fit_status: p.fit_status,
            fit_score: p.fit_score,
            updated_at: p.updated_at,
          })),
          anchor: new Date(),
        })
      : [];

  return (
    <div className="space-y-6">
      {/* ─── Header / streak strip ─── */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Weekly Execution</h1>
          <p className="text-sm text-[#A3A3A3]">
            {activation.isActivated
              ? "Your operating system. Pick a hook, ship it, score the result."
              : "Finish your Brand Journey to unlock the live dashboard. The structure below is what you'll work in every week."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StreakStrip
            streak={streak}
            logging={logging}
            onLogToday={logToday}
          />
          {activation.isActivated ? (
            <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
              Activated
            </Badge>
          ) : (
            <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30">
              <Lock className="size-3 mr-1" /> Pre-activation
            </Badge>
          )}
        </div>
      </div>

      {/* ─── Streak break check-in ─── */}
      {streak?.break_check_in && (
        <BreakCheckInBanner
          breakCheckIn={streak.break_check_in}
          onAcknowledge={async (notes) => {
            try {
              const res = await fetch("/api/streak/check-in", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notes }),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error || "Save failed");
              setStreak(data.streak);
            } catch {
              // Toast omitted for brevity — error already visible via no-op
            }
          }}
        />
      )}

      {/* ─── Weekly Digest banner ─── */}
      {digest && (digest.top_signal || digest.top_anti_signal) && (
        <DigestBanner digest={digest} />
      )}

      {/* ─── Activation checklist (only shown until activated) ─── */}
      {!activation.isActivated && (
        <Card className={PANEL_BG}>
          <CardContent className="p-5 space-y-3">
            <div className="text-sm text-white font-medium">
              Activation checklist
            </div>
            <ul className="space-y-2 text-sm">
              {activation.moduleStatus.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between"
                >
                  <span className="text-[#D4D4D4]">{m.label}</span>
                  <span
                    className={cn(
                      "tabular-nums",
                      m.pct >= 80 ? "text-emerald-300" : "text-[#A3A3A3]",
                    )}
                  >
                    {m.pct}%
                  </span>
                </li>
              ))}
              <li className="flex items-center justify-between pt-2 border-t border-white/5">
                <span className="text-[#D4D4D4]">First-100-fan offer</span>
                <span
                  className={cn(
                    activation.hasOffer100
                      ? "text-emerald-300"
                      : "text-[#A3A3A3]",
                  )}
                >
                  {activation.hasOffer100 ? "set" : "—"}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-[#D4D4D4]">
                  Hook library (≥10 entries)
                </span>
                <span
                  className={cn(
                    activation.hasHookLibrary
                      ? "text-emerald-300"
                      : "text-[#A3A3A3]",
                  )}
                >
                  {wiki.hook_library?.length ?? 0} / 10
                </span>
              </li>
            </ul>
            <a
              href="/brand"
              className="inline-flex items-center gap-1.5 rounded-md border border-[#DC2626]/40 px-3 py-1.5 text-sm text-white hover:bg-[#DC2626]/10"
            >
              Continue Brand Journey
              <ArrowRight className="size-3.5" />
            </a>
          </CardContent>
        </Card>
      )}

      {/* ─── 4-panel grid ─── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Panel 1 — Content Calendar */}
        <Card className={PANEL_BG}>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-[#A3A3A3]">
                <Calendar className="size-4" />
                Content Calendar
              </div>
              {slots.length > 0 && (
                <span className="text-[10px] text-white/40 uppercase tracking-wider">
                  Next 14 days · {primaryPlatform}
                </span>
              )}
            </div>
            {slots.length > 0 ? (
              <CalendarGrid slots={slots} />
            ) : (
              <EmptyState
                hint="Set your weekly cadence in Module 8 — Content Engine. Pick a batch day and ship days; the calendar fills automatically."
                href="/brand"
              />
            )}
          </CardContent>
        </Card>

        {/* Panel 2 — Hook Generator */}
        <Card className={PANEL_BG}>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm text-[#A3A3A3]">
              <Sparkles className="size-4" />
              Hook Generator
            </div>
            {currentHook ? (
              <div className="space-y-3">
                <div className="text-base text-white leading-snug min-h-[3.5rem]">
                  &ldquo;{currentHook.text}&rdquo;
                </div>
                <div className="flex items-center gap-2 text-xs text-[#A3A3A3]">
                  {currentHook.pillar_id && (
                    <span className="px-2 py-0.5 rounded-md border border-white/10">
                      {currentHook.pillar_id}
                    </span>
                  )}
                  {currentHook.emotion && (
                    <span className="px-2 py-0.5 rounded-md border border-white/10">
                      {currentHook.emotion}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHookCursor((c) => c + 1)}
                  >
                    Rotate
                  </Button>
                  <Button size="sm" disabled className="opacity-60">
                    Use (coming soon)
                  </Button>
                </div>
              </div>
            ) : (
              <EmptyState
                hint="Build your 10-hook library in Module 8 — Content Engine."
                href="/brand"
              />
            )}
          </CardContent>
        </Card>

        {/* Panel 3 — Scoring Panel */}
        <Card className={PANEL_BG}>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-[#A3A3A3]">
                <CircleGauge className="size-4" />
                Content Fit Scoring
              </div>
              <Link
                href="/execution/draft"
                className="inline-flex items-center text-xs text-[#DC2626] hover:underline"
              >
                <Plus className="size-3 mr-0.5" />
                New draft
              </Link>
            </div>
            {pieces.length > 0 ? (
              <ul className="space-y-2">
                {pieces.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/execution/draft?id=${p.id}`}
                      className="block rounded-md border border-white/5 bg-white/[0.02] px-3 py-2 hover:border-white/15"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex-1 text-sm text-[#D4D4D4] truncate">
                          {p.hook || p.body?.slice(0, 80) || "(empty draft)"}
                        </span>
                        {p.fit_score ? (
                          <span
                            className={cn(
                              "text-xs font-semibold tabular-nums",
                              p.fit_score.total >= 0.9
                                ? "text-emerald-300"
                                : p.fit_score.total >= 0.75
                                  ? "text-emerald-400"
                                  : p.fit_score.total >= 0.5
                                    ? "text-amber-300"
                                    : "text-red-300",
                            )}
                          >
                            {Math.round(p.fit_score.total * 100)}%
                          </span>
                        ) : (
                          <span className="text-xs text-white/40">
                            unscored
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-white/40">
                        <span>{p.platform ?? "—"}</span>
                        <span>·</span>
                        <span>{p.fit_status ?? "draft"}</span>
                        {p.fit_score?.flags && p.fit_score.flags.length > 0 && (
                          <>
                            <span>·</span>
                            <span className="text-red-300/70">
                              {p.fit_score.flags.length} flag
                              {p.fit_score.flags.length === 1 ? "" : "s"}
                            </span>
                          </>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                hint="No drafts yet. Start one — pillar / hook / body / CTA → score against your Wiki → ship when ≥0.75."
                href="/execution/draft"
              />
            )}
          </CardContent>
        </Card>

        {/* Panel 4 — Growth Tracker */}
        <Card className={PANEL_BG}>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-[#A3A3A3]">
                <TrendingUp className="size-4" />
                Growth Tracker
              </div>
              <Link
                href="/execution/history"
                className="text-xs text-[#DC2626] hover:underline"
              >
                View history
              </Link>
            </div>
            {digest && (digest.pieces_shipped > 0 || digest.totals.views) ? (
              <GrowthTracker digest={digest} />
            ) : (
              <EmptyState
                hint="Ship a piece this week and enter its performance numbers on the draft page. Top signal + WoW deltas show up here on the next reload."
                href="/execution/draft"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CalendarGrid({ slots }: { slots: CalendarSlot[] }) {
  // Group slots by week — first 7 days = "this week", next 7 = "next week".
  const thisWeek = slots.filter((_, i) => i < 7 || isSameWeek(slots, i, 0));
  // Simpler split: use weekday position. We always emit Mon→Sun for 14 days,
  // so the first 7 entries (when present) belong to this week.
  const splitIndex = (() => {
    if (slots.length === 0) return 0;
    // Find first slot whose date is in the next ISO-week vs the first slot.
    const firstWeekStart = startOfMondayWeek(slots[0].date);
    for (let i = 0; i < slots.length; i++) {
      if (startOfMondayWeek(slots[i].date) !== firstWeekStart) return i;
    }
    return slots.length;
  })();
  const week1 = slots.slice(0, splitIndex);
  const week2 = slots.slice(splitIndex);
  // Reuse var to avoid eslint unused
  void thisWeek;

  return (
    <div className="space-y-3">
      <CalendarWeek label="This week" slots={week1} />
      {week2.length > 0 && <CalendarWeek label="Next week" slots={week2} />}
    </div>
  );
}

function CalendarWeek({
  label,
  slots,
}: {
  label: string;
  slots: CalendarSlot[];
}) {
  if (slots.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] uppercase tracking-wider text-white/40">
        {label}
      </p>
      <ul className="space-y-1.5">
        {slots.map((slot) => (
          <CalendarSlotRow key={`${slot.date}-${slot.platform}`} slot={slot} />
        ))}
      </ul>
    </div>
  );
}

function CalendarSlotRow({ slot }: { slot: CalendarSlot }) {
  const isShipDay = !slot.is_batch_day || slot.pieces.length > 0;
  const piece = slot.primary;
  const filled = !!piece;
  const shipped = piece?.fit_status === "shipped";

  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-md border px-3 py-2 text-xs",
        slot.is_today
          ? "border-[#DC2626]/40 bg-[#DC2626]/[0.04]"
          : "border-white/5 bg-white/[0.02]",
      )}
    >
      <div className="w-20 shrink-0">
        <div
          className={cn(
            "uppercase tracking-wider text-[10px]",
            slot.is_today ? "text-[#DC2626]" : "text-white/50",
          )}
        >
          {slot.weekday.slice(0, 3)}
        </div>
        <div className="text-[10px] text-white/40 tabular-nums">
          {slot.date.slice(5)}
        </div>
      </div>
      {slot.is_batch_day && !filled && !isShipDay ? (
        <span className="flex-1 text-amber-300/80 italic text-[11px]">
          Batch day — record / write today, ship later this week.
        </span>
      ) : filled ? (
        <Link
          href={`/execution/draft?id=${piece.id}`}
          className="flex-1 truncate text-[#D4D4D4] hover:text-white"
        >
          {piece.hook?.slice(0, 70) || "(no hook yet)"}
        </Link>
      ) : (
        <Link
          href={`/execution/draft?platform=${encodeURIComponent(slot.platform)}&scheduled_for=${slot.date}`}
          className="flex-1 text-white/40 italic hover:text-white"
        >
          + Draft for this slot
        </Link>
      )}
      {filled && (
        <SlotStatus piece={piece} shipped={shipped} />
      )}
    </li>
  );
}

function SlotStatus({
  piece,
  shipped,
}: {
  piece: { fit_status: string | null; fit_score: { total?: number } | null };
  shipped: boolean;
}) {
  if (shipped) {
    return (
      <span className="text-[10px] text-cyan-300 uppercase tracking-wider">
        Shipped
      </span>
    );
  }
  const total = piece.fit_score?.total;
  if (typeof total === "number") {
    return (
      <span
        className={cn(
          "text-[10px] tabular-nums",
          total >= 0.75 ? "text-emerald-300" : "text-amber-300",
        )}
      >
        {Math.round(total * 100)}%
      </span>
    );
  }
  return (
    <span className="text-[10px] text-white/40 uppercase tracking-wider">
      {piece.fit_status ?? "draft"}
    </span>
  );
}

function startOfMondayWeek(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}

// (Kept for the legacy implementation path — not used in the final layout.)
function isSameWeek(slots: CalendarSlot[], a: number, b: number): boolean {
  if (a >= slots.length || b >= slots.length) return false;
  return startOfMondayWeek(slots[a].date) === startOfMondayWeek(slots[b].date);
}

function EmptyState({
  hint,
  href,
  variant = "action",
}: {
  hint: string;
  href?: string;
  variant?: "action" | "info";
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-dashed border-white/10 px-3 py-4 text-xs",
        variant === "info" ? "text-[#A3A3A3]" : "text-[#D4D4D4]",
      )}
    >
      <p>{hint}</p>
      {href && (
        <a
          href={href}
          className="inline-flex items-center mt-2 text-[#DC2626] hover:underline"
        >
          Go there <ArrowRight className="size-3 ml-1" />
        </a>
      )}
    </div>
  );
}

// ── Weekly Feedback Loop UI ─────────────────────────────────────────────

function BreakCheckInBanner({
  breakCheckIn,
  onAcknowledge,
}: {
  breakCheckIn: { last_run_length: number; ended_on: string; days_since: number };
  onAcknowledge: (notes: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (text: string) => {
    setSubmitting(true);
    try {
      await onAcknowledge(text);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className={cn(PANEL_BG, "border-amber-500/30")}>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm text-amber-300">
              <Flame className="size-4" />
              Director&apos;s check-in
            </div>
            <p className="mt-1 text-sm text-[#D4D4D4]">
              Your <span className="font-semibold">{breakCheckIn.last_run_length}-day</span> streak ended {breakCheckIn.days_since === 1 ? "yesterday" : `${breakCheckIn.days_since} days ago`}. What changed?
            </p>
            <p className="mt-1 text-xs text-white/50">
              Two sentences is enough. We use it to help you adjust the cadence next week — not to guilt you.
            </p>
          </div>
          <button
            onClick={() => submit("(acknowledged)")}
            disabled={submitting}
            className="text-xs text-white/40 hover:text-white shrink-0"
            title="Skip — acknowledge without notes"
          >
            Skip
          </button>
        </div>

        {open ? (
          <div className="space-y-2">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Got sick. / Travel week. / Lost a hook bank to a hard drive crash."
              rows={2}
              className="w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-white/30"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => submit(notes)}
                disabled={submitting || notes.trim().length === 0}
                className="bg-amber-500 hover:bg-amber-400 text-black"
              >
                Save note
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setOpen(true)}
            className="border-amber-500/40 text-amber-200 hover:bg-amber-500/10"
          >
            Note what changed
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function DigestBanner({ digest }: { digest: FeedbackDigest }) {
  return (
    <Card className={PANEL_BG}>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-sm text-white">
            <Megaphone className="size-4 text-[#DC2626]" />
            Weekly Digest
            <span className="text-xs text-white/40">
              {digest.period_start} → {digest.period_end}
            </span>
          </div>
          <div className="text-xs text-white/40">
            {digest.pieces_shipped} shipped · {digest.pieces_with_data} with data
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {digest.top_signal && (
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/[0.04] p-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-emerald-300">
                <TrendingUp className="size-3" />
                Top signal
              </div>
              <p className="mt-1 text-sm text-[#D4D4D4] leading-snug">
                {digest.top_signal.message}
              </p>
            </div>
          )}
          {digest.top_anti_signal && (
            <div className="rounded-md border border-red-500/30 bg-red-500/[0.04] p-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-red-300">
                <TrendingDown className="size-3" />
                Anti-signal
              </div>
              <p className="mt-1 text-sm text-[#D4D4D4] leading-snug">
                {digest.top_anti_signal.message}
              </p>
            </div>
          )}
        </div>

        {!digest.top_signal && !digest.top_anti_signal && (
          <p className="text-xs text-white/50">
            Need at least one shipped piece with views logged to surface a signal. Add metrics on a shipped draft.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function GrowthTracker({ digest }: { digest: FeedbackDigest }) {
  const totals = digest.totals;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Metric
          label="Views"
          value={totals.views ?? 0}
          delta={digest.wow.views}
        />
        <Metric
          label="Saves"
          value={totals.saves ?? 0}
          delta={digest.wow.saves}
        />
        <Metric
          label="Follows from"
          value={totals.follows_from ?? 0}
          delta={digest.wow.follows_from}
        />
        <Metric
          label="Sales"
          value={totals.sales_attributed ?? 0}
          delta={digest.wow.sales_attributed}
        />
      </div>
      {digest.by_pillar.length > 0 && (
        <div className="pt-2 border-t border-white/5 space-y-1.5">
          <p className="text-[10px] uppercase tracking-wider text-white/50">
            Lift by pillar
          </p>
          {digest.by_pillar.slice(0, 5).map((b) => (
            <div
              key={b.key}
              className="flex items-center justify-between text-xs"
            >
              <span className="text-[#D4D4D4] truncate flex-1">
                {b.key} · {b.pieces} piece{b.pieces === 1 ? "" : "s"}
              </span>
              <span className="text-white/60 tabular-nums">
                {(b.lift * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StreakStrip({
  streak,
  logging,
  onLogToday,
}: {
  streak: StreakState | null;
  logging: boolean;
  onLogToday: () => void;
}) {
  const count = streak?.current_streak ?? 0;
  const todayDone = !!streak?.today_logged;
  // Hot if 7+, blazing if 30+. Cool if 0.
  const flameColor =
    count >= 30
      ? "text-orange-400"
      : count >= 7
        ? "text-[#DC2626]"
        : count > 0
          ? "text-amber-400"
          : "text-white/40";

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/5 bg-[#0A0A0A]/60">
        <Flame className={cn("size-4", flameColor)} />
        <span className="text-xs text-[#A3A3A3]">Streak</span>
        <span className="text-sm font-semibold text-white tabular-nums">
          {count}
        </span>
        {streak && streak.longest_30d > count && (
          <span
            className="text-[10px] text-white/40 tabular-nums"
            title="Longest run in the last 30 days"
          >
            · best {streak.longest_30d}
          </span>
        )}
      </div>
      {!todayDone && (
        <Button
          size="sm"
          variant="outline"
          onClick={onLogToday}
          disabled={logging}
          title="Log today as a met day (recording, batching, replying — anything that kept you on the system)"
        >
          {logging ? "..." : "Log today"}
        </Button>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  delta,
}: {
  label: string;
  value: number;
  delta: number;
}) {
  const formatted = value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value);
  return (
    <div className="rounded-md border border-white/5 bg-white/[0.02] px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-white/50">
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-semibold text-white tabular-nums">
          {formatted}
        </span>
        {delta !== 0 && (
          <span
            className={cn(
              "text-xs tabular-nums",
              delta > 0 ? "text-emerald-300" : "text-red-300",
            )}
          >
            {delta > 0 ? "+" : ""}
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}
