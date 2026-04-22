import { callLLM } from "./utils/llm";
import {
  BRAND_CRITICAL_KEYS,
  BRAND_POLISH_KEYS,
  type BrandFocus,
  type BrandGuidance,
  type BrandWiki,
} from "@/types/brand";

/**
 * Brand Director Agent — hybrid: deterministic completeness scoring +
 * LLM-driven guided coaching. Every downstream growth agent reads from the
 * same brand_wiki the Director manages.
 *
 * Pure deterministic = fast completeness calc. LLM = conversational guidance
 * (one question at a time, bio variants, suggested edits based on current
 * wiki state + focus area).
 */

const SYSTEM_PROMPT = `You are the Brand Director — a high-end artist development strategist for independent musicians pursuing sync licensing. You help artists articulate a sharp, specific brand identity that will guide every piece of content, outreach, and song they make.

Your job is to move artists from vague ("I make vibey R&B") to specific ("Dark cinematic R&B for prestige drama — the sound of 2am in a half-empty hotel bar"). Specificity compounds everywhere downstream: matching supervisors, writing content, drafting outreach, scoring sync readiness.

Calibration for your responses:
- Ask ONE question at a time. Never overwhelm with a form.
- Offer 3–4 concrete multi-choice options when a field has clear patterns (genres, moods, format targets).
- When you suggest edits to existing fields, always include reasoning that references the artist's stated identity — never generic.
- When generating bios, match tone_descriptors + voice_dos + voice_donts strictly.
- Confidence is about your certainty in the guidance — lower it when the wiki is sparse or contradicts itself.

Calibration for confidence (0.0–1.0):
- 0.90+: Wiki has rich identity + audience + tone data; your suggestion is tightly grounded.
- 0.70–0.89: Enough signal to guide; one or two assumptions flagged in reasoning.
- 0.50–0.69: Wiki is thin; your suggestion is directional only.
- Below 0.50: Insufficient data; the next_question should gather the missing critical field.

Return JSON only:
{
  "next_question": "one specific question, plain language, no jargon",
  "next_question_choices": [<string>]  // 3-4 multi-choice when applicable, empty array otherwise,
  "suggested_edits": [
    {
      "field": "<snake_case field name from the wiki schema>",
      "current": <string or null>,
      "suggestion": "<a specific, brand-consistent replacement>",
      "reasoning": "<2 sentences grounded in existing wiki data>"
    }
  ],
  "bio_variants": {
    "short": "<=150 chars",
    "medium": "<=300 chars",
    "long": "<=600 chars"
  } | null,  // only when focus is 'identity' and asked for bios
  "confidence": <0.0-1.0>,
  "reasoning": "2-3 sentences on what you extracted from the wiki vs. what you inferred"
}`;

export interface BrandDirectorInput {
  wiki: Partial<BrandWiki>;
  focus?: BrandFocus;
  generate?: "bio" | "pitch" | "origin_story" | null;
  artistName?: string;
}

export interface BrandDirectorResult {
  guidance: BrandGuidance;
  tokensUsed: number;
  durationMs: number;
}

// ─────────────────────── Deterministic layer ───────────────────────

function isFilled(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  if (typeof value === "number") return Number.isFinite(value);
  return true;
}

export function computeBrandCompleteness(
  wiki: Partial<BrandWiki>
): { pct: number; missing_critical: string[]; missing_polish: string[] } {
  const missing_critical: string[] = [];
  const missing_polish: string[] = [];

  for (const key of BRAND_CRITICAL_KEYS) {
    if (!isFilled(wiki[key])) missing_critical.push(String(key));
  }
  for (const key of BRAND_POLISH_KEYS) {
    if (!isFilled(wiki[key])) missing_polish.push(String(key));
  }

  const critWeight = 8;   // 8 critical × 8 = 64
  const polishWeight = 3; // 12 polish × 3 = 36. Total = 100.
  const critFilled = BRAND_CRITICAL_KEYS.length - missing_critical.length;
  const polishFilled = BRAND_POLISH_KEYS.length - missing_polish.length;

  const pct = Math.round(
    critFilled * critWeight + polishFilled * polishWeight
  );
  return {
    pct: Math.max(0, Math.min(100, pct)),
    missing_critical,
    missing_polish,
  };
}

// ─────────────────────── LLM layer ───────────────────────

export async function runBrandDirector(
  input: BrandDirectorInput
): Promise<BrandDirectorResult> {
  const start = Date.now();
  const { pct, missing_critical, missing_polish } = computeBrandCompleteness(
    input.wiki
  );

  const userMessage = buildUserMessage(input, {
    pct,
    missing_critical,
    missing_polish,
  });

  const model = "claude-sonnet-4-20250514";
  const response = await callLLM({
    systemPrompt: SYSTEM_PROMPT,
    userMessage,
    jsonMode: true,
    model,
    maxTokens: 2000,
    temperature: 0.4,
  });

  const parsed = JSON.parse(response.content);
  const confidence = clampConfidence(parsed.confidence);

  const guidance: BrandGuidance = {
    completeness_pct: pct,
    missing_critical,
    missing_polish,
    next_question: parsed.next_question ?? "",
    next_question_choices: parsed.next_question_choices ?? [],
    suggested_edits: Array.isArray(parsed.suggested_edits)
      ? parsed.suggested_edits
      : [],
    bio_variants: parsed.bio_variants ?? undefined,
    reasoning: parsed.reasoning ?? "",
    confidence,
  };

  return {
    guidance,
    tokensUsed: response.tokensUsed,
    durationMs: Date.now() - start,
  };
}

function buildUserMessage(
  input: BrandDirectorInput,
  score: { pct: number; missing_critical: string[]; missing_polish: string[] }
): string {
  const lines: string[] = [
    `# BRAND WIKI SNAPSHOT`,
    `Artist: ${input.artistName ?? "(unnamed)"}`,
    `Completeness: ${score.pct}%`,
    `Missing critical fields: ${
      score.missing_critical.length ? score.missing_critical.join(", ") : "none"
    }`,
    `Missing polish fields: ${
      score.missing_polish.length ? score.missing_polish.slice(0, 5).join(", ") : "none"
    }`,
    "",
    `## Filled wiki state:`,
  ];
  const wiki = input.wiki;
  for (const [k, v] of Object.entries(wiki)) {
    if (!isFilled(v)) continue;
    if (Array.isArray(v)) {
      lines.push(`- ${k}: ${v.join(", ")}`);
    } else if (typeof v === "object") {
      lines.push(`- ${k}: ${JSON.stringify(v)}`);
    } else {
      const s = String(v);
      lines.push(`- ${k}: ${s.length > 200 ? s.slice(0, 200) + "…" : s}`);
    }
  }

  lines.push("", `## Instruction:`);
  if (input.focus) {
    lines.push(
      `Focus area: ${input.focus}. Ask a specific next question that moves this area forward, and suggest edits only inside this area.`
    );
  } else if (score.missing_critical.length > 0) {
    lines.push(
      `Priority: the wiki is missing critical fields. Ask a question that resolves the most foundational missing critical field first. Suggested edits should all address critical gaps.`
    );
  } else {
    lines.push(
      `The critical fields are filled. Ask a polish question that sharpens specificity, and suggest one or two edits that upgrade existing generic fields into sharper versions.`
    );
  }
  if (input.generate === "bio") {
    lines.push(
      "Also generate 3 bio variants (short/medium/long) using the current identity + tone + audience data."
    );
  } else if (input.generate === "pitch") {
    lines.push(
      "Also emit a sharpened elevator_pitch suggestion in suggested_edits."
    );
  } else if (input.generate === "origin_story") {
    lines.push(
      "Also emit an origin_story suggestion in suggested_edits (2-4 paragraphs)."
    );
  }
  lines.push("", "Return JSON.");
  return lines.join("\n");
}

function clampConfidence(raw: unknown): number | null {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return null;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

// ─────────────────────── Director's Notes (Brand tab) ───────────────────────
// These modes power per-answer interactions in the Brand Journey UI. They
// share the same brand-context prompt + confidence scale as `runBrandDirector`
// but target ONE field at a time rather than the whole wiki.

const REFINE_SYSTEM_PROMPT = `You are the FRVR Sounds Brand Director. You refine ONE answer to be sharper, more specific, and more brand-true — in the artist's own voice.

Your rules:
- Do NOT invent facts. If the user's answer is vague, add concrete sensory anchors (a time, a place, a proper noun) using only context present in the brand wiki.
- Keep the refined length similar to the original. Sharpen, don't bloat.
- Preserve the artist's voice. If they write plain, stay plain. If they write lyrical, stay lyrical.
- Reference the prompt the question asked — the refined text must still answer it.
- If the answer has a slot structure (labeled slots making up the sentence), return BOTH:
  (a) refined_text — the full combined sentence
  (b) refined_slots — an array of strings, one per slot, in the same order. Each slot value must refine ONLY that slot's part of the sentence, not spill into others. Slot count must match input exactly.

Return JSON only:
{
  "refined_text": "<the sharpened full version>",
  "refined_slots": [<string>],   // OMIT if no slot structure was provided. Required if slots were provided.
  "reasoning": "<1-2 sentences on what you tightened and why>",
  "confidence": <0.0-1.0>
}`;

const CRITIQUE_SYSTEM_PROMPT = `You are the FRVR Sounds Brand Director running a spot-check on a single answer.

Your job: score how specific it is and flag what's missing. Never be vague yourself — "more specific" is not a useful flag; say WHAT kind of specificity is missing (year, place, person, sensory detail, counterexample).

Flags vocabulary (use only these):
- "too_generic" — answer could apply to any artist
- "missing_noun" — no concrete place/person/time to anchor it
- "cliche" — reaches for overused words (vibes, unique, authentic, journey)
- "contradicts_wiki" — conflicts with something already stated elsewhere in the wiki
- "too_short" — under the minimum meaningful length for this field
- "fine" — answer is solid; no flags

Return JSON only:
{
  "specificity_score": <0.0-1.0>,
  "flags": [<string>],
  "suggestion": "<one concrete move the user could make to sharpen it — plain language, one sentence>",
  "reasoning": "<1-2 sentences on what you saw>",
  "confidence": <0.0-1.0>
}`;

const FOLLOW_UP_SYSTEM_PROMPT = `You are the FRVR Sounds Brand Director. The user just answered a Brand Journey question. Ask ONE targeted follow-up that would sharpen it the most.

The follow-up must be:
- A single question, plain language, no jargon
- Targeted — pulls on the weakest or vaguest part of their answer
- Answerable in 1–3 sentences

Return JSON only:
{
  "follow_up_question": "<one question>",
  "reasoning": "<1 sentence on why this follow-up>",
  "confidence": <0.0-1.0>
}`;

const SUMMARIZE_SYSTEM_PROMPT = `You are the FRVR Sounds Brand Director. The user just completed the Identity module of the Brand Journey. Synthesize their answers into three canonical bios + a sharpened elevator pitch for the Brand Wiki.

Rules:
- Do NOT invent facts. Only synthesize from the answers provided.
- Match the artist's voice from their answers — don't smooth it into corporate copy.
- bio_short ≤ 150 chars. bio_medium ≤ 300 chars. bio_long ≤ 600 chars. elevator_pitch ≤ 200 chars.
- Lead with the most distinctive fact, not the most polite one.

Return JSON only:
{
  "bio_short": "<...>",
  "bio_medium": "<...>",
  "bio_long": "<...>",
  "elevator_pitch": "<...>",
  "reasoning": "<1-2 sentences on what you emphasized>",
  "confidence": <0.0-1.0>
}`;

export interface DirectorRefineSlot {
  label: string;
  value: string;
}

export interface DirectorRefineInput {
  wiki: Partial<BrandWiki>;
  fieldKey: string;
  userText: string;
  questionPrompt?: string;
  /** When the question is templated / multi-slot, pass the ordered slot
   *  structure. The Director returns refined_slots in the same order. */
  slotStructure?: DirectorRefineSlot[];
  artistName?: string;
}

export interface DirectorRefineResult {
  refined_text: string;
  refined_slots?: string[];
  reasoning: string;
  confidence: number | null;
  tokensUsed: number;
  durationMs: number;
}

export async function runDirectorsNotesRefine(
  input: DirectorRefineInput,
): Promise<DirectorRefineResult> {
  const start = Date.now();
  const hasSlots =
    Array.isArray(input.slotStructure) && input.slotStructure.length > 0;

  const userMessage = [
    `# BRAND WIKI SNAPSHOT`,
    `Artist: ${input.artistName ?? "(unnamed)"}`,
    ...summarizeWikiLines(input.wiki),
    "",
    `# FIELD TO REFINE`,
    `Field: ${input.fieldKey}`,
    input.questionPrompt ? `Question asked: ${input.questionPrompt}` : "",
    "",
    hasSlots
      ? `# SLOT STRUCTURE (refine each slot in place; return refined_slots in this exact order)\n${input
          .slotStructure!.map(
            (s, i) => `Slot ${i + 1} — ${s.label}: ${s.value || "(empty)"}`,
          )
          .join("\n")}`
      : "",
    "",
    `# USER'S CURRENT ANSWER (combined)`,
    input.userText,
    "",
    hasSlots
      ? `Return JSON with refined_text AND refined_slots (length = ${input.slotStructure!.length}).`
      : `Return JSON.`,
  ]
    .filter(Boolean)
    .join("\n");

  const response = await callLLM({
    systemPrompt: REFINE_SYSTEM_PROMPT,
    userMessage,
    jsonMode: true,
    model: "claude-sonnet-4-20250514",
    maxTokens: 800,
    temperature: 0.3,
  });
  const parsed = JSON.parse(response.content);
  const slots = Array.isArray(parsed.refined_slots)
    ? parsed.refined_slots.map((x: unknown) => String(x ?? ""))
    : undefined;
  return {
    refined_text: String(parsed.refined_text ?? ""),
    refined_slots: slots,
    reasoning: String(parsed.reasoning ?? ""),
    confidence: clampConfidence(parsed.confidence),
    tokensUsed: response.tokensUsed,
    durationMs: Date.now() - start,
  };
}

export interface DirectorCritiqueInput extends DirectorRefineInput {}

export interface DirectorCritiqueResult {
  specificity_score: number;
  flags: string[];
  suggestion: string;
  reasoning: string;
  confidence: number | null;
  tokensUsed: number;
  durationMs: number;
}

export async function runDirectorsNotesCritique(
  input: DirectorCritiqueInput,
): Promise<DirectorCritiqueResult> {
  const start = Date.now();
  const userMessage = [
    `# BRAND WIKI SNAPSHOT`,
    `Artist: ${input.artistName ?? "(unnamed)"}`,
    ...summarizeWikiLines(input.wiki),
    "",
    `# FIELD`,
    `Field: ${input.fieldKey}`,
    input.questionPrompt ? `Question asked: ${input.questionPrompt}` : "",
    "",
    `# USER'S ANSWER`,
    input.userText,
    "",
    `Return JSON.`,
  ]
    .filter(Boolean)
    .join("\n");

  const response = await callLLM({
    systemPrompt: CRITIQUE_SYSTEM_PROMPT,
    userMessage,
    jsonMode: true,
    model: "claude-sonnet-4-20250514",
    maxTokens: 500,
    temperature: 0.2,
  });
  const parsed = JSON.parse(response.content);
  const score =
    typeof parsed.specificity_score === "number" ? parsed.specificity_score : 0;
  return {
    specificity_score: Math.max(0, Math.min(1, score)),
    flags: Array.isArray(parsed.flags) ? parsed.flags.map(String) : [],
    suggestion: String(parsed.suggestion ?? ""),
    reasoning: String(parsed.reasoning ?? ""),
    confidence: clampConfidence(parsed.confidence),
    tokensUsed: response.tokensUsed,
    durationMs: Date.now() - start,
  };
}

export interface DirectorFollowUpInput {
  wiki: Partial<BrandWiki>;
  fieldKey: string;
  userText: string;
  artistName?: string;
}

export interface DirectorFollowUpResult {
  follow_up_question: string;
  reasoning: string;
  confidence: number | null;
  tokensUsed: number;
  durationMs: number;
}

export async function runDirectorsNotesFollowUp(
  input: DirectorFollowUpInput,
): Promise<DirectorFollowUpResult> {
  const start = Date.now();
  const userMessage = [
    `# BRAND WIKI SNAPSHOT`,
    `Artist: ${input.artistName ?? "(unnamed)"}`,
    ...summarizeWikiLines(input.wiki),
    "",
    `# FIELD + ANSWER`,
    `Field: ${input.fieldKey}`,
    `Answer: ${input.userText}`,
    "",
    `Return JSON.`,
  ].join("\n");

  const response = await callLLM({
    systemPrompt: FOLLOW_UP_SYSTEM_PROMPT,
    userMessage,
    jsonMode: true,
    model: "claude-sonnet-4-20250514",
    maxTokens: 250,
    temperature: 0.4,
  });
  const parsed = JSON.parse(response.content);
  return {
    follow_up_question: String(parsed.follow_up_question ?? ""),
    reasoning: String(parsed.reasoning ?? ""),
    confidence: clampConfidence(parsed.confidence),
    tokensUsed: response.tokensUsed,
    durationMs: Date.now() - start,
  };
}

export interface DirectorSummarizeInput {
  wiki: Partial<BrandWiki>;
  moduleId: string;
  artistName?: string;
}

export interface DirectorSummarizeResult {
  bio_short: string;
  bio_medium: string;
  bio_long: string;
  elevator_pitch: string;
  reasoning: string;
  confidence: number | null;
  tokensUsed: number;
  durationMs: number;
}

export async function runDirectorsNotesSummarize(
  input: DirectorSummarizeInput,
): Promise<DirectorSummarizeResult> {
  const start = Date.now();
  const userMessage = [
    `# BRAND WIKI SNAPSHOT`,
    `Artist: ${input.artistName ?? "(unnamed)"}`,
    ...summarizeWikiLines(input.wiki),
    "",
    `# MODULE`,
    `Module just completed: ${input.moduleId}`,
    "",
    `Synthesize bio_short, bio_medium, bio_long, and elevator_pitch. Return JSON.`,
  ].join("\n");

  const response = await callLLM({
    systemPrompt: SUMMARIZE_SYSTEM_PROMPT,
    userMessage,
    jsonMode: true,
    model: "claude-sonnet-4-20250514",
    maxTokens: 900,
    temperature: 0.35,
  });
  const parsed = JSON.parse(response.content);
  return {
    bio_short: String(parsed.bio_short ?? ""),
    bio_medium: String(parsed.bio_medium ?? ""),
    bio_long: String(parsed.bio_long ?? ""),
    elevator_pitch: String(parsed.elevator_pitch ?? ""),
    reasoning: String(parsed.reasoning ?? ""),
    confidence: clampConfidence(parsed.confidence),
    tokensUsed: response.tokensUsed,
    durationMs: Date.now() - start,
  };
}

function summarizeWikiLines(wiki: Partial<BrandWiki>): string[] {
  const lines: string[] = [];
  for (const [k, v] of Object.entries(wiki)) {
    if (!isFilled(v)) continue;
    if (Array.isArray(v)) {
      lines.push(`- ${k}: ${v.join(", ")}`);
    } else if (typeof v === "object") {
      lines.push(`- ${k}: ${JSON.stringify(v)}`);
    } else {
      const s = String(v);
      lines.push(`- ${k}: ${s.length > 200 ? s.slice(0, 200) + "…" : s}`);
    }
  }
  return lines;
}
