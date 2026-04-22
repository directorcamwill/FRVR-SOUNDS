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
import { Textarea } from "@/components/ui/textarea";
import { ConfidencePill } from "@/components/ui/motion";
import {
  Loader2,
  Film,
  CheckCircle2,
  XCircle,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { BrandQuestion } from "@/lib/brand/modules";

/**
 * Director's Notes — FRVR-voice replacement for "Refine with AI".
 *
 * Calls /api/agents/brand-director with mode="refine_field".
 * Returns a refined version the user can Accept / Edit / Reject.
 *
 * For templated / multi-slot questions, pass `slotStructure` so the Director
 * returns refined values per slot (not just a joined sentence). The onAccept
 * callback receives both the full refined text and the per-slot array.
 */

export interface DirectorsNotesSlot {
  label: string;
  value: string;
}

export interface DirectorsNotesButtonProps {
  question: BrandQuestion;
  currentText: string;
  /** When present, each slot's label + current value. Array order = slot order. */
  slotStructure?: DirectorsNotesSlot[];
  /** Canonical value currently in the Brand Wiki for this field (what's saved on file). */
  savedPreview?: string | null;
  onAccept: (args: {
    refined: string;
    refinedSlots?: string[];
  }) => Promise<void>;
  disabled?: boolean;
}

export function DirectorsNotesButton({
  question,
  currentText,
  slotStructure,
  savedPreview,
  onAccept,
  disabled,
}: DirectorsNotesButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refined, setRefined] = useState<string>("");
  const [refinedSlots, setRefinedSlots] = useState<string[] | undefined>();
  const [reasoning, setReasoning] = useState<string>("");
  const [confidence, setConfidence] = useState<number | null>(null);

  const trigger = async () => {
    setOpen(true);
    setLoading(true);
    setRefined("");
    setRefinedSlots(undefined);
    setReasoning("");
    setConfidence(null);
    try {
      const res = await fetch("/api/agents/brand-director", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "refine_field",
          field_key: question.field_key,
          user_text: currentText,
          question_prompt: question.prompt,
          slot_structure: slotStructure,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 403) {
          throw new Error(
            data.error ||
              "Director's Notes is on Pro Catalog. Upgrade to unlock.",
          );
        }
        if (res.status === 429) {
          throw new Error(
            data.error ||
              "You've used all your Director's Notes this cycle. Resets next period.",
          );
        }
        throw new Error(data.error || "Director couldn't read that.");
      }
      const data = await res.json();
      setRefined(data.refined?.refined_text ?? "");
      setRefinedSlots(data.refined?.refined_slots);
      setReasoning(data.refined?.reasoning ?? "");
      setConfidence(data.refined?.confidence ?? null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Director failed");
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const canRefine =
    !disabled &&
    currentText &&
    currentText.trim().length >= Math.max(10, question.minLength ?? 0);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!canRefine}
        onClick={trigger}
        className={cn(
          "border-red-500/30 bg-red-500/[0.04] text-red-200 hover:bg-red-500/10 hover:text-red-100",
          !canRefine && "opacity-50",
        )}
      >
        <Film className="size-3.5 mr-1.5" />
        Director&apos;s Notes
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col bg-zinc-950 border-white/10 p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-3 border-b border-white/5 shrink-0">
            <DialogTitle className="flex items-center gap-2 text-white">
              <Film className="size-4 text-red-500" />
              Director&apos;s Notes
              {confidence != null && (
                <ConfidencePill score={confidence} showLabel={false} />
              )}
            </DialogTitle>
            <DialogDescription className="text-white/50 line-clamp-2">
              {question.prompt}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-white/60">
                <Loader2 className="size-4 animate-spin" />
                Reading your answer…
              </div>
            ) : (
              <DiffPanel
                original={currentText}
                refined={refined}
                refinedSlots={refinedSlots}
                slotLabels={slotStructure?.map((s) => s.label)}
                savedPreview={savedPreview}
                reasoning={reasoning}
                onRefinedChange={setRefined}
                onRefinedSlotsChange={setRefinedSlots}
                onAccept={async () => {
                  await onAccept({ refined, refinedSlots });
                  setOpen(false);
                }}
                onReject={() => setOpen(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Diff panel ───────────────────────────────────────────────────────────

function DiffPanel({
  original,
  refined,
  refinedSlots,
  slotLabels,
  savedPreview,
  reasoning,
  onRefinedChange,
  onRefinedSlotsChange,
  onAccept,
  onReject,
}: {
  original: string;
  refined: string;
  refinedSlots?: string[];
  slotLabels?: string[];
  savedPreview?: string | null;
  reasoning: string;
  onRefinedChange: (v: string) => void;
  onRefinedSlotsChange: (v: string[] | undefined) => void;
  onAccept: () => Promise<void>;
  onReject: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const hasSlots =
    Array.isArray(refinedSlots) &&
    refinedSlots.length > 0 &&
    Array.isArray(slotLabels) &&
    slotLabels.length === refinedSlots.length;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5 min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-white/40">
            Your version
          </p>
          <div className="rounded-md border border-white/10 bg-white/[0.02] p-3 text-sm text-white/70 leading-relaxed max-h-[28vh] overflow-y-auto whitespace-pre-wrap break-words">
            {original || <span className="italic text-white/30">empty</span>}
          </div>
        </div>
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-wider text-red-400">
              Director&apos;s version
            </p>
            {!editing && (refined || hasSlots) && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-[10px] text-white/40 hover:text-white transition-colors flex items-center gap-1"
              >
                <Pencil className="size-3" />
                Edit
              </button>
            )}
          </div>
          {hasSlots ? (
            editing ? (
              <div className="space-y-2 max-h-[32vh] overflow-y-auto">
                {refinedSlots!.map((val, i) => (
                  <div key={i} className="space-y-1">
                    <p className="text-[10px] uppercase tracking-wider text-white/50">
                      {slotLabels![i]}
                    </p>
                    <Textarea
                      rows={2}
                      value={val}
                      onChange={(e) => {
                        const copy = refinedSlots!.slice();
                        copy[i] = e.target.value;
                        onRefinedSlotsChange(copy);
                      }}
                      className="bg-zinc-950 border-red-500/30 text-white"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-red-500/20 bg-red-500/[0.03] p-3 space-y-2 max-h-[32vh] overflow-y-auto">
                {refinedSlots!.map((val, i) => (
                  <div key={i} className="space-y-0.5">
                    <p className="text-[10px] uppercase tracking-wider text-red-400/70">
                      {slotLabels![i]}
                    </p>
                    <p className="text-sm text-white leading-relaxed whitespace-pre-wrap break-words">
                      {val || (
                        <span className="italic text-white/30">empty</span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            )
          ) : editing ? (
            <Textarea
              rows={5}
              value={refined}
              onChange={(e) => onRefinedChange(e.target.value)}
              className="bg-zinc-950 border-red-500/30 text-white max-h-[28vh]"
            />
          ) : (
            <div className="rounded-md border border-red-500/20 bg-red-500/[0.03] p-3 text-sm text-white leading-relaxed max-h-[28vh] overflow-y-auto whitespace-pre-wrap break-words">
              {refined || (
                <span className="italic text-white/30">
                  No refined version returned.
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* What's currently on file in the Brand Wiki. */}
      <div className="rounded-md border border-white/10 bg-black/40 px-3 py-2.5 space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">
            Saved in your Brand Wiki
          </p>
          <p className="text-[10px] text-white/30">what&apos;s on file now</p>
        </div>
        <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap break-words">
          {savedPreview && savedPreview.trim() ? (
            savedPreview
          ) : (
            <span className="italic text-white/30">
              Nothing saved yet for this field.
            </span>
          )}
        </p>
      </div>

      {reasoning && (
        <div className="rounded-md border border-white/10 bg-black/30 px-3 py-2 text-xs italic text-white/50 max-h-24 overflow-y-auto">
          {reasoning}
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5 sticky bottom-0 bg-zinc-950 -mx-2 px-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onReject}
          disabled={accepting}
        >
          <XCircle className="size-3.5 mr-1.5" />
          Keep mine
        </Button>
        <Button
          size="sm"
          disabled={
            accepting ||
            (hasSlots ? !refinedSlots!.some((s) => s.trim()) : !refined.trim())
          }
          onClick={async () => {
            setAccepting(true);
            try {
              await onAccept();
            } finally {
              setAccepting(false);
            }
          }}
          className="bg-red-600 hover:bg-red-500 text-white"
        >
          {accepting ? (
            <Loader2 className="size-3.5 mr-1.5 animate-spin" />
          ) : (
            <CheckCircle2 className="size-3.5 mr-1.5" />
          )}
          Accept
        </Button>
      </div>
    </div>
  );
}

// ─── Spot-check (critique) inline button ──────────────────────────────────

export function SpotCheckButton({
  question,
  currentText,
  disabled,
  onCritique,
}: {
  question: BrandQuestion;
  currentText: string;
  disabled?: boolean;
  onCritique: (result: {
    specificity_score: number;
    flags: string[];
    suggestion: string;
  }) => void;
}) {
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agents/brand-director", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "critique",
          field_key: question.field_key,
          user_text: currentText,
          question_prompt: question.prompt,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Spot-check failed");
      }
      const data = await res.json();
      onCritique({
        specificity_score: data.critique?.specificity_score ?? 0,
        flags: data.critique?.flags ?? [],
        suggestion: data.critique?.suggestion ?? "",
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Spot-check failed");
    } finally {
      setLoading(false);
    }
  };

  const canRun =
    !disabled && currentText && currentText.trim().length >= 10;

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={!canRun || loading}
      onClick={run}
      className="text-white/50 hover:text-white"
    >
      {loading ? (
        <Loader2 className="size-3.5 mr-1.5 animate-spin" />
      ) : null}
      Director&apos;s read
    </Button>
  );
}
