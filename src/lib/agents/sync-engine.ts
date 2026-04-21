import { callLLM } from "./utils/llm";
import { SYNC_ENGINE_SYSTEM_PROMPT } from "./utils/prompts";
import { SongMetadata } from "@/types/song";

interface SyncEngineInput {
  title: string;
  metadata: SongMetadata | null;
  stemsCount: number;
  stemTypes: string[];
  hasDuration: boolean;
  durationSeconds: number | null;
}

export async function runSyncEngine(input: SyncEngineInput) {
  const startTime = Date.now();

  const userMessage = buildUserMessage(input);
  const response = await callLLM({
    systemPrompt: SYNC_ENGINE_SYSTEM_PROMPT,
    userMessage,
    jsonMode: true,
    maxTokens: 2000,
    temperature: 0.3,
  });

  // Strip markdown code fences if present (Claude wraps JSON in ```json ... ```)
  let content = response.content.trim();
  if (content.startsWith("```")) {
    content = content.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }
  const parsed = JSON.parse(content);

  // Calculate weighted overall score
  const overall = Math.round(
    parsed.arrangement_score * 0.25 +
      parsed.production_score * 0.15 +
      parsed.mix_score * 0.15 +
      parsed.usability_score * 0.2 +
      parsed.market_fit_score * 0.15 +
      parsed.brand_safety_score * 0.05 +
      parsed.deliverables_score * 0.05
  );

  const confidence = clampConfidence(parsed.confidence);

  return {
    overall_score: overall,
    arrangement_score: parsed.arrangement_score,
    production_score: parsed.production_score,
    mix_score: parsed.mix_score,
    usability_score: parsed.usability_score,
    market_fit_score: parsed.market_fit_score,
    brand_safety_score: parsed.brand_safety_score,
    deliverables_score: parsed.deliverables_score,
    confidence,
    ai_analysis: parsed.analysis,
    ai_recommendations: parsed.recommendations || [],
    strengths: parsed.strengths || [],
    placement_likelihood: parsed.placement_likelihood,
    best_fit_placements: parsed.best_fit_placements || [],
    tokensUsed: response.tokensUsed,
    durationMs: Date.now() - startTime,
  };
}

function clampConfidence(raw: unknown): number | null {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return null;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function buildUserMessage(input: SyncEngineInput): string {
  const meta = input.metadata;
  let msg = `## SONG: "${input.title}"\n\n`;

  if (meta) {
    if (meta.genre)
      msg += `Genre: ${meta.genre}${meta.sub_genre ? ` / ${meta.sub_genre}` : ""}\n`;
    if (meta.moods?.length) msg += `Moods: ${meta.moods.join(", ")}\n`;
    if (meta.bpm) msg += `BPM: ${meta.bpm}\n`;
    if (meta.key) msg += `Key: ${meta.key}\n`;
    if (meta.tempo_feel) msg += `Tempo Feel: ${meta.tempo_feel}\n`;
    if (meta.energy_level) msg += `Energy Level: ${meta.energy_level}/10\n`;
    if (meta.has_vocals !== undefined)
      msg += `Vocals: ${meta.has_vocals ? "Yes" : "No (Instrumental)"}${meta.vocal_gender ? ` (${meta.vocal_gender})` : ""}\n`;
    if (meta.language) msg += `Language: ${meta.language}\n`;
    msg += `Explicit Content: ${meta.explicit_content ? "Yes" : "No"}\n`;
    msg += `One-Stop Licensing: ${meta.one_stop ? "Yes" : "No"}\n`;
    msg += `Instrumental Available: ${meta.instrumental_available ? "Yes" : "No"}\n`;
    if (meta.tags?.length) msg += `Tags: ${meta.tags.join(", ")}\n`;
    if (meta.similar_artists?.length)
      msg += `Similar Artists: ${meta.similar_artists.join(", ")}\n`;
    if (meta.description) msg += `Description: ${meta.description}\n`;
    if (meta.lyrics_themes?.length)
      msg += `Lyrical Themes: ${meta.lyrics_themes.join(", ")}\n`;
    if (meta.lyrics) msg += `\nLyrics:\n${meta.lyrics.substring(0, 500)}\n`;
  } else {
    msg += `(No metadata provided yet)\n`;
  }

  msg += `\n## DELIVERABLES:\n`;
  msg += `Stems Available: ${input.stemsCount > 0 ? `Yes (${input.stemsCount} stems: ${input.stemTypes.join(", ")})` : "No"}\n`;
  if (input.durationSeconds)
    msg += `Duration: ${Math.floor(input.durationSeconds / 60)}:${String(Math.floor(input.durationSeconds % 60)).padStart(2, "0")}\n`;

  msg += `\nEvaluate this song for sync licensing readiness. Return JSON.`;
  return msg;
}
