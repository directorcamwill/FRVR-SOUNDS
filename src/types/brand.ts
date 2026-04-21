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

export interface BrandWiki {
  artist_id: string;

  // Identity
  niche: string | null;
  elevator_pitch: string | null;
  origin_story: string | null;
  bio_short: string | null;
  bio_medium: string | null;
  bio_long: string | null;

  // Audience
  primary_audience: string | null;
  secondary_audience: string | null;
  audience_pain_points: string[];

  // Tone
  tone_descriptors: string[];
  voice_dos: string[];
  voice_donts: string[];
  core_messaging: string | null;

  // Visual
  color_primary: string | null;
  color_secondary: string | null;
  color_accent: string | null;
  font_heading: string | null;
  font_body: string | null;
  texture_keywords: string[];
  logo_url: string | null;
  icon_url: string | null;
  press_photo_urls: string[];

  // Sonic
  sonic_genre_primary: string | null;
  sonic_genre_secondary: string | null;
  sonic_moods: string[];
  sonic_bpm_min: number | null;
  sonic_bpm_max: number | null;
  sonic_key_preferences: string[];
  sonic_texture_keywords: string[];
  reference_tracks: ReferenceTrack[];

  // Mix prefs
  mix_preferences: MixPreferences;

  // Sync positioning
  sync_format_targets: SyncFormatTarget[];
  sync_library_targets: string[];
  avoid_sync_formats: SyncFormatTarget[];

  // Meta
  completeness_pct: number;
  last_guided_at: string | null;
  created_at: string;
  updated_at: string;
}

export type BrandFocus =
  | "identity"
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
