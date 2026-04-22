"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import {
  TextInput,
  TextareaInput,
  ChipsInput,
  TemplatedInput,
  TwoBoxInput,
  IntensityDialInput,
  MultiFieldInput,
  RepeaterInput,
  StrongVsWeakExamples,
} from "./answer-inputs";
import {
  DirectorsNotesButton,
  SpotCheckButton,
} from "./directors-notes";
import {
  validateText,
  validateChips,
  validateTemplated,
  validateRepeater,
  type ValidationResult,
} from "@/lib/brand/validation";
import type { BrandQuestion } from "@/lib/brand/modules";
import type { BrandWiki } from "@/types/brand";

export interface QuestionCardProps {
  question: BrandQuestion;
  wiki: BrandWiki;
  stepIndex: number;
  totalSteps: number;
  moduleLabel: string;
  saving: boolean;
  onAnswer: (patch: Partial<BrandWiki>) => Promise<void>;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

export function QuestionCard({
  question,
  wiki,
  stepIndex,
  totalSteps,
  moduleLabel,
  saving,
  onAnswer,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: QuestionCardProps) {
  const initial = useMemo(() => readInitial(question, wiki), [question, wiki]);
  const [draft, setDraft] = useState<DraftState>(initial);
  const [validation, setValidation] = useState<ValidationResult>({
    flag: "ok",
    message: null,
  });
  const [justSaved, setJustSaved] = useState(false);
  const [critique, setCritique] = useState<{
    specificity_score: number;
    flags: string[];
    suggestion: string;
  } | null>(null);
  const savedTimer = useRef<NodeJS.Timeout | null>(null);

  // Reseed local draft when question or wiki changes (e.g. nav between Qs)
  useEffect(() => {
    setDraft(readInitial(question, wiki));
    setValidation({ flag: "ok", message: null });
    setCritique(null);
  }, [question, wiki]);

  const commit = async () => {
    const patch = draftToPatch(question, draft);
    const v = validateDraft(question, draft);
    setValidation(v);
    // Empty → don't write
    if (v.flag === "empty") return;
    await onAnswer(patch);
    setJustSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setJustSaved(false), 1400);
  };

  const validationTone =
    validation.flag === "ok"
      ? "ok"
      : validation.flag === "empty"
        ? "neutral"
        : "warn";

  return (
    <Card className="border-white/10 bg-zinc-950/60">
      <CardContent className="p-6 md:p-8 space-y-6">
        {/* Step header */}
        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-white/50">
          <span>
            {moduleLabel} · Question {stepIndex + 1} of {totalSteps}
          </span>
          {saving ? (
            <span className="flex items-center gap-1.5 text-white/60">
              <Loader2 className="size-3 animate-spin" />
              Saving
            </span>
          ) : justSaved ? (
            <span className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="size-3" />
              Saved
            </span>
          ) : null}
        </div>

        {/* Prompt */}
        <div className="space-y-2">
          <h2 className="text-xl md:text-2xl font-semibold text-white tracking-tight leading-snug">
            {question.prompt}
          </h2>
          {question.help && (
            <p className="text-sm text-white/50">{question.help}</p>
          )}
        </div>

        {/* Answer */}
        <div>
          {renderInput({ question, draft, setDraft, commit })}
        </div>

        {/* Validation */}
        {validation.flag !== "ok" && validation.message && (
          <div
            className={cn(
              "flex items-start gap-2 text-xs rounded-md px-3 py-2",
              validationTone === "warn"
                ? "border border-amber-500/30 bg-amber-500/[0.05] text-amber-200"
                : "border border-white/10 bg-white/[0.02] text-white/60",
            )}
          >
            <AlertTriangle className="size-3.5 mt-0.5 shrink-0" />
            <span>{validation.message}</span>
          </div>
        )}

        {/* Critique (spot-check) inline result */}
        {critique && (
          <div
            className={cn(
              "rounded-md px-3 py-2 space-y-1.5 text-xs",
              critique.specificity_score >= 0.7
                ? "border border-emerald-500/30 bg-emerald-500/[0.04] text-emerald-100"
                : critique.specificity_score >= 0.4
                  ? "border border-amber-500/30 bg-amber-500/[0.04] text-amber-100"
                  : "border border-red-500/30 bg-red-500/[0.04] text-red-100",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="uppercase tracking-wider text-[10px] opacity-80">
                Director&apos;s read
              </span>
              <span className="tabular-nums text-[10px] opacity-80">
                {Math.round(critique.specificity_score * 100)}%
              </span>
            </div>
            {critique.flags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {critique.flags.map((f) => (
                  <span
                    key={f}
                    className="inline-flex items-center rounded-full border border-current/20 bg-current/5 px-2 py-0.5 text-[10px]"
                  >
                    {f.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            )}
            {critique.suggestion && (
              <p className="text-xs opacity-90 leading-relaxed">
                {critique.suggestion}
              </p>
            )}
          </div>
        )}

        {/* Director's Notes action row (refine + spot-check) — only for refinable inputs */}
        {isRefinable(question) && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <DirectorsNotesButton
              question={question}
              currentText={currentDraftText(draft)}
              slotStructure={buildSlotStructure(question, draft)}
              savedPreview={readSavedPreview(question, wiki)}
              onAccept={async ({ refined, refinedSlots }) => {
                const patch = refinedToPatch(
                  question,
                  refined,
                  draft,
                  refinedSlots,
                );
                await onAnswer(patch);
                setDraft(
                  seedDraftWithRefined(draft, refined, refinedSlots),
                );
              }}
            />
            <SpotCheckButton
              question={question}
              currentText={currentDraftText(draft)}
              onCritique={(result) => setCritique(result)}
            />
          </div>
        )}

        {/* Examples */}
        <StrongVsWeakExamples q={question} />

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await commit();
              onPrev();
            }}
            disabled={!hasPrev}
          >
            <ChevronLeft className="size-4 mr-1" />
            Prev
          </Button>
          <Button
            size="sm"
            onClick={async () => {
              await commit();
              onNext();
            }}
            disabled={!hasNext}
            className="bg-red-600 hover:bg-red-500 text-white"
          >
            Next
            <ChevronRight className="size-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── draft state ──────────────────────────────────────────────────────────

type DraftState =
  | { kind: "text"; text: string }
  | { kind: "chips"; chips: string[] }
  | { kind: "templated"; slots: string[] }
  | { kind: "two_box"; before: string; after: string }
  | {
      kind: "intensity_dial";
      energy: number | null;
      intensity: number | null;
      notes: string;
    }
  | { kind: "multi_field"; values: string[] }
  | { kind: "repeater"; items: Array<Record<string, string>> };

function readInitial(q: BrandQuestion, wiki: BrandWiki): DraftState {
  switch (q.input) {
    case "text":
    case "textarea": {
      const v = (wiki as unknown as Record<string, unknown>)[q.field_key];
      return { kind: "text", text: typeof v === "string" ? v : "" };
    }
    case "chips": {
      const v = (wiki as unknown as Record<string, unknown>)[q.field_key];
      return { kind: "chips", chips: Array.isArray(v) ? (v as string[]) : [] };
    }
    case "templated": {
      const v = (wiki as unknown as Record<string, unknown>)[q.field_key];
      const slots = (q.templatedSlots ?? []).map(() => "");
      if (typeof v === "string" && v.trim().length > 0) {
        // Recover slot contents if previously saved in templated form —
        // we store the joined string, so best-effort split on known delimiters.
        // If no structure found, put whole thing in slot 0.
        slots[0] = v;
      }
      return { kind: "templated", slots };
    }
    case "two_box": {
      const before = (wiki as unknown as Record<string, unknown>)[q.field_key];
      const after = (wiki as unknown as Record<string, unknown>)[
        "transformation_after"
      ];
      return {
        kind: "two_box",
        before: typeof before === "string" ? before : "",
        after: typeof after === "string" ? after : "",
      };
    }
    case "intensity_dial": {
      const e = (wiki as unknown as Record<string, unknown>)["energy_marker"];
      const i = (wiki as unknown as Record<string, unknown>)[
        "intensity_marker"
      ];
      const n = (wiki as unknown as Record<string, unknown>)[
        "intensity_notes"
      ];
      return {
        kind: "intensity_dial",
        energy: typeof e === "number" ? e : null,
        intensity: typeof i === "number" ? i : null,
        notes: typeof n === "string" ? n : "",
      };
    }
    case "multi_field": {
      const values = (q.multiFields ?? []).map((slot) => {
        const v = (wiki as unknown as Record<string, unknown>)[slot.field_key];
        if (v == null) return "";
        if (typeof v === "number") return String(v);
        return String(v);
      });
      return { kind: "multi_field", values };
    }
    case "repeater": {
      const v = (wiki as unknown as Record<string, unknown>)[q.field_key];
      return {
        kind: "repeater",
        items: Array.isArray(v)
          ? (v as Array<Record<string, string>>)
          : [],
      };
    }
  }
}

function draftToPatch(q: BrandQuestion, d: DraftState): Partial<BrandWiki> {
  switch (d.kind) {
    case "text":
      return { [q.field_key]: d.text.trim() || null } as Partial<BrandWiki>;
    case "chips":
      return { [q.field_key]: d.chips } as Partial<BrandWiki>;
    case "templated": {
      // Join into a single sentence using connective words. Slots expected to be:
      // "For ___", "we make ___", "that ___"
      const filled = d.slots.map((s) => s.trim()).filter(Boolean);
      if (filled.length === 0)
        return { [q.field_key]: null } as Partial<BrandWiki>;
      // Use the question's templated labels to stitch a readable sentence.
      const connectives = (q.templatedSlots ?? []).map((s) => {
        const lower = s.label.toLowerCase();
        const m = lower.match(/^([a-z]+)(?:\s*\(|$|\s)/);
        return m ? m[1] : "";
      });
      const parts: string[] = [];
      d.slots.forEach((s, i) => {
        const t = s.trim();
        if (!t) return;
        const conn = connectives[i] ?? "";
        parts.push(conn ? `${conn} ${t}` : t);
      });
      return { [q.field_key]: parts.join(" ") } as Partial<BrandWiki>;
    }
    case "two_box":
      return {
        transformation_before: d.before.trim() || null,
        transformation_after: d.after.trim() || null,
      } as Partial<BrandWiki>;
    case "intensity_dial":
      return {
        energy_marker: d.energy,
        intensity_marker: d.intensity,
        intensity_notes: d.notes.trim() || null,
      } as Partial<BrandWiki>;
    case "multi_field": {
      const patch: Record<string, unknown> = {};
      (q.multiFields ?? []).forEach((slot, i) => {
        const raw = (d.values[i] ?? "").trim();
        if (slot.input_type === "number") {
          const n = parseInt(raw, 10);
          patch[slot.field_key] = Number.isFinite(n) ? n : null;
        } else {
          patch[slot.field_key] = raw || null;
        }
      });
      return patch as Partial<BrandWiki>;
    }
    case "repeater": {
      const complete = d.items.filter((item) =>
        (q.repeaterSchema ?? []).every((f) => item[f.field]?.trim()),
      );
      return { [q.field_key]: complete } as Partial<BrandWiki>;
    }
  }
}

function validateDraft(q: BrandQuestion, d: DraftState): ValidationResult {
  switch (d.kind) {
    case "text":
      return validateText(q, d.text);
    case "chips":
      return validateChips(q, d.chips);
    case "templated":
      return validateTemplated(q, d.slots);
    case "two_box":
      return validateTemplated(q, [d.before, d.after]);
    case "intensity_dial":
      return d.energy == null || d.intensity == null
        ? { flag: "empty", message: "Set both dials." }
        : { flag: "ok", message: null };
    case "multi_field": {
      const slots = q.multiFields ?? [];
      const filled = d.values.filter((v) => v.trim().length > 0).length;
      if (filled === 0)
        return { flag: "empty", message: "Fill at least one field." };
      if (filled < slots.length) {
        return {
          flag: "ok",
          message: null,
        };
      }
      return { flag: "ok", message: null };
    }
    case "repeater":
      return validateRepeater(q, d.items);
  }
}

// ─── Director's Notes helpers ─────────────────────────────────────────────

function isRefinable(q: BrandQuestion): boolean {
  return (
    q.input === "text" || q.input === "textarea" || q.input === "templated"
  );
}

function currentDraftText(d: DraftState): string {
  if (d.kind === "text") return d.text;
  if (d.kind === "templated") {
    // Join slots into a readable sentence for the LLM to refine.
    return d.slots.filter(Boolean).join(" · ");
  }
  return "";
}

/**
 * Build slot structure for Director's Notes when the question is templated.
 * The LLM will refine per-slot so Accept can fill all slots, not just slot 0.
 */
function buildSlotStructure(
  q: BrandQuestion,
  d: DraftState,
): Array<{ label: string; value: string }> | undefined {
  if (q.input !== "templated" || d.kind !== "templated") return undefined;
  const labels = q.templatedSlots ?? [];
  return labels.map((s, i) => ({
    label: s.label,
    value: d.slots[i] ?? "",
  }));
}

function refinedToPatch(
  q: BrandQuestion,
  refined: string,
  d: DraftState,
  refinedSlots?: string[],
): Partial<import("@/types/brand").BrandWiki> {
  if (d.kind === "text") {
    return { [q.field_key]: refined.trim() || null } as Partial<
      import("@/types/brand").BrandWiki
    >;
  }
  if (d.kind === "templated") {
    const labels = q.templatedSlots ?? [];
    // Prefer per-slot refinement when available; fall back to the joined
    // sentence. Build the canonical joined string from slots so it matches
    // what draftToPatch would have written for a manual save.
    const slotValues =
      refinedSlots && refinedSlots.length === labels.length
        ? refinedSlots
        : labels.map((_, i) => (i === 0 ? refined : ""));
    const joined = joinTemplatedSlots(q, slotValues);
    return { [q.field_key]: joined.trim() || null } as Partial<
      import("@/types/brand").BrandWiki
    >;
  }
  return {};
}

function seedDraftWithRefined(
  d: DraftState,
  refined: string,
  refinedSlots?: string[],
): DraftState {
  if (d.kind === "text") return { kind: "text", text: refined };
  if (d.kind === "templated") {
    const slotCount = d.slots.length;
    if (refinedSlots && refinedSlots.length === slotCount) {
      return { kind: "templated", slots: refinedSlots.slice() };
    }
    // Fallback: drop into slot 0 (preserves old behaviour but now only as a
    // fallback when the LLM doesn't return per-slot output).
    const slots = new Array(slotCount).fill("");
    slots[0] = refined;
    return { kind: "templated", slots };
  }
  return d;
}

function readSavedPreview(
  q: BrandQuestion,
  wiki: import("@/types/brand").BrandWiki,
): string | null {
  const v = (wiki as unknown as Record<string, unknown>)[q.field_key];
  if (v == null) return null;
  if (typeof v === "string") return v;
  return String(v);
}

function joinTemplatedSlots(q: BrandQuestion, slots: string[]): string {
  const connectives = (q.templatedSlots ?? []).map((s) => {
    const m = s.label.toLowerCase().match(/^([a-z]+)(?:\s*\(|$|\s)/);
    return m ? m[1] : "";
  });
  const parts: string[] = [];
  slots.forEach((s, i) => {
    const t = (s ?? "").trim();
    if (!t) return;
    const conn = connectives[i] ?? "";
    parts.push(conn ? `${conn} ${t}` : t);
  });
  return parts.join(" ");
}

// ─── input dispatch ───────────────────────────────────────────────────────

function renderInput({
  question,
  draft,
  setDraft,
  commit,
}: {
  question: BrandQuestion;
  draft: DraftState;
  setDraft: (d: DraftState) => void;
  commit: () => Promise<void>;
}) {
  switch (question.input) {
    case "text":
      if (draft.kind !== "text") return null;
      return (
        <TextInput
          q={question}
          value={draft.text}
          onChange={(v) => setDraft({ kind: "text", text: v })}
          onBlur={commit}
        />
      );
    case "textarea":
      if (draft.kind !== "text") return null;
      return (
        <TextareaInput
          q={question}
          value={draft.text}
          onChange={(v) => setDraft({ kind: "text", text: v })}
          onBlur={commit}
        />
      );
    case "chips":
      if (draft.kind !== "chips") return null;
      return (
        <ChipsInput
          q={question}
          value={draft.chips}
          onChange={(chips) => setDraft({ kind: "chips", chips })}
          onCommit={commit}
        />
      );
    case "templated":
      if (draft.kind !== "templated") return null;
      return (
        <TemplatedInput
          q={question}
          slots={draft.slots}
          onChange={(slots) => setDraft({ kind: "templated", slots })}
          onCommit={commit}
        />
      );
    case "two_box":
      if (draft.kind !== "two_box") return null;
      return (
        <TwoBoxInput
          q={question}
          before={draft.before}
          after={draft.after}
          onChange={(before, after) =>
            setDraft({ kind: "two_box", before, after })
          }
          onCommit={commit}
        />
      );
    case "intensity_dial":
      if (draft.kind !== "intensity_dial") return null;
      return (
        <IntensityDialInput
          q={question}
          energy={draft.energy}
          intensity={draft.intensity}
          notes={draft.notes}
          onChange={(energy, intensity, notes) =>
            setDraft({ kind: "intensity_dial", energy, intensity, notes })
          }
          onCommit={commit}
        />
      );
    case "multi_field":
      if (draft.kind !== "multi_field") return null;
      return (
        <MultiFieldInput
          q={question}
          values={draft.values}
          onChange={(values) => setDraft({ kind: "multi_field", values })}
          onCommit={commit}
        />
      );
    case "repeater":
      if (draft.kind !== "repeater") return null;
      return (
        <RepeaterInput
          q={question}
          items={draft.items}
          onChange={(items) => setDraft({ kind: "repeater", items })}
          onCommit={commit}
        />
      );
  }
}
