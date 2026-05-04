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

// ── V2: Module 8 — Content Engine generators ─────────────────────────────
// These read the artist's existing Brand Wiki and produce the seed entries
// for content_pillars and hook_library. Output is a "suggestion" — the artist
// reviews and edits before saving. No auto-write.

const PILLARS_SYSTEM_PROMPT = `You are the FRVR Sounds Brand Director. The artist has reached Module 8 — the Content Engine. Read their Brand Wiki and propose exactly 3 content pillars they should commit to.

A content pillar is a recurring angle the artist returns to every week. It is NOT a topic ("songwriting"); it is a stance ("how a record gets built — every choice exposed"). Each pillar must be:
- Anchored in the artist's stated identity (core_pain / core_beliefs / key_themes / public_truth).
- Distinguishable from each other — no two pillars should produce the same kind of post.
- Producible weekly without burnout — pick angles that have endless variations, not 5-deep topics.

For each pillar return:
- id: kebab-case slug, ≤24 chars
- name: ≤32 chars, plain English
- angle: 1 sentence stating the worldview
- sample_format: 1 sentence describing one concrete post format that lives in this pillar

Return JSON only:
{
  "pillars": [{ "id": "...", "name": "...", "angle": "...", "sample_format": "..." }, ...3 items],
  "reasoning": "<2 sentences on which wiki signals you used>",
  "confidence": <0.0-1.0>
}`;

export interface DirectorPillarsInput {
  wiki: Partial<BrandWiki>;
  artistName?: string;
}

export interface DirectorPillarsResult {
  pillars: Array<{ id: string; name: string; angle: string; sample_format: string }>;
  reasoning: string;
  confidence: number | null;
  tokensUsed: number;
  durationMs: number;
}

export async function runGeneratePillars(
  input: DirectorPillarsInput,
): Promise<DirectorPillarsResult> {
  const start = Date.now();
  const userMessage = [
    `# BRAND WIKI SNAPSHOT`,
    `Artist: ${input.artistName ?? "(unnamed)"}`,
    ...summarizeWikiLines(input.wiki),
    "",
    `Propose 3 content pillars. Return JSON.`,
  ].join("\n");

  const response = await callLLM({
    systemPrompt: PILLARS_SYSTEM_PROMPT,
    userMessage,
    jsonMode: true,
    model: "claude-sonnet-4-20250514",
    maxTokens: 800,
    temperature: 0.45,
  });
  const parsed = JSON.parse(response.content);
  const pillars = Array.isArray(parsed.pillars) ? parsed.pillars : [];
  return {
    pillars: pillars.slice(0, 3).map((p: Record<string, unknown>) => ({
      id: String(p.id ?? ""),
      name: String(p.name ?? ""),
      angle: String(p.angle ?? ""),
      sample_format: String(p.sample_format ?? ""),
    })),
    reasoning: String(parsed.reasoning ?? ""),
    confidence: clampConfidence(parsed.confidence),
    tokensUsed: response.tokensUsed,
    durationMs: Date.now() - start,
  };
}

// ── Content Fit Scoring ──────────────────────────────────────────────────
// 4 sub-scores (each 0–1) on a content piece, given the artist's wiki.
// Threshold logic in API: <0.75 = revise, ≥0.75 = ship-ready, ≥0.90 = anchor.

const SCORE_SYSTEM_PROMPT = `You are the FRVR Sounds Brand Director scoring a piece of content against the artist's Brand Wiki.

Score four dimensions, each 0.0–1.0:

1) identity_match — does this piece carry the artist's core_pain / core_beliefs / key_themes / public_truth? Score high only if a reader who knows the wiki would say "yes, that's them." Generic-sounding content scores ≤0.5 even if well-written.

2) emotional_accuracy — does the dominant emotion in the piece match desired_emotions? Off-emotion content scores low. If the piece evokes 'tense' but their wiki desires 'reverent', that's a mismatch.

3) audience_relevance — does the piece resolve audience_pain_points or speak to audience_desires? Score on the connection from THIS PIECE to the artist's stated primary_audience, not to a generic "good audience."

4) platform_fit — does it match the conventions of its target platform (length, hook position, aspect-ratio implications, format-specific vocabulary)?

For each failing dimension (<0.75) emit a flag string and a one-sentence suggestion. Do not pad praise.

Return JSON only:
{
  "identity_match": <0.0-1.0>,
  "emotional_accuracy": <0.0-1.0>,
  "audience_relevance": <0.0-1.0>,
  "platform_fit": <0.0-1.0>,
  "flags": [<string>, ...],
  "suggestions": [{ "dimension": "<dim_key>", "suggestion": "<actionable>" }, ...],
  "reasoning": "<2-3 sentences citing wiki signals>",
  "confidence": <0.0-1.0>
}`;

export interface DirectorScoreContentInput {
  wiki: Partial<BrandWiki>;
  artistName?: string;
  piece: {
    platform: string;
    hook: string;
    body: string;
    cta: string;
    pillar_id?: string | null;
    format_id?: string | null;
  };
}

export interface DirectorScoreContentResult {
  identity_match: number;
  emotional_accuracy: number;
  audience_relevance: number;
  platform_fit: number;
  total: number;
  flags: string[];
  suggestions: Array<{ dimension: string; suggestion: string }>;
  reasoning: string;
  confidence: number | null;
  tokensUsed: number;
  durationMs: number;
}

function clamp01(n: unknown): number {
  const x = typeof n === "number" ? n : 0;
  return Math.max(0, Math.min(1, x));
}

export async function runScoreContent(
  input: DirectorScoreContentInput,
): Promise<DirectorScoreContentResult> {
  const start = Date.now();
  const userMessage = [
    `# BRAND WIKI SNAPSHOT`,
    `Artist: ${input.artistName ?? "(unnamed)"}`,
    ...summarizeWikiLines(input.wiki),
    "",
    `# CONTENT PIECE`,
    `Platform: ${input.piece.platform}`,
    input.piece.pillar_id ? `Pillar: ${input.piece.pillar_id}` : "",
    input.piece.format_id ? `Format: ${input.piece.format_id}` : "",
    `Hook: ${input.piece.hook}`,
    `Body: ${input.piece.body}`,
    `CTA: ${input.piece.cta}`,
    "",
    `Score the four dimensions. Return JSON.`,
  ]
    .filter(Boolean)
    .join("\n");

  const response = await callLLM({
    systemPrompt: SCORE_SYSTEM_PROMPT,
    userMessage,
    jsonMode: true,
    model: "claude-sonnet-4-20250514",
    maxTokens: 700,
    temperature: 0.2,
  });
  const parsed = JSON.parse(response.content);
  const im = clamp01(parsed.identity_match);
  const ea = clamp01(parsed.emotional_accuracy);
  const ar = clamp01(parsed.audience_relevance);
  const pf = clamp01(parsed.platform_fit);
  const total = (im + ea + ar + pf) / 4;
  return {
    identity_match: im,
    emotional_accuracy: ea,
    audience_relevance: ar,
    platform_fit: pf,
    total,
    flags: Array.isArray(parsed.flags) ? parsed.flags.map(String) : [],
    suggestions: Array.isArray(parsed.suggestions)
      ? parsed.suggestions.map((s: Record<string, unknown>) => ({
          dimension: String(s.dimension ?? ""),
          suggestion: String(s.suggestion ?? ""),
        }))
      : [],
    reasoning: String(parsed.reasoning ?? ""),
    confidence: clampConfidence(parsed.confidence),
    tokensUsed: response.tokensUsed,
    durationMs: Date.now() - start,
  };
}

const HOOKS_SYSTEM_PROMPT = `You are the FRVR Sounds Brand Director. Generate the artist's 10-template Hook Library — the reusable opening lines they'll deploy weekly across content.

Hooks must:
- Pull from the artist's specific identity, not generic advice. Each hook should reference a concrete thing in their wiki: a belief, a pain they resolve, a contrarian take, an emotion their music delivers.
- Be platform-agnostic. They should work as the first line of a Reel, the first sentence of a caption, or the cold open of a voice note.
- Be reusable templates with [BRACKETS] for the variable that changes per post.
- Span the artist's emotional palette (desired_emotions). At least one hook per dominant emotion if possible.

For each hook return:
- id: short slug "h-01" through "h-10"
- text: the template, ≤140 chars
- pillar_id: which content pillar this hook serves (if you can tell — empty string if not)
- emotion: one word from the artist's desired_emotions or emotional_tags

Return JSON only:
{
  "hooks": [{ "id": "h-01", "text": "...", "pillar_id": "...", "emotion": "..." }, ...10 items],
  "reasoning": "<2 sentences>",
  "confidence": <0.0-1.0>
}`;

export interface DirectorHooksInput {
  wiki: Partial<BrandWiki>;
  pillars?: Array<{ id: string; name: string }>;
  artistName?: string;
}

export interface DirectorHooksResult {
  hooks: Array<{ id: string; text: string; pillar_id: string; emotion: string }>;
  reasoning: string;
  confidence: number | null;
  tokensUsed: number;
  durationMs: number;
}

export async function runGenerateHooks(
  input: DirectorHooksInput,
): Promise<DirectorHooksResult> {
  const start = Date.now();
  const userMessage = [
    `# BRAND WIKI SNAPSHOT`,
    `Artist: ${input.artistName ?? "(unnamed)"}`,
    ...summarizeWikiLines(input.wiki),
    "",
    input.pillars && input.pillars.length > 0
      ? `# LOCKED PILLARS\n${input.pillars.map((p) => `- ${p.id}: ${p.name}`).join("\n")}`
      : `# LOCKED PILLARS: none yet — infer from wiki.`,
    "",
    `Generate exactly 10 hooks. Return JSON.`,
  ].join("\n");

  const response = await callLLM({
    systemPrompt: HOOKS_SYSTEM_PROMPT,
    userMessage,
    jsonMode: true,
    model: "claude-sonnet-4-20250514",
    maxTokens: 1200,
    temperature: 0.55,
  });
  const parsed = JSON.parse(response.content);
  const hooks = Array.isArray(parsed.hooks) ? parsed.hooks : [];
  return {
    hooks: hooks.slice(0, 10).map((h: Record<string, unknown>, i: number) => ({
      id: String(h.id ?? `h-${String(i + 1).padStart(2, "0")}`),
      text: String(h.text ?? ""),
      pillar_id: String(h.pillar_id ?? ""),
      emotion: String(h.emotion ?? ""),
    })),
    reasoning: String(parsed.reasoning ?? ""),
    confidence: clampConfidence(parsed.confidence),
    tokensUsed: response.tokensUsed,
    durationMs: Date.now() - start,
  };
}

// ── V2 Module Output Layer ──────────────────────────────────────────────
// Generators that turn an artist's Brand Wiki into shippable artifacts —
// scripts, hook seeds, caption starters, mood-format mappings. Persisted
// to brand_wiki.module_outputs.<module_id>.<output_key> by the API route.

const ORIGIN_SCRIPT_SYSTEM_PROMPT = `You are the FRVR Sounds Brand Director writing a 45-second short-form video script that the artist can shoot tomorrow. The piece dramatizes the moment their artistic identity began.

Read the Brand Wiki, especially origin_story, core_pain, transformation_before/after, and key_themes. Write a script that:
- Opens with a tension hook (≤6 seconds), no preamble. The hook should reference a concrete detail from origin_story (place, age, specific sensory anchor).
- Holds the moment for 10–15 seconds — what they saw, heard, felt — concrete imagery only.
- Lands the reveal: how this moment changed what they make. Reference transformation_before/after if present.
- Ends with a CTA that ties to the artist's positioning, not a generic "follow."

Format as four labeled beats: HOOK / MOMENT / REVEAL / CTA. Keep total under 120 spoken words. Voice-match the artist's existing wiki language — if they sound terse, write terse.

Return JSON only:
{
  "hook": "<≤6s opening>",
  "moment": "<10-15s sensory anchor>",
  "reveal": "<the change>",
  "cta": "<specific call>",
  "shot_notes": "<2 sentences on visual treatment — 1 location idea, 1 cut/transition note>",
  "reasoning": "<2 sentences on which wiki fields you anchored to>",
  "confidence": <0.0-1.0>
}`;

export interface DirectorOriginScriptInput {
  wiki: Partial<BrandWiki>;
  artistName?: string;
}

export interface DirectorOriginScriptResult {
  hook: string;
  moment: string;
  reveal: string;
  cta: string;
  shot_notes: string;
  reasoning: string;
  confidence: number | null;
  tokensUsed: number;
  durationMs: number;
}

export async function runGenerateOriginScript(
  input: DirectorOriginScriptInput,
): Promise<DirectorOriginScriptResult> {
  const start = Date.now();
  const userMessage = [
    `# BRAND WIKI SNAPSHOT`,
    `Artist: ${input.artistName ?? "(unnamed)"}`,
    ...summarizeWikiLines(input.wiki),
    "",
    `Write a 45-second origin-moment script. Return JSON.`,
  ].join("\n");

  const response = await callLLM({
    systemPrompt: ORIGIN_SCRIPT_SYSTEM_PROMPT,
    userMessage,
    jsonMode: true,
    model: "claude-sonnet-4-20250514",
    maxTokens: 700,
    temperature: 0.55,
  });
  const parsed = JSON.parse(response.content);
  return {
    hook: String(parsed.hook ?? ""),
    moment: String(parsed.moment ?? ""),
    reveal: String(parsed.reveal ?? ""),
    cta: String(parsed.cta ?? ""),
    shot_notes: String(parsed.shot_notes ?? ""),
    reasoning: String(parsed.reasoning ?? ""),
    confidence: clampConfidence(parsed.confidence),
    tokensUsed: response.tokensUsed,
    durationMs: Date.now() - start,
  };
}

const CONTRARIAN_HOOKS_SYSTEM_PROMPT = `You are the FRVR Sounds Brand Director generating 5 belief-driven contrarian hooks. These differ from the artist's general 10-hook library — these hooks specifically dramatize a STANCE the artist holds that costs them generic appeal.

Read core_beliefs, public_truth, and differentiators. Each hook should:
- Lead with the contrarian belief, not the resolution
- Reference a concrete enemy ("most artists in [niche] do X") or a concrete cost ("90% of supervisors disagree with this")
- Be ≤140 chars
- Use [BRACKETS] for one variable that changes per post

Avoid generic gotcha hooks ("what no one tells you about…"). Anchor each in something specific from the wiki.

Return JSON only:
{
  "hooks": [
    { "id": "ch-01", "text": "...", "belief": "<which core_belief or differentiator this dramatizes>", "enemy": "<who/what the hook positions against>" },
    ...5 items
  ],
  "reasoning": "<2 sentences>",
  "confidence": <0.0-1.0>
}`;

export interface DirectorContrarianHooksInput {
  wiki: Partial<BrandWiki>;
  artistName?: string;
}

export interface DirectorContrarianHooksResult {
  hooks: Array<{ id: string; text: string; belief: string; enemy: string }>;
  reasoning: string;
  confidence: number | null;
  tokensUsed: number;
  durationMs: number;
}

export async function runGenerateContrarianHooks(
  input: DirectorContrarianHooksInput,
): Promise<DirectorContrarianHooksResult> {
  const start = Date.now();
  const userMessage = [
    `# BRAND WIKI SNAPSHOT`,
    `Artist: ${input.artistName ?? "(unnamed)"}`,
    ...summarizeWikiLines(input.wiki),
    "",
    `Generate 5 contrarian hooks. Return JSON.`,
  ].join("\n");

  const response = await callLLM({
    systemPrompt: CONTRARIAN_HOOKS_SYSTEM_PROMPT,
    userMessage,
    jsonMode: true,
    model: "claude-sonnet-4-20250514",
    maxTokens: 700,
    temperature: 0.6,
  });
  const parsed = JSON.parse(response.content);
  const hooks = Array.isArray(parsed.hooks) ? parsed.hooks : [];
  return {
    hooks: hooks.slice(0, 5).map((h: Record<string, unknown>, i: number) => ({
      id: String(h.id ?? `ch-${String(i + 1).padStart(2, "0")}`),
      text: String(h.text ?? ""),
      belief: String(h.belief ?? ""),
      enemy: String(h.enemy ?? ""),
    })),
    reasoning: String(parsed.reasoning ?? ""),
    confidence: clampConfidence(parsed.confidence),
    tokensUsed: response.tokensUsed,
    durationMs: Date.now() - start,
  };
}

const CAPTION_STARTERS_SYSTEM_PROMPT = `You are the FRVR Sounds Brand Director generating caption starter banks per emotion the artist's music delivers.

For each emotion in the artist's desired_emotions, write 3 caption opening lines that an artist could drop in front of any post. Captions should:
- Match the emotion's texture (a "longing" caption reads different from "defiant")
- Reference the artist's specific positioning, not be generic
- Be ≤200 chars each
- End in a way that pulls the reader into the body of the post

Skip emotions the artist hasn't selected. Return only what the wiki contains.

Return JSON only:
{
  "by_emotion": {
    "<emotion>": ["...", "...", "..."],
    ...
  },
  "reasoning": "<2 sentences>",
  "confidence": <0.0-1.0>
}`;

export interface DirectorCaptionStartersInput {
  wiki: Partial<BrandWiki>;
  artistName?: string;
}

export interface DirectorCaptionStartersResult {
  by_emotion: Record<string, string[]>;
  reasoning: string;
  confidence: number | null;
  tokensUsed: number;
  durationMs: number;
}

export async function runGenerateCaptionStarters(
  input: DirectorCaptionStartersInput,
): Promise<DirectorCaptionStartersResult> {
  const start = Date.now();
  const userMessage = [
    `# BRAND WIKI SNAPSHOT`,
    `Artist: ${input.artistName ?? "(unnamed)"}`,
    ...summarizeWikiLines(input.wiki),
    "",
    `Generate 3 caption starters per desired emotion. Return JSON.`,
  ].join("\n");

  const response = await callLLM({
    systemPrompt: CAPTION_STARTERS_SYSTEM_PROMPT,
    userMessage,
    jsonMode: true,
    model: "claude-sonnet-4-20250514",
    maxTokens: 1100,
    temperature: 0.5,
  });
  const parsed = JSON.parse(response.content);
  const byEmotion: Record<string, string[]> = {};
  if (parsed.by_emotion && typeof parsed.by_emotion === "object") {
    for (const [k, v] of Object.entries(parsed.by_emotion)) {
      if (Array.isArray(v)) {
        byEmotion[k] = v.slice(0, 5).map((x) => String(x));
      }
    }
  }
  return {
    by_emotion: byEmotion,
    reasoning: String(parsed.reasoning ?? ""),
    confidence: clampConfidence(parsed.confidence),
    tokensUsed: response.tokensUsed,
    durationMs: Date.now() - start,
  };
}

const MOOD_FORMAT_SYSTEM_PROMPT = `You are the FRVR Sounds Brand Director mapping the artist's sonic moods → recommended content formats.

For each mood in sonic_moods, propose 2–3 content format ideas that emotionally rhyme with that mood. Format ideas should be concrete (e.g. "BTS multitrack scroll with VO" not "behind-the-scenes content"). Tense moods → cliffhanger / tension / sudden reveal formats. Intimate moods → confessional / unedited / raw formats. Anthemic moods → triumphant / build / payoff formats. Etc.

Skip moods the artist doesn't have.

Return JSON only:
{
  "by_mood": [
    { "mood": "<mood>", "formats": [{ "name": "<format name>", "structure": "<one sentence>" }, ...2-3] },
    ...
  ],
  "reasoning": "<2 sentences>",
  "confidence": <0.0-1.0>
}`;

export interface DirectorMoodFormatInput {
  wiki: Partial<BrandWiki>;
  artistName?: string;
}

export interface DirectorMoodFormatResult {
  by_mood: Array<{
    mood: string;
    formats: Array<{ name: string; structure: string }>;
  }>;
  reasoning: string;
  confidence: number | null;
  tokensUsed: number;
  durationMs: number;
}

export async function runGenerateMoodFormatMap(
  input: DirectorMoodFormatInput,
): Promise<DirectorMoodFormatResult> {
  const start = Date.now();
  const userMessage = [
    `# BRAND WIKI SNAPSHOT`,
    `Artist: ${input.artistName ?? "(unnamed)"}`,
    ...summarizeWikiLines(input.wiki),
    "",
    `Map each sonic mood to 2-3 content format ideas. Return JSON.`,
  ].join("\n");

  const response = await callLLM({
    systemPrompt: MOOD_FORMAT_SYSTEM_PROMPT,
    userMessage,
    jsonMode: true,
    model: "claude-sonnet-4-20250514",
    maxTokens: 1100,
    temperature: 0.5,
  });
  const parsed = JSON.parse(response.content);
  const byMood = Array.isArray(parsed.by_mood) ? parsed.by_mood : [];
  return {
    by_mood: byMood.slice(0, 12).map((m: Record<string, unknown>) => ({
      mood: String(m.mood ?? ""),
      formats: Array.isArray(m.formats)
        ? (m.formats as Array<Record<string, unknown>>).slice(0, 5).map((f) => ({
            name: String(f.name ?? ""),
            structure: String(f.structure ?? ""),
          }))
        : [],
    })),
    reasoning: String(parsed.reasoning ?? ""),
    confidence: clampConfidence(parsed.confidence),
    tokensUsed: response.tokensUsed,
    durationMs: Date.now() - start,
  };
}

// ── V2 Director — Content piece refinement modes ────────────────────────
// All three operate on a single piece (hook + body + cta + platform) and
// return either a refined version or 3-5 platform variants. No persistence —
// the UI on /execution/draft owns Accept/Discard + Save-as-new-draft.

interface PieceInput {
  platform: string;
  hook: string;
  body: string;
  cta: string;
}

const MULTIPLY_SYSTEM_PROMPT = `You are the FRVR Sounds Brand Director. Transform a single content piece into 3–5 platform-native variants. Same core idea, different conventions per platform.

Conventions you must respect (do not violate):
- instagram_reel: hook in first 1-2s, vertical 9:16, ≤60s VO, on-screen text optional
- tiktok: cold open, no preamble, hook in first 1s, ≤60s, native captions style
- youtube_short: stronger payoff than TikTok, ≤60s, slightly more polish
- x: ≤280 chars text-first, no emojis unless it lands the joke, optional one image/clip
- newsletter: 2-3 paragraphs, narrative voice, headline + 1-line subhead, ≤300 words

Each variant must:
- Keep the artist's core idea + voice from the original
- Open with a hook adapted to that platform's conventions, not just the original hook copy-pasted
- End with the right CTA shape for the platform

Return JSON only:
{
  "variants": [
    { "platform": "instagram_reel" | "tiktok" | "youtube_short" | "x" | "newsletter", "hook": "...", "body": "...", "cta": "...", "notes": "<1 sentence on what changed and why>" },
    ...3-5 items
  ],
  "reasoning": "<2 sentences>",
  "confidence": <0.0-1.0>
}`;

export interface DirectorMultiplyInput {
  wiki: Partial<BrandWiki>;
  artistName?: string;
  piece: PieceInput;
}

export interface DirectorMultiplyResult {
  variants: Array<{
    platform: string;
    hook: string;
    body: string;
    cta: string;
    notes: string;
  }>;
  reasoning: string;
  confidence: number | null;
  tokensUsed: number;
  durationMs: number;
}

export async function runMultiplyPost(
  input: DirectorMultiplyInput,
): Promise<DirectorMultiplyResult> {
  const start = Date.now();
  const userMessage = [
    `# BRAND WIKI SNAPSHOT`,
    `Artist: ${input.artistName ?? "(unnamed)"}`,
    ...summarizeWikiLines(input.wiki),
    "",
    `# ORIGINAL PIECE`,
    `Platform: ${input.piece.platform}`,
    `Hook: ${input.piece.hook}`,
    `Body: ${input.piece.body}`,
    `CTA: ${input.piece.cta}`,
    "",
    `Generate 3-5 platform variants. Return JSON.`,
  ].join("\n");

  const response = await callLLM({
    systemPrompt: MULTIPLY_SYSTEM_PROMPT,
    userMessage,
    jsonMode: true,
    model: "claude-sonnet-4-20250514",
    maxTokens: 1500,
    temperature: 0.55,
  });
  const parsed = JSON.parse(response.content);
  const variants = Array.isArray(parsed.variants) ? parsed.variants : [];
  return {
    variants: variants.slice(0, 5).map((v: Record<string, unknown>) => ({
      platform: String(v.platform ?? ""),
      hook: String(v.hook ?? ""),
      body: String(v.body ?? ""),
      cta: String(v.cta ?? ""),
      notes: String(v.notes ?? ""),
    })),
    reasoning: String(parsed.reasoning ?? ""),
    confidence: clampConfidence(parsed.confidence),
    tokensUsed: response.tokensUsed,
    durationMs: Date.now() - start,
  };
}

const VIRAL_SYSTEM_PROMPT = `You are the FRVR Sounds Brand Director. Re-write a piece to maximize hook tension, cliffhanger structure, and payoff clarity — without making it generic or off-brand.

Levers to pull:
- Open with a more concrete enemy / stake / question in the first line
- Surface the controversial element earlier (don't bury the lede)
- Add a mid-piece tension turn
- Sharpen the payoff so the reader feels the click

DO NOT:
- Strip the artist's voice (read tone_descriptors / voice_dos / voice_donts)
- Add hype words ("incredible", "amazing", "you won't believe")
- Make claims the wiki doesn't support
- Lengthen — viral usually means tighter

Return JSON only:
{
  "hook": "...",
  "body": "...",
  "cta": "...",
  "viral_delta": "<1 sentence on the specific change that lifts viral likelihood>",
  "viral_likelihood_delta": <-1.0 to 1.0 — your estimate of the viral-likelihood change>,
  "reasoning": "<2 sentences>",
  "confidence": <0.0-1.0>
}`;

export interface DirectorRewriteInput {
  wiki: Partial<BrandWiki>;
  artistName?: string;
  piece: PieceInput;
}

export interface DirectorRewriteResult {
  hook: string;
  body: string;
  cta: string;
  delta_message: string;
  delta_score: number | null;
  reasoning: string;
  confidence: number | null;
  tokensUsed: number;
  durationMs: number;
}

export async function runMakeMoreViral(
  input: DirectorRewriteInput,
): Promise<DirectorRewriteResult> {
  const start = Date.now();
  const userMessage = [
    `# BRAND WIKI SNAPSHOT`,
    `Artist: ${input.artistName ?? "(unnamed)"}`,
    ...summarizeWikiLines(input.wiki),
    "",
    `# ORIGINAL PIECE`,
    `Platform: ${input.piece.platform}`,
    `Hook: ${input.piece.hook}`,
    `Body: ${input.piece.body}`,
    `CTA: ${input.piece.cta}`,
    "",
    `Re-write for viral lift. Return JSON.`,
  ].join("\n");

  const response = await callLLM({
    systemPrompt: VIRAL_SYSTEM_PROMPT,
    userMessage,
    jsonMode: true,
    model: "claude-sonnet-4-20250514",
    maxTokens: 1100,
    temperature: 0.55,
  });
  const parsed = JSON.parse(response.content);
  return {
    hook: String(parsed.hook ?? ""),
    body: String(parsed.body ?? ""),
    cta: String(parsed.cta ?? ""),
    delta_message: String(parsed.viral_delta ?? ""),
    delta_score:
      typeof parsed.viral_likelihood_delta === "number"
        ? Math.max(-1, Math.min(1, parsed.viral_likelihood_delta))
        : null,
    reasoning: String(parsed.reasoning ?? ""),
    confidence: clampConfidence(parsed.confidence),
    tokensUsed: response.tokensUsed,
    durationMs: Date.now() - start,
  };
}

const NICHE_SYSTEM_PROMPT = `You are the FRVR Sounds Brand Director. Re-write a piece to maximize niche fit — narrower appeal, more insider language, fewer generic gestures.

Read the artist's niche block (niche_micro_statement, niche_competitors, niche_gap, niche_ownable_territory) and core_beliefs. Then:
- Replace generic words with specific in-niche vocabulary the artist's audience would recognize
- Strip any line that could be said by an out-of-niche artist
- Reference the artist's specific positioning (their micro-niche statement) at least once
- Sharpen the CTA toward the niche audience, not "everyone"

DO NOT make it longer. Niche usually means tighter.

Return JSON only:
{
  "hook": "...",
  "body": "...",
  "cta": "...",
  "niche_delta": "<1 sentence on the specific change that sharpens niche fit>",
  "niche_fit_delta": <-1.0 to 1.0 — your estimate of niche-fit change>,
  "reasoning": "<2 sentences>",
  "confidence": <0.0-1.0>
}`;

export async function runMakeMoreNiche(
  input: DirectorRewriteInput,
): Promise<DirectorRewriteResult> {
  const start = Date.now();
  const userMessage = [
    `# BRAND WIKI SNAPSHOT`,
    `Artist: ${input.artistName ?? "(unnamed)"}`,
    ...summarizeWikiLines(input.wiki),
    "",
    `# ORIGINAL PIECE`,
    `Platform: ${input.piece.platform}`,
    `Hook: ${input.piece.hook}`,
    `Body: ${input.piece.body}`,
    `CTA: ${input.piece.cta}`,
    "",
    `Re-write for niche fit. Return JSON.`,
  ].join("\n");

  const response = await callLLM({
    systemPrompt: NICHE_SYSTEM_PROMPT,
    userMessage,
    jsonMode: true,
    model: "claude-sonnet-4-20250514",
    maxTokens: 1100,
    temperature: 0.45,
  });
  const parsed = JSON.parse(response.content);
  return {
    hook: String(parsed.hook ?? ""),
    body: String(parsed.body ?? ""),
    cta: String(parsed.cta ?? ""),
    delta_message: String(parsed.niche_delta ?? ""),
    delta_score:
      typeof parsed.niche_fit_delta === "number"
        ? Math.max(-1, Math.min(1, parsed.niche_fit_delta))
        : null,
    reasoning: String(parsed.reasoning ?? ""),
    confidence: clampConfidence(parsed.confidence),
    tokensUsed: response.tokensUsed,
    durationMs: Date.now() - start,
  };
}

// ── V2 Signal-tier Quickstart Artifact ─────────────────────────────────
// 5-minute first-experience output. Given a minimal wiki (3 fields the
// quickstart flow collected), return 1 hook + 1 caption + 1 post format
// the artist can ship today.

const QUICKSTART_SYSTEM_PROMPT = `You are the FRVR Sounds Brand Director. The artist just answered 3 questions in their first 5 minutes. Their wiki is intentionally thin — be honest about what's there but generate a piece they could record TODAY.

Output exactly:
- 1 HOOK (≤140 chars, first line of a Reel/TikTok)
- 1 CAPTION (≤220 chars, sets up the post body)
- 1 POST FORMAT — name + 1-line structure that they can shoot in <30 minutes with a phone

The piece must:
- Anchor in the answers they gave (core_pain, desired_emotions, primary_audience)
- Be specific enough that a stranger reading the hook would picture a concrete moment
- Avoid generic creator-economy language ("did you know", "5 tips", "what no one tells you")

Return JSON only:
{
  "hook": "...",
  "caption": "...",
  "post_format": { "name": "<short>", "structure": "<1 sentence shoot recipe>" },
  "reasoning": "<2 sentences on which wiki signals you used>",
  "confidence": <0.0-1.0>
}`;

export interface DirectorQuickstartInput {
  wiki: Partial<BrandWiki>;
  artistName?: string;
}

export interface DirectorQuickstartResult {
  hook: string;
  caption: string;
  post_format: { name: string; structure: string };
  reasoning: string;
  confidence: number | null;
  tokensUsed: number;
  durationMs: number;
}

export async function runQuickstartArtifact(
  input: DirectorQuickstartInput,
): Promise<DirectorQuickstartResult> {
  const start = Date.now();
  const userMessage = [
    `# BRAND WIKI SNAPSHOT`,
    `Artist: ${input.artistName ?? "(unnamed)"}`,
    ...summarizeWikiLines(input.wiki),
    "",
    `Generate the artist's first shippable piece. Return JSON.`,
  ].join("\n");

  const response = await callLLM({
    systemPrompt: QUICKSTART_SYSTEM_PROMPT,
    userMessage,
    jsonMode: true,
    model: "claude-sonnet-4-20250514",
    maxTokens: 700,
    temperature: 0.55,
  });
  const parsed = JSON.parse(response.content);
  return {
    hook: String(parsed.hook ?? ""),
    caption: String(parsed.caption ?? ""),
    post_format: {
      name: String(parsed.post_format?.name ?? ""),
      structure: String(parsed.post_format?.structure ?? ""),
    },
    reasoning: String(parsed.reasoning ?? ""),
    confidence: clampConfidence(parsed.confidence),
    tokensUsed: response.tokensUsed,
    durationMs: Date.now() - start,
  };
}
