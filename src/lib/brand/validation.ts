// Client-side validation for Brand Journey answers.
// Server-side critique (Director's Notes "Spot-check") lives in
// /api/agents/brand-director with mode="critique".

import type { BrandQuestion } from "./modules";

export type ValidationFlag =
  | "ok"
  | "empty"
  | "too_short"
  | "missing_noun"
  | "too_few_chips"
  | "too_many_chips"
  | "missing_slot"
  | "too_few_items"
  | "too_many_items";

export interface ValidationResult {
  flag: ValidationFlag;
  message: string | null;
}

const OK: ValidationResult = { flag: "ok", message: null };

// Very loose "contains a concrete noun" check — looks for any of:
// - a number (age, year, count)
// - a proper noun (capitalized word not at sentence start)
// - a common concrete-anchor keyword (place / time / person indicators)
const ANCHOR_KEYWORDS = [
  "am",
  "pm",
  "basement",
  "car",
  "bar",
  "kitchen",
  "street",
  "studio",
  "room",
  "highway",
  "apartment",
  "park",
  "bedroom",
  "train",
  "airport",
  "hotel",
  "mom",
  "dad",
  "grandma",
  "uncle",
  "brother",
  "sister",
  "daughter",
  "son",
];

function looksAnchored(text: string): boolean {
  const lowered = text.toLowerCase();
  if (/\d/.test(text)) return true;
  for (const kw of ANCHOR_KEYWORDS) {
    if (lowered.includes(` ${kw} `) || lowered.includes(` ${kw}.`) || lowered.endsWith(` ${kw}`))
      return true;
  }
  // Capitalized word that isn't the first word of a sentence or "I"
  const words = text.split(/\s+/);
  for (let i = 1; i < words.length; i++) {
    const w = words[i];
    if (w === "I" || w === "I'm" || w === "I've" || w === "I'll") continue;
    if (/^[A-Z][a-z]+/.test(w)) return true;
  }
  return false;
}

export function validateText(
  q: BrandQuestion,
  value: string
): ValidationResult {
  const trimmed = value.trim();
  if (!trimmed) {
    return { flag: "empty", message: "Write an answer to continue." };
  }
  if (q.minLength && trimmed.length < q.minLength) {
    return {
      flag: "too_short",
      message: `${trimmed.length}/${q.minLength} characters. Keep going — specificity compounds.`,
    };
  }
  if (q.requireNoun && !looksAnchored(trimmed)) {
    return {
      flag: "missing_noun",
      message:
        "Anchor this with a concrete noun — a place, a person, a time, or a year.",
    };
  }
  return OK;
}

export function validateChips(
  q: BrandQuestion,
  chips: string[]
): ValidationResult {
  const filled = chips.filter((c) => c.trim().length > 0);
  if (q.minChips && filled.length < q.minChips) {
    return {
      flag: "too_few_chips",
      message: `Add at least ${q.minChips}. Currently ${filled.length}.`,
    };
  }
  if (q.maxChips && filled.length > q.maxChips) {
    return {
      flag: "too_many_chips",
      message: `Max ${q.maxChips}. Currently ${filled.length} — tighten.`,
    };
  }
  return OK;
}

export function validateTemplated(
  q: BrandQuestion,
  slots: string[]
): ValidationResult {
  const filled = slots.map((s) => s.trim());
  const missing = filled.filter((s) => !s).length;
  if (missing > 0) {
    return {
      flag: "missing_slot",
      message: `Fill all ${q.templatedSlots?.length ?? 0} slots.`,
    };
  }
  return OK;
}

export function validateRepeater(
  q: BrandQuestion,
  items: Array<Record<string, string>>
): ValidationResult {
  const complete = items.filter((item) =>
    (q.repeaterSchema ?? []).every((f) => item[f.field]?.trim())
  );
  if (q.repeaterMin && complete.length < q.repeaterMin) {
    return {
      flag: "too_few_items",
      message: `Add at least ${q.repeaterMin} complete entr${q.repeaterMin === 1 ? "y" : "ies"}. Currently ${complete.length}.`,
    };
  }
  if (q.repeaterMax && complete.length > q.repeaterMax) {
    return {
      flag: "too_many_items",
      message: `Max ${q.repeaterMax}. Currently ${complete.length}.`,
    };
  }
  return OK;
}

export function computeModuleCompleteness(
  moduleQuestions: BrandQuestion[],
  wiki: Record<string, unknown>
): number {
  // V2: optional questions don't count toward the 80% threshold so adding
  // new questions to existing modules can't regress an artist's progress.
  const required = moduleQuestions.filter((q) => !q.optional);
  if (required.length === 0) return 0;
  let filled = 0;
  for (const q of required) {
    const v = wiki[q.field_key];
    if (isFilled(v)) filled++;
    // composite: two_box fills transformation_before + transformation_after
    if (q.input === "two_box" && q.field_key === "transformation_before") {
      const after = wiki["transformation_after"];
      if (isFilled(v) && isFilled(after)) filled = Math.min(required.length, filled); // already counted
    }
  }
  return Math.round((filled / required.length) * 100);
}

function isFilled(v: unknown): boolean {
  if (v == null) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v).length > 0;
  if (typeof v === "number") return Number.isFinite(v);
  return true;
}
