import { callLLM } from "./utils/llm";
import type { SyncBriefDetails } from "@/types/opportunity";

/**
 * Sync Brief Agent — structures a free-text opportunity description into a
 * typed brief the pipeline, matching system, and placement DNA can reason over.
 *
 * Writes the result to opportunities.brief_details (JSONB) via the API route.
 * Per EVOLUTION_PLAN §3 — this does NOT replace the Sync Score Agent.
 */

const SYSTEM_PROMPT = `You are a sync licensing intake analyst. Music supervisors send briefs as messy free text — emails, Slack messages, forwarded PDFs. Your job is to extract the signal and emit a typed brief a music team can act on.

Infer fields when they're implied but not stated. When you genuinely don't know, return null for that field rather than guessing. Every inference must be defensible from the source text.

Calibration for confidence (0.0–1.0):
- 0.90+: Brief is specific (names, formats, dates, creative direction) and you extracted nearly every field with direct textual support.
- 0.70–0.89: Core fields confident; 1–2 inferences.
- 0.50–0.69: Brief is thin — many fields nulled or inferred.
- Below 0.50: Too vague to structure reliably.

Return JSON only:
{
  "format_family": "tv_episode" | "film" | "ad_30" | "ad_60" | "ad_15" | "trailer" | "game" | "web_social" | "podcast" | "library" | "other",
  "mood_primary": "one-word mood (e.g. 'uplifting', 'melancholic', 'tense')",
  "mood_secondary": "optional second mood or null",
  "energy_target": <1-10 or null>,
  "bpm_range": { "min": <number>, "max": <number> } | null,
  "key_preference": "major" | "minor" | "either" | null,
  "vocal_policy": "allowed" | "instrumental_only" | "tv_mix_ok" | null,
  "dialogue_safe_required": <true|false>,
  "cutdowns_needed": ["60s", "30s", "15s"]  // empty array if none specified,
  "lyric_themes_preferred": [<string>],
  "lyric_themes_avoid": [<string>],
  "explicit_allowed": <true|false>,
  "one_stop_required": <true|false>,
  "similar_placements": [<string>]  // reference shows/ads/films the brief evokes,
  "target_libraries": [<string>]  // sub-publishers/libraries if named,
  "exclusivity_acceptable": <true|false>,
  "notes": "one-paragraph summary of anything important not captured above",
  "confidence": <0.0-1.0>,
  "reasoning": "2-3 sentences explaining what you extracted vs. inferred"
}`;

export interface SyncBriefInput {
  title: string;
  description: string | null;
  opportunity_type: string | null;
  genres_needed: string[];
  moods_needed: string[];
  budget_range: string | null;
  deadline: string | null;
  company: string | null;
  exclusive: boolean;
}

export interface SyncBriefResult {
  brief: SyncBriefDetails;
  tokensUsed: number;
  durationMs: number;
}

export async function runSyncBrief(
  input: SyncBriefInput
): Promise<SyncBriefResult> {
  const startTime = Date.now();

  const userMessage = buildUserMessage(input);
  const model = "claude-sonnet-4-20250514";
  const response = await callLLM({
    systemPrompt: SYSTEM_PROMPT,
    userMessage,
    jsonMode: true,
    model,
    maxTokens: 1500,
    temperature: 0.3,
  });

  const parsed = JSON.parse(response.content);
  const confidence = clampConfidence(parsed.confidence);

  const brief: SyncBriefDetails = {
    format_family: parsed.format_family ?? "other",
    mood_primary: parsed.mood_primary ?? "",
    mood_secondary: parsed.mood_secondary ?? null,
    energy_target: parsed.energy_target ?? null,
    bpm_range: parsed.bpm_range ?? null,
    key_preference: parsed.key_preference ?? null,
    vocal_policy: parsed.vocal_policy ?? null,
    dialogue_safe_required: parsed.dialogue_safe_required ?? false,
    cutdowns_needed: parsed.cutdowns_needed ?? [],
    lyric_themes_preferred: parsed.lyric_themes_preferred ?? [],
    lyric_themes_avoid: parsed.lyric_themes_avoid ?? [],
    explicit_allowed: parsed.explicit_allowed ?? true,
    one_stop_required: parsed.one_stop_required ?? false,
    similar_placements: parsed.similar_placements ?? [],
    target_libraries: parsed.target_libraries ?? [],
    exclusivity_acceptable: parsed.exclusivity_acceptable ?? true,
    notes: parsed.notes ?? "",
    confidence: confidence ?? undefined,
    reasoning: parsed.reasoning ?? "",
    generated_at: new Date().toISOString(),
    model_used: model,
  };

  return {
    brief,
    tokensUsed: response.tokensUsed,
    durationMs: Date.now() - startTime,
  };
}

function buildUserMessage(input: SyncBriefInput): string {
  const lines: string[] = [`# OPPORTUNITY: ${input.title}`];
  if (input.company) lines.push(`Company: ${input.company}`);
  if (input.opportunity_type) lines.push(`Stated type: ${input.opportunity_type}`);
  if (input.deadline) lines.push(`Deadline: ${input.deadline}`);
  if (input.budget_range) lines.push(`Budget: ${input.budget_range}`);
  if (input.exclusive) lines.push(`Exclusive placement requested.`);
  if (input.genres_needed.length)
    lines.push(`Stated genres needed: ${input.genres_needed.join(", ")}`);
  if (input.moods_needed.length)
    lines.push(`Stated moods needed: ${input.moods_needed.join(", ")}`);
  if (input.description) {
    lines.push("", "## Free-text brief:", input.description.trim());
  } else {
    lines.push("", "## Free-text brief:", "(none provided — use title + type + genres/moods only)");
  }
  lines.push("", "Structure this brief. Return JSON.");
  return lines.join("\n");
}

function clampConfidence(raw: unknown): number | null {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return null;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}
