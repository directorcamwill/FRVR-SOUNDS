import { callLLM } from "./utils/llm";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PlacementDnaCache } from "@/types/opportunity";

/**
 * Placement DNA Agent — given an opportunity (format family + brief), reads
 * the artist's historical submissions + opportunities + sync_scores and emits
 * structural heuristics (BPM band, intro max, density, arrangement priorities)
 * that the matching system and production tooling can use.
 *
 * Writes to opportunities.placement_dna_cache + placement_dna_cached_at.
 */

const SYSTEM_PROMPT = `You are a sync placement strategist. Given an opportunity and the artist's historical placement data, produce format-family heuristics that bias future song selection and production toward what works.

Every number you emit must be defensible from the sample. Small samples = lower confidence, explicitly stated. When no historical wins exist, fall back to industry norms for the format family but flag this in reasoning.

Calibration for confidence (0.0–1.0):
- 0.85+: >= 5 wins + >= 10 submissions, tight clustering on BPM/mood.
- 0.65–0.84: 2-4 wins or scattered outcomes.
- 0.40–0.64: 0-1 wins — using format-family norms.
- Below 0.40: No signal; don't emit strong heuristics.

Return JSON only:
{
  "format_family": "<matching the opportunity>",
  "bpm_band": { "min": <number>, "max": <number> } | null,
  "intro_max_seconds": <number> | null,
  "impact_point_seconds": <number> | null,
  "density": "sparse" | "medium" | "dense" | null,
  "arrangement_priorities": ["<priority 1>", "<priority 2>"],
  "common_tags_in_wins": ["<tag>"],
  "dominant_moods": ["<mood>"],
  "sample_size": <integer>,
  "win_rate_estimate": <0.0-1.0> | null,
  "confidence": <0.0-1.0>,
  "reasoning": "2-3 sentences: what the sample told you, what you fell back to"
}`;

export interface PlacementDnaInput {
  artistId: string;
  opportunityId: string;
  formatFamily?: string | null;
}

export interface PlacementDnaResult {
  dna: PlacementDnaCache;
  tokensUsed: number;
  durationMs: number;
  sampleSize: number;
}

export async function runPlacementDna(
  input: PlacementDnaInput
): Promise<PlacementDnaResult> {
  const startTime = Date.now();
  const supabase = createAdminClient();

  // Pull historical context: this artist's opportunities (with briefs + outcomes),
  // submissions, and per-song sync scores.
  const [{ data: opportunities }, { data: submissions }, { data: scores }] =
    await Promise.all([
      supabase
        .from("opportunities")
        .select(
          "id, title, opportunity_type, stage, genres_needed, moods_needed, exclusive, brief_details"
        )
        .eq("artist_id", input.artistId),
      supabase
        .from("submissions")
        .select(
          "id, opportunity_id, song_id, status, submitted_to, submission_date"
        )
        .eq("artist_id", input.artistId),
      supabase
        .from("sync_scores")
        .select(
          "song_id, overall_score, arrangement_score, production_score, usability_score, market_fit_score, confidence, created_at"
        )
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

  const wonOpportunityIds = new Set(
    (opportunities ?? []).filter((o) => o.stage === "won").map((o) => o.id)
  );
  const winningSubmissions = (submissions ?? []).filter((s) =>
    s.opportunity_id ? wonOpportunityIds.has(s.opportunity_id) : false
  );

  const sampleSize = (submissions ?? []).length;
  const winCount = winningSubmissions.length;
  const winRateEstimate = sampleSize > 0 ? winCount / sampleSize : null;

  const model = "claude-sonnet-4-20250514";
  const response = await callLLM({
    systemPrompt: SYSTEM_PROMPT,
    userMessage: buildUserMessage({
      opportunityId: input.opportunityId,
      formatFamily: input.formatFamily ?? "unknown",
      sampleSize,
      winCount,
      opportunities: opportunities ?? [],
      submissions: submissions ?? [],
      scores: scores ?? [],
    }),
    jsonMode: true,
    model,
    maxTokens: 1500,
    temperature: 0.4,
  });

  const parsed = JSON.parse(response.content);
  const confidence = clampConfidence(parsed.confidence);

  const dna: PlacementDnaCache = {
    format_family: parsed.format_family ?? input.formatFamily ?? "other",
    bpm_band: parsed.bpm_band ?? null,
    intro_max_seconds: parsed.intro_max_seconds ?? null,
    impact_point_seconds: parsed.impact_point_seconds ?? null,
    density: parsed.density ?? null,
    arrangement_priorities: parsed.arrangement_priorities ?? [],
    common_tags_in_wins: parsed.common_tags_in_wins ?? [],
    dominant_moods: parsed.dominant_moods ?? [],
    sample_size: parsed.sample_size ?? sampleSize,
    win_rate_estimate: parsed.win_rate_estimate ?? winRateEstimate ?? null,
    confidence: confidence ?? undefined,
    reasoning: parsed.reasoning ?? "",
    generated_at: new Date().toISOString(),
    model_used: model,
  };

  return {
    dna,
    tokensUsed: response.tokensUsed,
    durationMs: Date.now() - startTime,
    sampleSize,
  };
}

interface UserMessageInputs {
  opportunityId: string;
  formatFamily: string;
  sampleSize: number;
  winCount: number;
  opportunities: Array<Record<string, unknown>>;
  submissions: Array<Record<string, unknown>>;
  scores: Array<Record<string, unknown>>;
}

function buildUserMessage(i: UserMessageInputs): string {
  const lines: string[] = [
    `# TARGET OPPORTUNITY`,
    `Opportunity ID: ${i.opportunityId}`,
    `Format family: ${i.formatFamily}`,
    "",
    `# HISTORICAL SAMPLE`,
    `Total submissions: ${i.sampleSize}`,
    `Won placements: ${i.winCount}`,
    "",
    `## Past opportunities (most recent ${Math.min(15, i.opportunities.length)}):`,
  ];
  for (const o of i.opportunities.slice(0, 15)) {
    const brief =
      (o.brief_details as Record<string, unknown> | null) ?? null;
    const briefSummary = brief
      ? `[brief: ${brief.format_family ?? "?"} · mood=${brief.mood_primary ?? "?"}]`
      : "";
    lines.push(
      `- [${o.stage}] "${o.title}" type=${o.opportunity_type ?? "?"} ${briefSummary}`
    );
  }
  lines.push("", `## Submissions (most recent ${Math.min(15, i.submissions.length)}):`);
  for (const s of i.submissions.slice(0, 15)) {
    lines.push(
      `- status=${s.status} to=${s.submitted_to ?? "?"} song=${s.song_id ?? "?"}`
    );
  }
  lines.push(
    "",
    `## Sync score snapshot (top ${Math.min(10, i.scores.length)} recent):`
  );
  for (const sc of i.scores.slice(0, 10)) {
    lines.push(
      `- song=${sc.song_id} overall=${sc.overall_score} arrangement=${sc.arrangement_score} usability=${sc.usability_score}`
    );
  }
  lines.push(
    "",
    `Produce placement DNA heuristics for the format family '${i.formatFamily}'. Return JSON.`
  );
  return lines.join("\n");
}

function clampConfidence(raw: unknown): number | null {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return null;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}
