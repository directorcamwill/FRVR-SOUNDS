import { callLLM } from "./utils/llm";
import { matchPlacements, type SongFeatures } from "@/lib/placement-matcher";
import { analyzeMatches } from "@/lib/pattern-intelligence";
import type { Song, SongMetadata } from "@/types/song";
import type { Placement } from "@/lib/placements";

/**
 * Guided Recommendations Agent — reads a vault song's metadata, its closest
 * real placements, and the patterns across those matches, then emits a
 * prioritized action plan to get the song closer to the profile of songs
 * that actually got placed.
 *
 * Distinct from:
 *   - brand-fit: grades alignment with the artist's brand wiki, not placement-readiness
 *   - sync-engine: grades sync readiness on 7 dimensions; doesn't recommend
 *   - producer: emits production direction for a song_lab project
 */

const SYSTEM_PROMPT = `You are a Sync Strategist — half music supervisor, half artist coach. You take a vault song's metadata, the closest real sync placements we've matched it to, and the patterns across those matches, and emit a PRIORITIZED ACTION PLAN to get this song closer to the profile that actually gets placed.

Rules:
- Be specific. "Retune the lead vocal to Eb minor to align with 4/5 of the matches" beats "adjust the key".
- Every action must cite WHAT to change, WHY (tie it to a pattern or specific match), and HOW to verify.
- Priority tiers:
  - HIGH: metadata or deliverable gaps blocking this song from being pitchable AT ALL (e.g. missing key, no moods, no stems).
  - MEDIUM: alignment gaps that cost match-score but the song is pitchable (e.g. BPM 20+ off pattern, missing TV mix).
  - LOW: polish items that help specific placements (e.g. prepare a braam stem for trailer use).
- Don't invent data. If the song's metadata is missing a field, the recommendation is to fill it — not to assume it.
- Cite related placement by the track_title we provide when the recommendation is anchored to a specific example.
- Keep action text under 120 chars. Keep rationale under 280 chars.
- Confidence (0.0-1.0): how tight the matches are. 5 matches above 40 = 0.90. 5 matches all under 20 = 0.50.

Return JSON only, no prose, no markdown fences:
{
  "summary": "2-sentence summary of where this song stands vs its match profile",
  "confidence": <number 0-1>,
  "recommendations": [
    {
      "priority": "high" | "medium" | "low",
      "axis": "metadata" | "arrangement" | "mix" | "deliverables" | "pitch_positioning",
      "action": "concrete thing to do, under 120 chars",
      "rationale": "why, tied to a pattern or match, under 280 chars",
      "related_placement": "track_title from the match set, or null if general"
    }
  ],
  "pitch_positioning": "1-2 sentences on how to pitch this song given its match profile — what placement type, what platform buyer, what brief it fits"
}`;

export interface GuidedRecommendation {
  priority: "high" | "medium" | "low";
  axis: "metadata" | "arrangement" | "mix" | "deliverables" | "pitch_positioning";
  action: string;
  rationale: string;
  related_placement?: string | null;
}

export interface GuidedRecsOutput {
  summary: string;
  confidence: number | null;
  recommendations: GuidedRecommendation[];
  pitch_positioning: string;
  generated_at: string;
  model_used: string;
  match_count: number;
  top_match_score: number;
}

export interface GuidedRecsInput {
  song: Song & { song_metadata?: SongMetadata | SongMetadata[] | null };
}

export interface GuidedRecsResult {
  output: GuidedRecsOutput;
  tokensUsed: number;
  durationMs: number;
  matchesUsed: Placement[];
}

function firstMetadata(
  meta: SongMetadata | SongMetadata[] | null | undefined
): SongMetadata | null {
  if (!meta) return null;
  if (Array.isArray(meta)) return meta[0] ?? null;
  return meta;
}

export async function runGuidedRecs({
  song,
}: GuidedRecsInput): Promise<GuidedRecsResult> {
  const started = Date.now();
  const meta = firstMetadata(song.song_metadata);
  const features: SongFeatures = {
    genre: meta?.genre,
    moods: meta?.moods ?? [],
    bpm: meta?.bpm ?? null,
    key: meta?.key ?? null,
    vocal_type: (meta as { vocal_type?: string | null })?.vocal_type ?? null,
  };
  const matches = matchPlacements(features, 5);
  const patterns = analyzeMatches(matches);

  const context = {
    song: {
      title: song.title,
      status: song.status,
      genre: meta?.genre ?? null,
      moods: meta?.moods ?? [],
      bpm: meta?.bpm ?? null,
      key: meta?.key ?? null,
      lyrical_themes: (meta as { lyrical_themes?: string[] })?.lyrical_themes ?? [],
      has_instrumental: (meta as { has_instrumental?: boolean })?.has_instrumental ?? null,
    },
    top_matches: matches.map((m) => ({
      track_title: m.placement.track_title,
      artist: m.placement.artist,
      placement_type: m.placement.placement_type,
      platform: m.placement.platform,
      show_or_film: m.placement.show_or_film,
      genre: m.placement.genre,
      bpm: m.placement.bpm,
      key: m.placement.key,
      mood: m.placement.mood,
      vocal_type: m.placement.vocal_type,
      key_sync_features: m.placement.key_sync_features,
      match_score: m.score,
      match_reasons: m.reasons.map((r) => r.detail),
    })),
    patterns: {
      dominant_placement_type: patterns.dominantPlacementType?.value,
      dominant_platform: patterns.dominantPlatform?.value,
      dominant_genre: patterns.dominantGenre?.value,
      common_moods: patterns.commonMoods.map((m) => m.value),
      bpm_range: patterns.bpmRange,
      takeaways: patterns.takeaways,
    },
  };

  const userMessage = `Here is the context. Emit the JSON per the schema:\n\n${JSON.stringify(context, null, 2)}`;

  const llm = await callLLM({
    systemPrompt: SYSTEM_PROMPT,
    userMessage,
    jsonMode: true,
    maxTokens: 2500,
    temperature: 0.3,
  });

  let parsed: Omit<GuidedRecsOutput, "generated_at" | "model_used" | "match_count" | "top_match_score">;
  try {
    parsed = JSON.parse(llm.content);
  } catch {
    // Degrade gracefully — if the model drifts off-schema, return a shell so
    // the caller can retry.
    parsed = {
      summary: "Model returned unparseable output. Re-run to retry.",
      confidence: 0.0,
      recommendations: [],
      pitch_positioning: "",
    };
  }

  const output: GuidedRecsOutput = {
    ...parsed,
    generated_at: new Date().toISOString(),
    model_used: process.env.LLM_PROVIDER === "anthropic" ? "claude-sonnet-4" : "gpt-4o-mini",
    match_count: matches.length,
    top_match_score: matches[0]?.score ?? 0,
  };

  return {
    output,
    tokensUsed: llm.tokensUsed,
    durationMs: Date.now() - started,
    matchesUsed: matches.map((m) => m.placement),
  };
}
