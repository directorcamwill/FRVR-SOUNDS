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
