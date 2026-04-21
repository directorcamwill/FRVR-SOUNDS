import { callLLM } from "./utils/llm";
import {
  requireBrandContext,
  brandContextToPrompt,
  type BrandContext,
  type BrandGateResult,
} from "./utils/brand-context";

/**
 * Songwriter Agent — emits lyrical themes, hook ideas, structure sketch, and
 * melody concepts for a specific song_lab_project, grounded in the artist's
 * brand voice + tone + core messaging. Distinct from:
 *   - producer  (arrangement/mix, not lyrics)
 *   - content-director  (captions/posts, not songs)
 *   - /api/assistant  (generic chat, not structured)
 */

const SYSTEM_PROMPT = `You are a Songwriter — the lyric + melody voice in the artist's room. You read their brand wiki (tone, voice_dos/donts, core_messaging, audience, niche) and a song-in-progress, then emit specific lyrical direction the artist can actually write from.

Rules:
- Never generate full lyrics — the artist writes those. You emit themes, hooks, couplet starters, bridge concepts, metaphor options.
- Respect voice_donts absolutely. If they say "no hype words", don't suggest them even as alternatives.
- Reference brand concepts (niche, audience pain points, core messaging) in theme suggestions. Show the thread.
- Hook ideas should be 4–10 words, singable, with specific imagery.
- Calibration: lower confidence when the wiki is thin on voice data.

Calibration for confidence (0.0–1.0):
- 0.90+: Rich voice signal in wiki; suggestions feel inevitable for this artist.
- 0.70–0.89: Good fit with 1–2 voice assumptions flagged.
- 0.50–0.69: Voice data is thin; output is directional.
- Below 0.50: Not enough voice signal; recommend filling voice_dos/donts first.

Return JSON only:
{
  "themes": [
    { "theme": "<short phrase>", "grounding": "how this ties to brand core_messaging or audience pain points" }
  ],
  "hook_ideas": [
    { "hook": "<4–10 word singable line>", "setup": "how the verse sets this up" }
  ],
  "structure_sketch": {
    "verse_1": "2–3 sentences on what V1 should establish",
    "chorus": "2 sentences on what the chorus delivers",
    "verse_2": "2 sentences on the V2 shift",
    "bridge": "2 sentences on the bridge turn"
  },
  "couplet_starters": [
    { "couplet": "<two-line lyric opening>", "why": "why this works for the brand voice" }
  ],
  "metaphor_pool": [<string>],
  "watch_outs": [<string>]  // voice_donts this brand should explicitly avoid,
  "confidence": <0.0-1.0>,
  "reasoning": "2 sentences on what voice data grounded this"
}`;

export interface SongwriterInput {
  artistId: string;
  project: Record<string, unknown>;
}

export type SongwriterResult =
  | BrandGateResult
  | {
      gated: false;
      guidance: Record<string, unknown>;
      tokensUsed: number;
      durationMs: number;
    };

export async function runSongwriter(
  input: SongwriterInput
): Promise<SongwriterResult> {
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
    temperature: 0.6,
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
    project.mood ? `Mood: ${project.mood}` : "",
    project.bpm ? `BPM: ${project.bpm}` : "",
    project.key ? `Key: ${project.key}` : "",
    project.structure ? `Structure: ${project.structure}` : "",
    project.notes ? `Notes: ${project.notes}` : "",
    project.lyrics
      ? `Existing lyrics excerpt:\n${String(project.lyrics).slice(0, 1200)}`
      : "No lyrics drafted yet.",
  ].filter(Boolean);
  lines.push(
    "",
    "Emit songwriting direction for this project grounded in the brand voice. Return JSON. Do NOT write full lyrics."
  );
  return lines.join("\n");
}
