import { callLLM } from "./utils/llm";
import {
  requireBrandContext,
  brandContextToPrompt,
  type BrandGateResult,
} from "./utils/brand-context";

/**
 * Collab Agent — emits collaborator archetypes + concrete search criteria the
 * artist can use to find producers / co-writers / feature artists / mixers /
 * topliners that match their brand + sonic identity. NOT a matchmaking
 * service — it does NOT return real contact data or invented names. It
 * returns archetypes + specific search queries the artist runs themselves.
 *
 * Distinct from:
 *   - outreach (planned for Sprint C in addendum — drafts messages to
 *     music supervisors, not collaborator finders)
 */

const SYSTEM_PROMPT = `You are the Collab Director — the person in the artist's room who knows who they should be in a room with. You read their brand wiki (niche, sonic identity, references, target formats) and emit a prioritized list of collaborator archetypes + specific search criteria the artist can use to find real people.

Rules:
- NEVER invent specific names of collaborators. Return archetypes + search queries, not "reach out to X".
- Every archetype must be grounded in the brand wiki (reference sonic identity, target formats, etc.).
- Search queries must be concrete enough to paste into IG/TikTok/SoundBetter/Splice/Discogs. Not "find a good producer" but "Atlanta producers who've released on [label type] with credits similar to [reference artist]".
- Each archetype includes the BRAND-FIT reasoning — why this archetype for this artist.
- Calibration: lower confidence when the wiki doesn't specify enough sonic/format detail.

Calibration for confidence (0.0–1.0):
- 0.85+: Wiki has rich sonic + format data; archetypes are clearly targeted.
- 0.65–0.84: Good fit with 1–2 assumptions.
- 0.45–0.64: Sparse data, archetypes are directional.
- Below 0.45: Recommend filling sonic identity + sync targets first.

Return JSON only:
{
  "archetypes": [
    {
      "role": "producer" | "co_writer" | "topliner" | "feature_artist" | "mixer" | "engineer" | "visual_collaborator" | "other",
      "label": "<2–5 word descriptor, e.g. 'Tape-saturation-forward indie R&B producer'>",
      "brand_fit_reasoning": "2 sentences grounded in brand_wiki",
      "search_queries": [
        "<specific paste-able query for a platform>"
      ],
      "platforms": ["soundbetter" | "splice" | "instagram" | "tiktok" | "discogs" | "linkedin" | "other"],
      "priority": "high" | "medium" | "low"
    }
  ],
  "partnership_principles": [<string>]  // 3-5 things to look for / avoid when evaluating fit,
  "confidence": <0.0-1.0>,
  "reasoning": "2 sentences on what brand data grounded this"
}`;

export interface CollabInput {
  artistId: string;
  project?: Record<string, unknown> | null;
}

export type CollabResult =
  | BrandGateResult
  | {
      gated: false;
      guidance: Record<string, unknown>;
      tokensUsed: number;
      durationMs: number;
    };

export async function runCollab(input: CollabInput): Promise<CollabResult> {
  const gate = await requireBrandContext(input.artistId);
  if (gate.gated) return gate;

  const start = Date.now();
  const lines: string[] = [
    `# BRAND CONTEXT`,
    brandContextToPrompt(gate.context),
  ];
  if (input.project) {
    lines.push(
      "",
      `# CURRENT SONG (context, not primary driver)`,
      `Title: ${input.project.title ?? "(untitled)"}`,
      input.project.status ? `Status: ${input.project.status}` : "",
      input.project.genre ? `Genre: ${input.project.genre}` : "",
      input.project.mood ? `Mood: ${input.project.mood}` : ""
    );
  }
  lines.push(
    "",
    "Emit a ranked set of collaborator archetypes with concrete search queries. Do NOT invent names. Return JSON."
  );

  const model = "claude-sonnet-4-20250514";
  const response = await callLLM({
    systemPrompt: SYSTEM_PROMPT,
    userMessage: lines.filter(Boolean).join("\n"),
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
