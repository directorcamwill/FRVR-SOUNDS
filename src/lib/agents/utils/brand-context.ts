import { createAdminClient } from "@/lib/supabase/admin";
import { computeBrandCompleteness } from "../brand-director";
import type { BrandWiki } from "@/types/brand";

/**
 * Shared brand-context fetcher used by every brand-aware agent (Content
 * Director, Producer, Songwriter, Collab, future Social Profile / Single /
 * Album designers). One source of truth for: the artist row, the brand_wiki
 * row, completeness scoring, and hard-gate checking.
 *
 * Any agent that writes brand-consistent output should pull its context via
 * `getBrandContext(artistId)` rather than querying `brand_wiki` directly.
 */

export interface BrandContext {
  artistId: string;
  artistName: string | null;
  wiki: BrandWiki | null;
  completenessPct: number;
  missingCritical: string[];
}

export interface BrandGateResult {
  gated: true;
  reason: "brand_wiki_missing" | "brand_wiki_incomplete";
  completenessPct: number;
  missingCritical: string[];
  message: string;
}

export interface BrandOkResult {
  gated: false;
  context: BrandContext;
}

export async function getBrandContext(
  artistId: string
): Promise<BrandContext> {
  const supabase = createAdminClient();
  const [{ data: artist }, { data: wiki }] = await Promise.all([
    supabase
      .from("artists")
      .select("artist_name")
      .eq("id", artistId)
      .maybeSingle(),
    supabase
      .from("brand_wiki")
      .select("*")
      .eq("artist_id", artistId)
      .maybeSingle(),
  ]);

  const typedWiki = wiki as BrandWiki | null;
  const { pct, missing_critical } = typedWiki
    ? computeBrandCompleteness(typedWiki)
    : { pct: 0, missing_critical: [] as string[] };

  return {
    artistId,
    artistName: artist?.artist_name ?? null,
    wiki: typedWiki,
    completenessPct: pct,
    missingCritical: missing_critical,
  };
}

/**
 * Hard-gate helper. Returns a structured result — the agent/route can return
 * the gated object directly to the client as a 422.
 */
export async function requireBrandContext(
  artistId: string,
  minCompleteness = 60
): Promise<BrandGateResult | BrandOkResult> {
  const ctx = await getBrandContext(artistId);

  if (!ctx.wiki) {
    return {
      gated: true,
      reason: "brand_wiki_missing",
      completenessPct: 0,
      missingCritical: [],
      message:
        "Build your Brand Wiki at /brand before running this agent. It needs niche, tone, and sonic identity to emit on-brand guidance.",
    };
  }

  if (ctx.completenessPct < minCompleteness) {
    return {
      gated: true,
      reason: "brand_wiki_incomplete",
      completenessPct: ctx.completenessPct,
      missingCritical: ctx.missingCritical,
      message: `Brand Wiki is at ${ctx.completenessPct}% — this agent requires at least ${minCompleteness}% before running. Fill the ${ctx.missingCritical.length} critical gap${ctx.missingCritical.length === 1 ? "" : "s"} first.`,
    };
  }

  return { gated: false, context: ctx };
}

/**
 * One-pass summary of the brand wiki for LLM prompts. Keeps agents consistent
 * in how they surface brand info (same keys, same formatting). Empty fields
 * are omitted entirely.
 */
export function brandContextToPrompt(ctx: BrandContext): string {
  const w = ctx.wiki;
  if (!w) return `Artist: ${ctx.artistName ?? "(unnamed)"} (no brand wiki)`;

  const lines: string[] = [
    `Artist: ${ctx.artistName ?? "(unnamed)"}`,
    w.niche ? `Niche: ${w.niche}` : "",
    w.category_lane ? `Lane: ${w.category_lane}` : "",
    w.positioning_statement ? `Positioning: ${w.positioning_statement}` : "",
    w.elevator_pitch ? `Pitch: ${w.elevator_pitch}` : "",
    w.core_pain ? `Core pain resolved: ${w.core_pain}` : "",
    w.transformation_before && w.transformation_after
      ? `Transformation: ${w.transformation_before} → ${w.transformation_after}`
      : "",
    w.key_themes?.length ? `Key themes: ${w.key_themes.join(", ")}` : "",
    w.core_beliefs?.length ? `Core beliefs: ${w.core_beliefs.join(" · ")}` : "",
    w.differentiators?.length
      ? `Differentiators: ${w.differentiators.join(" · ")}`
      : "",
    w.what_not?.length
      ? `What they're NOT: ${w.what_not
          .map((x) => `not ${x.confused_with} (${x.difference})`)
          .join(" · ")}`
      : "",
    w.competitive_contrast?.length
      ? `Comp contrast: ${w.competitive_contrast
          .map((x) => `vs ${x.artist} — ${x.difference}`)
          .join(" · ")}`
      : "",
    w.primary_audience ? `Primary audience: ${w.primary_audience}` : "",
    w.audience_desires?.length
      ? `Audience desires: ${w.audience_desires.join(", ")}`
      : "",
    w.audience_pain_points?.length
      ? `Audience pain: ${w.audience_pain_points.join(", ")}`
      : "",
    w.audience_lifestyle_context?.length
      ? `Audience context: ${w.audience_lifestyle_context.join(" · ")}`
      : "",
    w.audience_identity_goals
      ? `Audience identity goals: ${w.audience_identity_goals}`
      : "",
    w.desired_emotions?.length
      ? `Desired emotions: ${w.desired_emotions.join(", ")}`
      : "",
    w.natural_emotions?.length
      ? `Natural emotions: ${w.natural_emotions.join(", ")}`
      : "",
    w.emotional_tags?.length
      ? `Emotional tags: ${w.emotional_tags.join(", ")}`
      : "",
    w.energy_marker != null || w.intensity_marker != null
      ? `Energy/intensity: ${w.energy_marker ?? "—"}/${w.intensity_marker ?? "—"} (1–10)${w.intensity_notes ? ` — ${w.intensity_notes}` : ""}`
      : "",
    w.tone_descriptors?.length ? `Tone: ${w.tone_descriptors.join(", ")}` : "",
    w.voice_dos?.length ? `Voice DOs: ${w.voice_dos.join(" · ")}` : "",
    w.voice_donts?.length ? `Voice DON'Ts: ${w.voice_donts.join(" · ")}` : "",
    w.core_messaging ? `Core messaging: ${w.core_messaging}` : "",
    w.sonic_genre_primary
      ? `Sonic genre: ${w.sonic_genre_primary}${w.sonic_genre_secondary ? ` / ${w.sonic_genre_secondary}` : ""}`
      : "",
    w.sonic_moods?.length ? `Moods: ${w.sonic_moods.join(", ")}` : "",
    w.sonic_bpm_min && w.sonic_bpm_max
      ? `BPM range: ${w.sonic_bpm_min}–${w.sonic_bpm_max}`
      : "",
    w.sonic_key_preferences?.length
      ? `Preferred keys: ${w.sonic_key_preferences.join(", ")}`
      : "",
    w.sonic_texture_keywords?.length
      ? `Sonic textures: ${w.sonic_texture_keywords.join(", ")}`
      : "",
    w.reference_tracks?.length
      ? `References: ${w.reference_tracks
          .map(
            (r) =>
              `${r.artist} — "${r.title}"${r.why ? ` (${r.why})` : ""}`
          )
          .join(" | ")}`
      : "",
    w.mix_preferences && Object.keys(w.mix_preferences).length
      ? `Mix prefs: ${JSON.stringify(w.mix_preferences)}`
      : "",
    w.sync_format_targets?.length
      ? `Sync targets: ${w.sync_format_targets.join(", ")}`
      : "",
    w.sync_library_targets?.length
      ? `Target libraries: ${w.sync_library_targets.join(", ")}`
      : "",
    w.journey_notes && w.journey_notes.trim()
      ? `Artist's own notes: ${w.journey_notes.slice(0, 600)}`
      : "",
  ];

  return lines.filter(Boolean).join("\n");
}
