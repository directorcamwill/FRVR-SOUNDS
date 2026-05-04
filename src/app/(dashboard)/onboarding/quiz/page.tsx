"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Loader2,
  GripVertical,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  QUIZ_QUESTIONS,
  type QuizQuestion,
  type QuizResponses,
  type RecommendedTier,
  type TierSignals,
  tierLabel,
  tierTagline,
} from "@/lib/onboarding/quiz";

interface SavedQuizResponse {
  responses: QuizResponses;
  tier_signals: TierSignals | null;
  recommended_plan_id: string | null;
  completed_at: string | null;
}

export default function OnboardingQuizPage() {
  const [stepIdx, setStepIdx] = useState(0);
  const [responses, setResponses] = useState<QuizResponses>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    tier: RecommendedTier;
    signals: TierSignals;
  } | null>(null);

  const total = QUIZ_QUESTIONS.length;
  const q = QUIZ_QUESTIONS[stepIdx];

  // Hydrate any prior submission so re-takes prefill.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/onboarding/quiz");
        if (!res.ok) return;
        const data = await res.json();
        const prior: SavedQuizResponse | null = data?.response ?? null;
        if (!prior || cancelled) return;
        setResponses(prior.responses ?? {});
        if (prior.completed_at && prior.tier_signals?.recommendation) {
          setResult({
            tier: prior.tier_signals.recommendation,
            signals: prior.tier_signals,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setAnswer = useCallback((id: string, value: string | string[]) => {
    setResponses((prev) => ({ ...prev, [id]: value }) as QuizResponses);
  }, []);

  const currentValue: unknown = (responses as Record<string, unknown>)[q.id];

  const canAdvance = useMemo(() => {
    if (!q.required) return true;
    if (q.type === "rank") {
      return Array.isArray(currentValue) && currentValue.length === (q.options?.length ?? 0);
    }
    return typeof currentValue === "string" && currentValue.trim().length > 0;
  }, [q, currentValue]);

  const submit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/onboarding/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submit failed");
      setResult({
        tier: data.tier_signals.recommendation,
        signals: data.tier_signals,
      });
      toast.success("Recommendation ready.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Submit failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (result) {
    return <ResultView tier={result.tier} signals={result.signals} onRetake={() => { setResult(null); setStepIdx(0); }} />;
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">
          Onboarding · Behavioral Quiz
        </p>
        <h1 className="text-2xl font-bold text-white">
          10 questions. We recommend a tier.
        </h1>
        <p className="text-sm text-[#A3A3A3] mt-1">
          Answer honestly — the system shrinks to fit your real cadence and revenue maturity. You can retake this anytime.
        </p>
      </div>

      <Card className="border-white/10 bg-zinc-950/60">
        <CardContent className="p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-white/50">
            <span>
              Question {stepIdx + 1} of {total}
            </span>
            <span>{q.measures}</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-white tracking-tight leading-snug">
              {q.prompt}
            </h2>
            {q.help && <p className="text-sm text-white/50">{q.help}</p>}
          </div>

          <QuestionInput
            q={q}
            value={currentValue}
            onChange={(v) => setAnswer(q.id, v)}
          />

          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
              disabled={stepIdx === 0}
            >
              <ChevronLeft className="size-4 mr-1" />
              Prev
            </Button>
            {stepIdx < total - 1 ? (
              <Button
                size="sm"
                onClick={() => setStepIdx((i) => i + 1)}
                disabled={!canAdvance}
                className="bg-red-600 hover:bg-red-500 text-white"
              >
                Next
                <ChevronRight className="size-4 ml-1" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={submit}
                disabled={!canAdvance || submitting}
                className="bg-red-600 hover:bg-red-500 text-white"
              >
                {submitting ? (
                  <Loader2 className="size-4 mr-1 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-4 mr-1" />
                )}
                Get my tier
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <ProgressDots total={total} current={stepIdx} />
    </div>
  );
}

function QuestionInput({
  q,
  value,
  onChange,
}: {
  q: QuizQuestion;
  value: unknown;
  onChange: (v: string | string[]) => void;
}) {
  if (q.type === "single_select") {
    const v = typeof value === "string" ? value : "";
    return (
      <div className="space-y-2">
        {(q.options ?? []).map((opt) => {
          const selected = v === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={cn(
                "w-full text-left rounded-md border px-4 py-3 text-sm transition-colors",
                selected
                  ? "border-[#DC2626] bg-[#DC2626]/10 text-white"
                  : "border-white/10 bg-white/[0.02] text-[#D4D4D4] hover:border-white/20",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    );
  }

  if (q.type === "url") {
    const v = typeof value === "string" ? value : "";
    return (
      <div className="space-y-1">
        <Input
          value={v}
          onChange={(e) => onChange(e.target.value)}
          placeholder={q.placeholder}
          type="url"
        />
      </div>
    );
  }

  if (q.type === "text") {
    const v = typeof value === "string" ? value : "";
    return (
      <Textarea
        value={v}
        onChange={(e) => onChange(e.target.value)}
        placeholder={q.placeholder}
        rows={4}
      />
    );
  }

  if (q.type === "rank") {
    return <RankInput q={q} value={value} onChange={onChange} />;
  }

  return null;
}

function RankInput({
  q,
  value,
  onChange,
}: {
  q: QuizQuestion;
  value: unknown;
  onChange: (v: string[]) => void;
}) {
  const opts = q.options ?? [];
  const order: string[] = Array.isArray(value)
    ? (value as string[])
    : opts.map((o) => o.value);

  // Seed default order so canAdvance is true even if the user doesn't reorder.
  const seededRef = useRef(false);
  useEffect(() => {
    if (seededRef.current) return;
    if (Array.isArray(value)) return;
    seededRef.current = true;
    onChange(opts.map((o) => o.value));
  }, [value, opts, onChange]);

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...order];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-white/50">
        Top = you&apos;d give up first. Use the arrows to reorder.
      </p>
      {order.map((val, i) => {
        const opt = opts.find((o) => o.value === val);
        if (!opt) return null;
        return (
          <div
            key={val}
            className="flex items-center gap-3 rounded-md border border-white/10 bg-white/[0.02] px-3 py-2.5"
          >
            <GripVertical className="size-4 text-white/40 shrink-0" />
            <span className="flex-1 text-sm text-[#D4D4D4]">{opt.label}</span>
            <span className="text-xs text-white/40 tabular-nums">{i + 1}</span>
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="text-white/40 hover:text-white disabled:opacity-30 text-xs leading-none"
              >
                ▲
              </button>
              <button
                onClick={() => move(i, 1)}
                disabled={i === order.length - 1}
                className="text-white/40 hover:text-white disabled:opacity-30 text-xs leading-none"
              >
                ▼
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "size-1.5 rounded-full transition-colors",
            i === current
              ? "bg-[#DC2626]"
              : i < current
                ? "bg-white/40"
                : "bg-white/10",
          )}
        />
      ))}
    </div>
  );
}

function ResultView({
  tier,
  signals,
  onRetake,
}: {
  tier: RecommendedTier;
  signals: TierSignals;
  onRetake: () => void;
}) {
  const accent =
    tier === "signal"
      ? "from-zinc-700 to-zinc-900"
      : tier === "frequency"
        ? "from-red-600 to-red-900"
        : "from-violet-600 to-fuchsia-900";

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Card className="border-white/10 bg-zinc-950/60 overflow-hidden">
        <div
          className={cn(
            "h-1 w-full bg-gradient-to-r",
            accent,
          )}
        />
        <CardContent className="p-8 space-y-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">
              Recommendation
            </p>
            <h1 className="text-3xl font-bold text-white mt-1">
              {tierLabel(tier)}
            </h1>
            <p className="text-sm text-[#A3A3A3] mt-2 leading-relaxed">
              {tierTagline(tier)}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <SignalCell
              label="Floor"
              value={tierLabel(signals.floor)}
              note="What your capacity supports"
            />
            <SignalCell
              label="Ceiling"
              value={tierLabel(signals.ceiling)}
              note="What your maturity uses"
            />
            <SignalCell
              label="Data fit"
              value={
                signals.system_fit === "ready_for_automation"
                  ? "Ready for automation"
                  : "Manual entry first"
              }
              note="How feedback flows in"
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-white/50">
              Why
            </p>
            <ul className="space-y-1.5 text-sm text-[#D4D4D4]">
              {signals.reasoning.map((r, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-white/40 shrink-0">·</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href="/brand"
              className="inline-flex items-center gap-1.5 rounded-md bg-red-600 hover:bg-red-500 px-4 py-2 text-sm font-medium text-white"
            >
              Start the Brand Journey
              <ArrowRight className="size-3.5" />
            </a>
            <a
              href="/settings"
              className="inline-flex items-center gap-1.5 rounded-md border border-white/10 hover:border-white/20 px-4 py-2 text-sm text-white"
            >
              Compare plans in Settings
            </a>
            <Button variant="ghost" size="sm" onClick={onRetake}>
              Retake the quiz
            </Button>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-white/40 text-center">
        This is a recommendation, not a billing change. Your current plan stays the same until you change it in Settings.
      </p>
    </div>
  );
}

function SignalCell({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.02] p-3">
      <p className="text-[10px] uppercase tracking-wider text-white/50">
        {label}
      </p>
      <Badge className="mt-1 bg-white/5 text-white border-white/10">
        {value}
      </Badge>
      <p className="text-xs text-white/40 mt-1.5">{note}</p>
    </div>
  );
}
