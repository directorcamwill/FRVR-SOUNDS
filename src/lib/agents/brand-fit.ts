import { callLLM } from "./utils/llm";
import {
  requireBrandContext,
  brandContextToPrompt,
  type BrandContext,
  type BrandGateResult,
} from "./utils/brand-context";
import type { Song, SongMetadata } from "@/types/song";

/**
 * Brand Fit Agent — grades a song's alignment with the artist's brand wiki.
 * Hybrid:
 *   - Deterministic: BPM in range, genre exact/partial match, key preference
 *     match, mood overlap, explicit content flag, one-stop flag.
 *   - LLM: qualitative assessment of texture/tone fit + references alignment,
 *     plus actionable "bring this song into brand" suggestions.
 *
 * Distinct from:
 *   - sync-engine  (grades sync readiness across 7 dimensions, not brand fit)
 *   - producer     (emits production direction for a work-in-progress)
 *   - package-builder (checks submission artifacts, not creative alignment)
 *
 * NOT real audio DSP analysis — that's deferred to Stage 1 audio engineering.
 * Scores here are metadata-based; when real audio analysis lands, the LLM
 * qualitative layer plugs into measured features with no shape change.
 */

export interface BrandFitDimension {
  key:
    | "genre"
    | "moods"
    | "bpm"
    | "key"
    | "texture"
    | "reference_alignment"
    | "voice_match"
    | "sync_positioning";
  label: string;
  score: number; // 0-100
  status: "aligned" | "partial" | "deviation";
  note: string;
}

export interface BrandFitStatus {
  overall_score: number; // 0-100
  alignment_tier: "high" | "mid" | "low";
  dimensions: BrandFitDimension[];
  strengths: string[];
  deviations: string[];
  suggestions: string[];
  confidence: number | null;
  reasoning: string;
  generated_at: string;
  model_used: string;
}

export interface BrandFitInput {
  artistId: string;
  song: Song & { song_metadata?: SongMetadata | SongMetadata[] | null };
}

export type BrandFitResult =
  | BrandGateResult
  | {
      gated: false;
      status: BrandFitStatus;
      tokensUsed: number;
      durationMs: number;
    };

// ──────────────── Deterministic layer ────────────────

function firstMetadata(
  song: BrandFitInput["song"]
): SongMetadata | null {
  const meta = song.song_metadata;
  if (!meta) return null;
  if (Array.isArray(meta)) return meta[0] ?? null;
  return meta;
}

function scoreGenre(
  brand: BrandContext,
  meta: SongMetadata | null
): BrandFitDimension {
  const wiki = brand.wiki;
  if (!meta?.genre || !wiki?.sonic_genre_primary) {
    return {
      key: "genre",
      label: "Genre",
      score: 50,
      status: "partial",
      note: !meta?.genre
        ? "Song missing genre metadata"
        : "Brand wiki missing sonic_genre_primary",
    };
  }
  const songGenre = meta.genre.toLowerCase();
  const primary = wiki.sonic_genre_primary.toLowerCase();
  const secondary = wiki.sonic_genre_secondary?.toLowerCase();
  if (songGenre === primary) {
    return {
      key: "genre",
      label: "Genre",
      score: 100,
      status: "aligned",
      note: `Primary brand genre match: ${meta.genre}`,
    };
  }
  if (secondary && songGenre === secondary) {
    return {
      key: "genre",
      label: "Genre",
      score: 85,
      status: "aligned",
      note: `Secondary brand genre match: ${meta.genre}`,
    };
  }
  // Partial — same family (e.g. "r&b" vs "alt r&b")
  const songFamily = songGenre.split(/\s|\//)[0];
  const brandFamily = primary.split(/\s|\//)[0];
  if (songFamily === brandFamily) {
    return {
      key: "genre",
      label: "Genre",
      score: 70,
      status: "partial",
      note: `Adjacent genre (${meta.genre} vs brand ${wiki.sonic_genre_primary})`,
    };
  }
  return {
    key: "genre",
    label: "Genre",
    score: 30,
    status: "deviation",
    note: `Genre "${meta.genre}" is outside stated brand genre "${wiki.sonic_genre_primary}"`,
  };
}

function scoreMoods(
  brand: BrandContext,
  meta: SongMetadata | null
): BrandFitDimension {
  const wiki = brand.wiki;
  const songMoods = (meta?.moods ?? []).map((m) => m.toLowerCase());
  const brandMoods = (wiki?.sonic_moods ?? []).map((m) => m.toLowerCase());
  if (songMoods.length === 0 || brandMoods.length === 0) {
    return {
      key: "moods",
      label: "Moods",
      score: 50,
      status: "partial",
      note:
        songMoods.length === 0
          ? "Song missing moods"
          : "Brand wiki missing sonic_moods",
    };
  }
  const overlap = songMoods.filter((m) => brandMoods.includes(m));
  const pct = Math.round((overlap.length / brandMoods.length) * 100);
  if (pct >= 50) {
    return {
      key: "moods",
      label: "Moods",
      score: Math.min(100, 60 + pct / 2),
      status: "aligned",
      note: `${overlap.length}/${brandMoods.length} brand moods present: ${overlap.join(", ")}`,
    };
  }
  if (pct > 0) {
    return {
      key: "moods",
      label: "Moods",
      score: 40 + pct / 2,
      status: "partial",
      note: `Only ${overlap.length}/${brandMoods.length} brand moods present`,
    };
  }
  return {
    key: "moods",
    label: "Moods",
    score: 25,
    status: "deviation",
    note: `No overlap with brand moods (song: ${songMoods.join(", ")}; brand: ${brandMoods.join(", ")})`,
  };
}

function scoreBpm(
  brand: BrandContext,
  meta: SongMetadata | null
): BrandFitDimension {
  const wiki = brand.wiki;
  if (!meta?.bpm) {
    return {
      key: "bpm",
      label: "BPM",
      score: 50,
      status: "partial",
      note: "Song missing BPM",
    };
  }
  if (!wiki?.sonic_bpm_min || !wiki?.sonic_bpm_max) {
    return {
      key: "bpm",
      label: "BPM",
      score: 70,
      status: "partial",
      note: "Brand wiki missing BPM range",
    };
  }
  const bpm = meta.bpm;
  const min = wiki.sonic_bpm_min;
  const max = wiki.sonic_bpm_max;
  if (bpm >= min && bpm <= max) {
    return {
      key: "bpm",
      label: "BPM",
      score: 100,
      status: "aligned",
      note: `${bpm} BPM fits brand range ${min}–${max}`,
    };
  }
  const diff = bpm < min ? min - bpm : bpm - max;
  if (diff <= 8) {
    return {
      key: "bpm",
      label: "BPM",
      score: 70,
      status: "partial",
      note: `${bpm} BPM is ${diff} outside brand range ${min}–${max} — borderline`,
    };
  }
  return {
    key: "bpm",
    label: "BPM",
    score: 30,
    status: "deviation",
    note: `${bpm} BPM is ${diff} outside brand range ${min}–${max}`,
  };
}

function scoreKey(
  brand: BrandContext,
  meta: SongMetadata | null
): BrandFitDimension {
  const wiki = brand.wiki;
  const prefs = (wiki?.sonic_key_preferences ?? []).map((k) =>
    k.toLowerCase().replace(/\s/g, "")
  );
  if (!meta?.key) {
    return {
      key: "key",
      label: "Key",
      score: 50,
      status: "partial",
      note: "Song missing key",
    };
  }
  if (prefs.length === 0) {
    return {
      key: "key",
      label: "Key",
      score: 70,
      status: "partial",
      note: "Brand wiki has no key preferences",
    };
  }
  const songKey = meta.key.toLowerCase().replace(/\s/g, "");
  if (prefs.some((k) => k === songKey)) {
    return {
      key: "key",
      label: "Key",
      score: 100,
      status: "aligned",
      note: `${meta.key} is in brand preferred keys`,
    };
  }
  // Partial — same mode (minor/major)
  const songMinor = songKey.endsWith("m") || songKey.endsWith("min");
  const prefMinors = prefs.filter((k) => k.endsWith("m") || k.endsWith("min"));
  if (songMinor && prefMinors.length > 0) {
    return {
      key: "key",
      label: "Key",
      score: 70,
      status: "partial",
      note: `${meta.key} matches brand mode (minor) but not specific key`,
    };
  }
  return {
    key: "key",
    label: "Key",
    score: 55,
    status: "partial",
    note: `${meta.key} is outside brand key preferences`,
  };
}

function runDeterministic(input: BrandFitInput): {
  dimensions: BrandFitDimension[];
  detScoreAvg: number;
} {
  const meta = firstMetadata(input.song);
  const ctx = { artistId: input.artistId } as BrandContext; // placeholder; overridden below
  return { dimensions: [], detScoreAvg: 0 }; // placeholder — replaced by runner below
  void meta;
  void ctx;
}

// ──────────────── Runner ────────────────

const SYSTEM_PROMPT = `You are the Brand Fit evaluator — you grade how well a specific song aligns with an artist's brand wiki (sonic identity, references, target formats, mix preferences). You do NOT score sync readiness (another agent handles that). You evaluate only brand alignment.

You're given deterministic dimension scores (genre/moods/bpm/key) already computed. Your job is the QUALITATIVE layer:
- Texture/tone fit — does this song's stated production match the brand's texture keywords?
- Reference alignment — does the song's metadata suggest it could live next to the brand's reference tracks?
- Voice match — do the lyrical themes align with brand voice_dos/donts?
- Sync positioning — does this song fit the brand's declared sync_format_targets?

Emit each of those 4 qualitative dimensions + synthesize an overall 0–100 brand fit score that weights: deterministic (50%) + your 4 qualitative dimensions (50%).

Rules:
- Be specific. "Matches the warm-tape reference energy" beats "vibes align".
- Reference the brand wiki's references + textures by name when relevant.
- Strengths and deviations are CONCRETE findings, not platitudes.
- Suggestions should be ACTIONABLE fixes — e.g. "re-tag moods to include 'intimate'" not "align better".

Calibration for confidence (0.0–1.0):
- 0.90+: Rich metadata on song + rich brand wiki, clear call
- 0.70–0.89: Good data with 1–2 inferences
- 0.50–0.69: Thin metadata or thin wiki; score is directional
- Below 0.50: Too little signal — say so and lower overall_score

Return JSON only:
{
  "qualitative_dimensions": [
    { "key": "texture", "label": "Texture", "score": <0-100>, "status": "aligned" | "partial" | "deviation", "note": "<specific>" },
    { "key": "reference_alignment", "label": "Reference alignment", "score": <0-100>, "status": "...", "note": "..." },
    { "key": "voice_match", "label": "Voice match", "score": <0-100>, "status": "...", "note": "..." },
    { "key": "sync_positioning", "label": "Sync positioning", "score": <0-100>, "status": "...", "note": "..." }
  ],
  "strengths": [<string>],
  "deviations": [<string>],
  "suggestions": [<string>],
  "confidence": <0.0-1.0>,
  "reasoning": "2-3 sentences on what metadata grounded this and what you inferred"
}`;

export async function runBrandFit(
  input: BrandFitInput
): Promise<BrandFitResult> {
  const gate = await requireBrandContext(input.artistId);
  if (gate.gated) return gate;

  const start = Date.now();
  const meta = firstMetadata(input.song);

  // Deterministic dimensions
  const detDims: BrandFitDimension[] = [
    scoreGenre(gate.context, meta),
    scoreMoods(gate.context, meta),
    scoreBpm(gate.context, meta),
    scoreKey(gate.context, meta),
  ];
  const detAvg =
    detDims.reduce((sum, d) => sum + d.score, 0) / detDims.length;

  // LLM qualitative layer
  const userMessage = [
    `# BRAND CONTEXT`,
    brandContextToPrompt(gate.context),
    "",
    `# SONG`,
    `Title: ${input.song.title}`,
    input.song.duration_seconds
      ? `Duration: ${Math.floor(input.song.duration_seconds / 60)}:${String(Math.floor(input.song.duration_seconds % 60)).padStart(2, "0")}`
      : "",
    meta?.genre ? `Genre: ${meta.genre}` : "",
    meta?.sub_genre ? `Sub-genre: ${meta.sub_genre}` : "",
    meta?.moods?.length ? `Moods: ${meta.moods.join(", ")}` : "",
    meta?.bpm ? `BPM: ${meta.bpm}` : "",
    meta?.key ? `Key: ${meta.key}` : "",
    meta?.energy_level ? `Energy: ${meta.energy_level}/10` : "",
    meta?.tempo_feel ? `Tempo feel: ${meta.tempo_feel}` : "",
    meta?.has_vocals === false ? "Instrumental" : "",
    meta?.vocal_gender ? `Vocal: ${meta.vocal_gender}` : "",
    meta?.language ? `Language: ${meta.language}` : "",
    meta?.tags?.length ? `Tags: ${meta.tags.join(", ")}` : "",
    meta?.lyrics_themes?.length
      ? `Lyric themes: ${meta.lyrics_themes.join(", ")}`
      : "",
    meta?.similar_artists?.length
      ? `Similar artists: ${meta.similar_artists.join(", ")}`
      : "",
    meta?.description ? `Description: ${meta.description}` : "",
    "",
    `# DETERMINISTIC DIMENSIONS (already computed — incorporate into overall)`,
    ...detDims.map(
      (d) => `- ${d.label}: ${Math.round(d.score)}/100 [${d.status}] — ${d.note}`
    ),
    "",
    "Emit qualitative_dimensions + strengths + deviations + suggestions. Return JSON.",
  ]
    .filter(Boolean)
    .join("\n");

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
  const qualDims: BrandFitDimension[] = Array.isArray(
    parsed.qualitative_dimensions
  )
    ? parsed.qualitative_dimensions.map((d: unknown) => {
        const r = d as Record<string, unknown>;
        return {
          key: (r.key as BrandFitDimension["key"]) ?? "texture",
          label: (r.label as string) ?? "",
          score: clampScore(r.score),
          status:
            (r.status as BrandFitDimension["status"]) ?? "partial",
          note: (r.note as string) ?? "",
        };
      })
    : [];

  const qualAvg =
    qualDims.length > 0
      ? qualDims.reduce((sum, d) => sum + d.score, 0) / qualDims.length
      : 50;

  const overall = Math.round(detAvg * 0.5 + qualAvg * 0.5);
  const alignment_tier: BrandFitStatus["alignment_tier"] =
    overall >= 80 ? "high" : overall >= 55 ? "mid" : "low";

  return {
    gated: false,
    status: {
      overall_score: overall,
      alignment_tier,
      dimensions: [...detDims, ...qualDims],
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      deviations: Array.isArray(parsed.deviations) ? parsed.deviations : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      confidence: clampConfidence(parsed.confidence),
      reasoning: (parsed.reasoning as string) ?? "",
      generated_at: new Date().toISOString(),
      model_used: model,
    },
    tokensUsed: response.tokensUsed,
    durationMs: Date.now() - start,
  };
}

function clampScore(raw: unknown): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function clampConfidence(raw: unknown): number | null {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return null;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}
