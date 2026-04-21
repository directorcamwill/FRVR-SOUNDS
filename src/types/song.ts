export interface Song {
  id: string;
  artist_id: string;
  title: string;
  file_url: string | null;
  file_name: string | null;
  file_size_bytes: number | null;
  duration_seconds: number | null;
  status: "draft" | "active" | "archived";
  created_at: string;
  updated_at: string;
  song_metadata?: SongMetadata | null;
  sync_scores?: SyncScore[];
  stems?: Stem[];
  // P1 capstone (migration 00012) — cached package readiness
  package_status?: PackageStatusSummary | null;
  package_checked_at?: string | null;
  // Sprint D (migration 00016) — cached brand fit grade
  brand_fit_status?: BrandFitStatusSummary | null;
  brand_fit_checked_at?: string | null;
}

export interface BrandFitDimensionSummary {
  key: string;
  label: string;
  score: number;
  status: "aligned" | "partial" | "deviation";
  note: string;
}

export interface BrandFitStatusSummary {
  overall_score: number;
  alignment_tier: "high" | "mid" | "low";
  dimensions: BrandFitDimensionSummary[];
  strengths: string[];
  deviations: string[];
  suggestions: string[];
  confidence: number | null;
  reasoning: string;
  generated_at: string;
  model_used: string;
}

// Mirror of PackageStatus from src/lib/agents/package-builder.ts.
// Duplicated here (not imported) so client components don't bring the agent
// module into the client bundle.
export interface PackageStatusSummary {
  ready: boolean;
  completeness_pct: number;
  blockers: Array<{
    type:
      | "metadata"
      | "sync_metadata"
      | "splits"
      | "registrations"
      | "artifacts"
      | "sync_score";
    severity: "high" | "medium" | "low";
    message: string;
    action_url: string;
  }>;
  checklist: Array<{ key: string; label: string; done: boolean }>;
  one_sheet_markdown: string;
  generated_at: string;
}

export interface SongMetadata {
  id: string;
  song_id: string;
  genre: string | null;
  sub_genre: string | null;
  moods: string[];
  tags: string[];
  bpm: number | null;
  key: string | null;
  tempo_feel: string | null;
  energy_level: number | null;
  lyrics: string | null;
  lyrics_themes: string[];
  has_vocals: boolean;
  vocal_gender: string | null;
  language: string;
  explicit_content: boolean;
  one_stop: boolean;
  instrumental_available: boolean;
  similar_artists: string[];
  description: string | null;
  // Sync Readiness fields (migration 00010)
  scene_tags?: string[];
  dialogue_safe_score?: number | null;
  cutdown_points?: number[];
  loop_points?: number[];
  tv_mix_available?: boolean;
}

export interface Stem {
  id: string;
  song_id: string;
  stem_type: string;
  file_url: string;
  file_name: string;
  file_size_bytes: number | null;
  created_at: string;
}

export interface SyncScore {
  id: string;
  song_id: string;
  overall_score: number;
  arrangement_score: number;
  production_score: number;
  mix_score: number;
  usability_score: number;
  market_fit_score: number;
  brand_safety_score: number;
  deliverables_score: number;
  confidence: number | null;
  ai_analysis: string | null;
  ai_recommendations: string[];
  scoring_version: number;
  created_at: string;
}
