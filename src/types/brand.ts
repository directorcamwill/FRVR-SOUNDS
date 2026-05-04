// Artist Brand Wiki — the identity layer every growth agent reads from.
// Mirrors the `brand_wiki` table shape from migration 00013.

export interface ReferenceTrack {
  artist: string;
  title: string;
  spotify_url?: string | null;
  why?: string | null;
}

export interface MixPreferences {
  lufs_target?: number | null;
  true_peak_target?: number | null;
  stereo_width?: "narrow" | "balanced" | "wide" | null;
  vocal_character?: string | null;
  compression_style?: "light" | "medium" | "aggressive" | null;
}

export type SyncFormatTarget =
  | "tv_episode"
  | "film"
  | "ad_30"
  | "ad_60"
  | "ad_15"
  | "trailer"
  | "game"
  | "web_social"
  | "podcast"
  | "library";

// Brand Journey modules (migration 00025 V1, 00030 V2 adds "engine").
// Artists progress through these in the Brand tab; each module writes to a
// slice of brand_wiki.
export type BrandModuleId =
  | "identity"
  | "emotional"
  | "positioning"
  | "audience"
  | "visual"
  | "sonic"
  | "routes"
  | "engine";

export type RevenuePath =
  | "sync"
  | "streaming"
  | "direct_fan"
  | "publishing"
  | "live"
  | "production_for_hire";

export interface NicheCompetitor {
  name: string;
  url: string;
  dominant_move: string;
  weak_spot: string;
}

export interface ContentPillar {
  id: string;
  name: string;
  angle: string;
  sample_format?: string | null;
}

export interface ContentFormat {
  id: string;
  name: string;
  structure: string;
  time_to_produce_min?: number | null;
  pillar_id?: string | null;
}

export interface PlatformStrategy {
  primary?: string | null;
  secondary?: string[];
  format_to_platform?: Record<string, string[]>;
}

export interface WeeklyCadence {
  slots_per_platform?: Record<string, number>;
  batch_day?: string | null;
  ship_days?: string[];
}

export interface HookTemplate {
  id: string;
  text: string;
  pillar_id?: string | null;
  emotion?: string | null;
}

export interface ConversionStage {
  stage: "stranger" | "listener" | "follower" | "subscriber" | "buyer";
  cta: string;
}

export interface OfferLadder {
  offer_100?: { price?: number | null; format: string; converts_from?: string | null } | null;
  offer_1k?: { price?: number | null; format: string; converts_from?: string | null } | null;
  offer_10k?: { price?: number | null; format: string; converts_from?: string | null } | null;
}

export interface ContentRevenueMapEntry {
  pillar_id: string;
  revenue_path: RevenuePath;
  cta: string;
  ladder_tier: "100" | "1k" | "10k";
}

export interface ConsistencyPlan {
  mvp_plan?: string | null;
  batch_day?: string | null;
  batch_checklist?: string[];
  max_hours_per_week?: number | null;
}

export interface ContentFitScore {
  identity_match: number;
  emotional_accuracy: number;
  audience_relevance: number;
  platform_fit: number;
  total: number;
  flags?: string[];
  suggestions?: Array<{ dimension: string; suggestion: string }>;
}

export interface WhatNotItem {
  confused_with: string;
  difference: string;
}

export interface CompetitiveContrastItem {
  artist: string;
  difference: string;
}

export interface BrandWiki {
  artist_id: string;

  // ─── Identity ───
  niche: string | null;
  elevator_pitch: string | null;
  origin_story: string | null;
  bio_short: string | null;
  bio_medium: string | null;
  bio_long: string | null;
  // Added by 00025 — Identity module deep layer
  core_pain: string | null;
  transformation_before: string | null;
  transformation_after: string | null;
  core_beliefs: string[];
  key_themes: string[];

  // ─── Audience ───
  primary_audience: string | null;
  secondary_audience: string | null;
  audience_pain_points: string[];
  // Added by 00025
  audience_desires: string[];
  audience_lifestyle_context: string[];
  audience_identity_goals: string | null;

  // ─── Tone ───
  tone_descriptors: string[];
  voice_dos: string[];
  voice_donts: string[];
  core_messaging: string | null;

  // ─── Emotional Signature (00025) ───
  desired_emotions: string[];
  natural_emotions: string[];
  emotional_tags: string[];
  energy_marker: number | null;
  intensity_marker: number | null;
  intensity_notes: string | null;

  // ─── Positioning (00025) ───
  positioning_statement: string | null;
  differentiators: string[];
  category_lane: string | null;
  what_not: WhatNotItem[];
  competitive_contrast: CompetitiveContrastItem[];

  // ─── Visual ───
  color_primary: string | null;
  color_secondary: string | null;
  color_accent: string | null;
  font_heading: string | null;
  font_body: string | null;
  texture_keywords: string[];
  logo_url: string | null;
  icon_url: string | null;
  press_photo_urls: string[];

  // ─── Sonic ───
  sonic_genre_primary: string | null;
  sonic_genre_secondary: string | null;
  sonic_moods: string[];
  sonic_bpm_min: number | null;
  sonic_bpm_max: number | null;
  sonic_key_preferences: string[];
  sonic_texture_keywords: string[];
  reference_tracks: ReferenceTrack[];

  // ─── Mix prefs ───
  mix_preferences: MixPreferences;

  // ─── Sync positioning ───
  sync_format_targets: SyncFormatTarget[];
  sync_library_targets: string[];
  avoid_sync_formats: SyncFormatTarget[];

  // ─── Journey state (00025) ───
  current_module_id: BrandModuleId | null;
  current_step_id: string | null;
  module_locked_at: Record<string, string | null>;
  module_completeness: Record<string, number>;

  // ─── Collective journey notes (00026) ───
  // Freeform running scratchpad attached to the whole Brand Journey —
  // thoughts that don't fit inside a single question.
  journey_notes: string | null;

  // ─── Activation milestone (00027) ───
  // Set once, the first time all 7 modules cross 80%. Used to gate the
  // celebratory toast + unlock the 3D Constellation view.
  journey_activated_at: string | null;

  // ─── V2 — Identity addition (00030) ───
  public_truth: string | null;

  // ─── V2 — Niche Domination Layer (00030) ───
  niche_micro_statement: string | null;
  niche_competitors: NicheCompetitor[];
  niche_gap: string | null;
  niche_ownable_territory: string | null;

  // ─── V2 — Routes → Revenue (00030) ───
  revenue_primary_path: RevenuePath | null;
  revenue_secondary_paths: RevenuePath[];
  revenue_offer_100: string | null;
  revenue_offer_1k: string | null;
  revenue_offer_10k: string | null;

  // ─── V2 — Content Engine, Module 8 (00030) ───
  content_pillars: ContentPillar[];
  content_formats: ContentFormat[];
  platform_strategy: PlatformStrategy;
  weekly_cadence: WeeklyCadence;
  // Flat fields written by the engine.cadence multi_field (see 00032).
  weekly_cadence_primary_count: number | null;
  weekly_cadence_batch_day: string | null;
  weekly_cadence_ship_days: string | null;
  hook_library: HookTemplate[];
  conversion_path: ConversionStage[];

  // ─── V2 — Cross-module artifacts (00030) ───
  offer_ladder: OfferLadder;
  content_revenue_map: ContentRevenueMapEntry[];
  consistency_plan: ConsistencyPlan;

  // ─── V2 — Per-module generated outputs (00030) ───
  // Hooks, scripts, templates produced by each module's Output Layer.
  module_outputs: Record<string, unknown>;

  // ─── V2 — Broadcast tier audience segmentation (00030) ───
  audience_models: Array<Record<string, unknown>>;

  // ─── Meta ───
  completeness_pct: number;
  last_guided_at: string | null;
  created_at: string;
  updated_at: string;
}

export type BrandFocus =
  | "identity"
  | "emotional"
  | "positioning"
  | "audience"
  | "tone"
  | "visual"
  | "sonic"
  | "sync_positioning";

export interface BrandGuidance {
  completeness_pct: number;
  missing_critical: string[];
  missing_polish: string[];
  next_question: string;
  next_question_choices?: string[];
  suggested_edits: Array<{
    field: string;
    current: string | null;
    suggestion: string;
    reasoning: string;
  }>;
  bio_variants?: {
    short: string;
    medium: string;
    long: string;
  };
  reasoning: string;
  confidence: number | null;
}

// Keys that MUST be filled before the hard-gated agents (Content Director,
// Outreach, Content+Sync Loop) will run. Surfaced in `missing_critical`.
export const BRAND_CRITICAL_KEYS: Array<keyof BrandWiki> = [
  "niche",
  "elevator_pitch",
  "primary_audience",
  "tone_descriptors",
  "core_messaging",
  "sonic_genre_primary",
  "sonic_moods",
  "sync_format_targets",
];

// Additional keys that raise the polish score but don't block downstream agents.
export const BRAND_POLISH_KEYS: Array<keyof BrandWiki> = [
  "origin_story",
  "bio_short",
  "bio_medium",
  "bio_long",
  "secondary_audience",
  "audience_pain_points",
  "voice_dos",
  "voice_donts",
  "color_primary",
  "texture_keywords",
  "reference_tracks",
  "sync_library_targets",
];
