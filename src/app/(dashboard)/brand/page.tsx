"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  BRAND_MODULES,
  firstModule,
  getModule,
  nextQuestion as getNextQ,
  prevQuestion as getPrevQ,
} from "@/lib/brand/modules";
import { computeModuleCompleteness } from "@/lib/brand/validation";
import { JourneyNav } from "@/components/brand/journey-nav";
import { LiveWikiPanel } from "@/components/brand/live-wiki-panel";
import { QuestionCard } from "@/components/brand/question-card";
import { JourneyNotes } from "@/components/brand/journey-notes";
import { BrandWikiRewards } from "@/components/brand/brand-wiki-rewards";
import { ModuleOutputsPanel } from "@/components/brand/module-outputs-panel";
import type { BrandModuleId, BrandWiki } from "@/types/brand";

export default function BrandPage() {
  const [wiki, setWiki] = useState<BrandWiki | null>(null);
  const [artistName, setArtistName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [moduleId, setModuleId] = useState<BrandModuleId>("identity");
  const [questionId, setQuestionId] = useState<string>(
    firstModule().questions[0].id,
  );
  const [highlightField, setHighlightField] = useState<string | null>(null);

  // ─── Fetch wiki ─────────────────────────────────────────────────────────

  const fetchWiki = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/brand-wiki");
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to load Brand Wiki");
      }
      const data = await res.json();
      setWiki(data.wiki);
      setArtistName(data.artist_name ?? "");
      // Resume where the artist left off
      if (data.wiki?.current_module_id && data.wiki?.current_step_id) {
        setModuleId(data.wiki.current_module_id);
        setQuestionId(data.wiki.current_step_id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWiki();
  }, [fetchWiki]);

  // First-time Journey Activation reward — fires once the wiki is loaded AND
  // every module is ≥80% AND the timestamp hasn't been set yet on the server.
  useEffect(() => {
    if (!wiki) return;
    if (wiki.journey_activated_at) return;
    const allDone = BRAND_MODULES.every(
      (m) =>
        computeModuleCompleteness(
          m.questions,
          wiki as unknown as Record<string, unknown>,
        ) >= 80,
    );
    if (!allDone) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/brand-wiki/activate", {
          method: "POST",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (data.activated) {
          toast.success("Brand Wiki activated.", {
            description:
              "Your finished Journey is now the source of truth for every agent.",
            duration: 6000,
          });
        }
        // Re-fetch so journey_activated_at is in state (hides further prompts).
        fetchWiki();
      } catch {
        // silent
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [wiki, fetchWiki]);

  // ─── Save handlers ──────────────────────────────────────────────────────

  const saveWikiPatch = useCallback(
    async (patch: Partial<BrandWiki>) => {
      setSaving(true);
      setError(null);
      try {
        const res = await fetch("/api/brand-wiki", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || "Save failed");
        }
        const data = await res.json();
        setWiki(data.wiki);
        // Pulse the first changed field in the live wiki
        const keys = Object.keys(patch);
        if (keys.length > 0) {
          setHighlightField(keys[0]);
          setTimeout(() => setHighlightField(null), 1000);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Save failed";
        setError(msg);
        toast.error(msg);
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const saveAnswer = useCallback(
    async (patch: Partial<BrandWiki>) => {
      // Fire the wiki save + raw-answer log in parallel
      const currentQ = getModule(moduleId)?.questions.find(
        (x) => x.id === questionId,
      );
      const rawAnswerLogPromise = currentQ
        ? fetch("/api/brand-wiki/responses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              module_id: moduleId,
              question_id: questionId,
              field_key: currentQ.field_key,
              raw_answer: stringifyForLog(patch, currentQ.field_key),
            }),
          }).catch(() => null)
        : Promise.resolve(null);

      await Promise.all([saveWikiPatch(patch), rawAnswerLogPromise]);
    },
    [moduleId, questionId, saveWikiPatch],
  );

  const saveJourneyCursor = useCallback(
    (mod: BrandModuleId, qId: string) => {
      // Fire and forget — don't block nav
      fetch("/api/brand-wiki", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_module_id: mod,
          current_step_id: qId,
        }),
      }).catch(() => null);
    },
    [],
  );

  // ─── Navigation ─────────────────────────────────────────────────────────

  const goTo = (mod: BrandModuleId, qId: string) => {
    setModuleId(mod);
    setQuestionId(qId);
    saveJourneyCursor(mod, qId);
  };

  const onPrev = () => {
    const prev = getPrevQ(moduleId, questionId);
    if (prev) goTo(prev.moduleId, prev.questionId);
  };

  const onNext = () => {
    const next = getNextQ(moduleId, questionId);
    if (next) goTo(next.moduleId, next.questionId);
  };

  const onSelectModule = (id: BrandModuleId) => {
    const mod = getModule(id);
    if (!mod) return;
    // jump to the first incomplete question, else first question
    const firstUnanswered =
      wiki &&
      mod.questions.find((q) => {
        const v = (wiki as unknown as Record<string, unknown>)[q.field_key];
        return isEmpty(v);
      });
    const target = firstUnanswered ?? mod.questions[0];
    goTo(mod.id, target.id);
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-[60vh] w-full" />
      </div>
    );
  }

  if (error && !wiki) {
    return (
      <div className="flex items-start gap-2 text-red-400">
        <AlertCircle className="size-4 mt-0.5 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  if (!wiki) return null;

  const currentModule = getModule(moduleId);
  const currentQuestion = currentModule?.questions.find(
    (q) => q.id === questionId,
  );
  const stepIndex =
    currentModule?.questions.findIndex((q) => q.id === questionId) ?? 0;
  const hasPrev = !!getPrevQ(moduleId, questionId);
  const hasNext = !!getNextQ(moduleId, questionId);

  const pct = wiki.completeness_pct;
  const pctTone =
    pct >= 80
      ? "bg-emerald-500"
      : pct >= 60
        ? "bg-amber-500"
        : pct >= 30
          ? "bg-red-500"
          : "bg-white/20";

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-white/10 bg-zinc-950/60">
        <CardContent className="py-4 px-5 space-y-3">
          <div className="flex items-baseline justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-red-500/70">
                Brand Journey
              </p>
              <h1 className="text-2xl font-semibold text-white tracking-tight mt-0.5">
                {artistName || "Your brand"}
              </h1>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[10px] uppercase tracking-wider text-white/40">
                Overall
              </span>
              <span className="text-xl font-bold tabular-nums text-white">
                {pct}%
              </span>
            </div>
          </div>
          <div className="h-1 w-full rounded-full bg-white/[0.04] overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                pctTone,
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* 3-panel grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)_340px] gap-4">
        {/* Left — Journey nav */}
        <aside className="lg:sticky lg:top-4 lg:h-[calc(100vh-8rem)] lg:overflow-y-auto">
          <JourneyNav
            wiki={wiki}
            currentModuleId={moduleId}
            onSelectModule={onSelectModule}
          />
        </aside>

        {/* Center — Lesson engine */}
        <main className="space-y-4">
          {currentQuestion && currentModule ? (
            <QuestionCard
              question={currentQuestion}
              wiki={wiki}
              stepIndex={stepIndex}
              totalSteps={currentModule.questions.length}
              moduleLabel={currentModule.label}
              saving={saving}
              onAnswer={saveAnswer}
              onPrev={onPrev}
              onNext={onNext}
              hasPrev={hasPrev}
              hasNext={hasNext}
            />
          ) : (
            <Card className="border-white/10 bg-zinc-950/60">
              <CardContent className="py-12 text-center text-white/60">
                No question selected.
              </CardContent>
            </Card>
          )}

          {/* V2 Output Layer — only renders for modules that have generators */}
          <ModuleOutputsPanel
            moduleId={moduleId}
            wiki={wiki}
            onWikiUpdated={fetchWiki}
          />

          <JourneyNotes wiki={wiki} onSave={saveWikiPatch} />
          <BrandWikiRewards
            wiki={wiki}
            onAfterBios={fetchWiki}
            onEditModule={onSelectModule}
          />
        </main>

        {/* Right — Live Brand Wiki */}
        <aside className="lg:sticky lg:top-4 lg:h-[calc(100vh-8rem)] lg:overflow-y-auto">
          <LiveWikiPanel wiki={wiki} highlightFieldKey={highlightField} />
        </aside>
      </div>
    </div>
  );
}

// ─── helpers ──────────────────────────────────────────────────────────────

function stringifyForLog(
  patch: Partial<BrandWiki>,
  fieldKey: string,
): string | null {
  const v = (patch as unknown as Record<string, unknown>)[fieldKey];
  if (v == null) return null;
  if (typeof v === "string") return v;
  return JSON.stringify(v);
}

function isEmpty(v: unknown): boolean {
  if (v == null) return true;
  if (typeof v === "string") return v.trim().length === 0;
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === "object") return Object.keys(v).length === 0;
  return false;
}

export const ORDERED_MODULE_LABELS = BRAND_MODULES.map((m) => m.label);
