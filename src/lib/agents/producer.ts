import { callLLM } from "./utils/llm";
import {
  requireBrandContext,
  brandContextToPrompt,
  type BrandContext,
  type BrandGateResult,
} from "./utils/brand-context";

/**
 * Producer Agent — emits arrangement + instrumentation + mix direction guidance
 * for a specific song_lab_project, grounded in the artist's brand_wiki
 * (sonic identity + mix prefs + reference tracks). Distinct from:
 *   - sync-engine  (scores sync-readiness)
 *   - content-director (content/captions, not production)
 *   - /api/assistant (generic chat, not structured)
 */

const SYSTEM_PROMPT = `You are a Producer — the arrangement + sonic design voice in the artist's room. You read their brand wiki (sonic identity, references, mix prefs, genre) and a specific song-in-progress, then emit concrete production direction a producer/engineer could act on tomorrow.

Rules:
- Be specific. "Use a saturated Rhodes" beats "add keys".
- Reference the brand wiki's sonic textures + references by name. If they said "warm tape saturation", call it out when it applies.
- Respect mix_preferences (lufs_target, stereo_width, vocal_character, compression_style) when emitting mix direction.
- Never prescribe something outside the artist's stated genre or BPM range without flagging it as an intentional deviation.
- Output is directional, not deterministic — confidence should track how well the project aligns with the brand wiki.

Calibration for confidence (0.0–1.0):
- 0.90+: Tight alignment — project genre/mood match brand wiki, references apply.
- 0.70–0.89: Good fit, one or two assumptions.
- 0.50–0.69: Partial fit — flag the gap in reasoning.
- Below 0.50: Project is outside the brand; say so explicitly.

Return JSON only:
{
  "arrangement": {
    "structure_suggestion": "Intro — V1 — Chorus — V2 — Chorus — Bridge — Chorus — Outro (or your recommended structure)",
    "intro_seconds": <number>,
    "impact_point_seconds": <number>,
    "ending_type": "hard_button" | "cold_stop" | "fade" | "ring_out" | "loopable",
    "notes": "1–2 paragraphs on arrangement choices grounded in brand + sync targets"
  },
  "instrumentation": [
    { "element": "drums" | "bass" | "keys" | "guitar" | "synth" | "strings" | "percussion" | "vocal_treatment" | "fx" | "other", "direction": "specific production call", "reasoning": "why this for this brand + song" }
  ],
  "mix_direction": {
    "lufs_target": <number | null>,
    "true_peak_target": <number | null>,
    "stereo_notes": "stereo width + placement",
    "vocal_treatment": "close-mic'd warm, compressed, etc.",
    "tonal_balance": "low-mid cuts, air boost, etc.",
    "notes": "1 paragraph"
  },
  "reference_mapping": [
    { "reference_track": "<artist — title from brand_wiki>", "what_to_borrow": "specific element", "what_to_avoid": "specific thing NOT to copy" }
  ],
  "risks": [<string>],
  "confidence": <0.0-1.0>,
  "reasoning": "2 sentences on how brand data grounded this guidance"
}`;

export interface ProducerInput {
  artistId: string;
  project: Record<string, unknown>;
}

export type ProducerResult =
  | BrandGateResult
  | {
      gated: false;
      guidance: Record<string, unknown>;
      tokensUsed: number;
      durationMs: number;
    };

export async function runProducer(
  input: ProducerInput
): Promise<ProducerResult> {
  const gate = await requireBrandContext(input.artistId);
  if (gate.gated) return gate;

  const start = Date.now();
  const userMessage = buildUserMessage(gate.context, input.project);

  const model = "claude-sonnet-4-20250514";
  const response = await callLLM({
    systemPrompt: SYSTEM_PROMPT,
    userMessage,
    jsonMode: true,
    model,
    maxTokens: 2500,
    temperature: 0.4,
  });

  const parsed = JSON.parse(response.content);
  return {
    gated: false,
    guidance: {
      ...parsed,
      generated_at: new Date().toISOString(),
      model_used: model,
    },
    tokensUsed: response.tokensUsed,
    durationMs: Date.now() - start,
  };
}

function buildUserMessage(
  ctx: BrandContext,
  project: Record<string, unknown>
): string {
  const lines: string[] = [
    `# BRAND CONTEXT`,
    brandContextToPrompt(ctx),
    "",
    `# SONG LAB PROJECT`,
    `Title: ${project.title ?? "(untitled)"}`,
    project.status ? `Status: ${project.status}` : "",
    project.bpm ? `BPM: ${project.bpm}` : "",
    project.key ? `Key: ${project.key}` : "",
    project.genre ? `Stated genre: ${project.genre}` : "",
    project.mood ? `Stated mood: ${project.mood}` : "",
    project.structure ? `Structure: ${project.structure}` : "",
    project.notes ? `Notes: ${project.notes}` : "",
    Array.isArray(project.reference_tracks) && project.reference_tracks.length
      ? `Project references: ${(project.reference_tracks as string[]).join(", ")}`
      : "",
    project.lyrics
      ? `Lyrics excerpt:\n${String(project.lyrics).slice(0, 800)}`
      : "",
  ].filter(Boolean);
  lines.push(
    "",
    "Emit production direction for this song grounded in the brand wiki. Return JSON."
  );
  return lines.join("\n");
}
