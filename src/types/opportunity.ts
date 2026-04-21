import type { Song } from "./song";

export type OpportunityType =
  | "tv"
  | "film"
  | "commercial"
  | "trailer"
  | "video_game"
  | "web_content"
  | "podcast"
  | "library"
  | "other";

export type OpportunityStage =
  | "discovery"
  | "qualified"
  | "matched"
  | "ready"
  | "submitted"
  | "pending"
  | "won"
  | "lost";

export type MatchStatus = "suggested" | "approved" | "rejected" | "submitted";

export type SubmissionStatus =
  | "submitted"
  | "under_review"
  | "shortlisted"
  | "selected"
  | "rejected"
  | "expired";

export interface SyncBriefDetails {
  format_family:
    | "tv_episode"
    | "film"
    | "ad_30"
    | "ad_60"
    | "ad_15"
    | "trailer"
    | "game"
    | "web_social"
    | "podcast"
    | "library"
    | "other";
  mood_primary: string;
  mood_secondary?: string | null;
  energy_target?: number | null;
  bpm_range?: { min: number; max: number } | null;
  key_preference?: "major" | "minor" | "either" | null;
  vocal_policy?: "allowed" | "instrumental_only" | "tv_mix_ok" | null;
  dialogue_safe_required?: boolean;
  cutdowns_needed?: string[];
  lyric_themes_preferred?: string[];
  lyric_themes_avoid?: string[];
  explicit_allowed?: boolean;
  one_stop_required?: boolean;
  similar_placements?: string[];
  target_libraries?: string[];
  exclusivity_acceptable?: boolean;
  notes?: string;
  confidence?: number;
  reasoning?: string;
  generated_at?: string;
  model_used?: string;
}

export interface PlacementDnaCache {
  format_family: string;
  bpm_band?: { min: number; max: number } | null;
  intro_max_seconds?: number | null;
  impact_point_seconds?: number | null;
  density?: "sparse" | "medium" | "dense" | null;
  arrangement_priorities?: string[];
  common_tags_in_wins?: string[];
  dominant_moods?: string[];
  sample_size: number;
  win_rate_estimate?: number | null;
  confidence?: number;
  reasoning?: string;
  generated_at?: string;
  model_used?: string;
}

export interface Opportunity {
  id: string;
  artist_id: string;
  title: string;
  description: string | null;
  source: string | null;
  source_url: string | null;
  opportunity_type: OpportunityType | null;
  genres_needed: string[];
  moods_needed: string[];
  budget_range: string | null;
  deadline: string | null;
  contact_name: string | null;
  contact_email: string | null;
  company: string | null;
  exclusive: boolean;
  stage: OpportunityStage;
  created_at: string;
  updated_at: string;
  // P2 additions (migration 00011)
  brief_details?: SyncBriefDetails | null;
  brief_structured_at?: string | null;
  placement_dna_cache?: PlacementDnaCache | null;
  placement_dna_cached_at?: string | null;
  opportunity_matches?: OpportunityMatch[];
}

export interface OpportunityMatch {
  id: string;
  opportunity_id: string;
  song_id: string;
  fit_score: number;
  fit_reasons: string[];
  confidence: number | null;
  status: MatchStatus;
  matched_by: "ai" | "manual";
  created_at: string;
  // Nested song — populated by the matches API with full metadata + stems + sync_scores
  // so the pipeline can render readiness per match without extra fetches.
  song?: Partial<Song> & { id: string; title: string };
}

export interface Submission {
  id: string;
  artist_id: string;
  opportunity_id: string | null;
  song_id: string | null;
  submitted_to: string;
  submitted_via: string | null;
  submission_date: string;
  deadline: string | null;
  status: SubmissionStatus;
  fee_amount: number | null;
  notes: string | null;
  follow_up_date: string | null;
  created_at: string;
  updated_at: string;
  opportunity?: Opportunity;
  song?: { id: string; title: string };
}

export const OPPORTUNITY_TYPES: { value: OpportunityType; label: string }[] = [
  { value: "tv", label: "TV" },
  { value: "film", label: "Film" },
  { value: "commercial", label: "Commercial" },
  { value: "trailer", label: "Trailer" },
  { value: "video_game", label: "Video Game" },
  { value: "web_content", label: "Web Content" },
  { value: "podcast", label: "Podcast" },
  { value: "library", label: "Library" },
  { value: "other", label: "Other" },
];

export const PIPELINE_STAGES: { value: OpportunityStage; label: string }[] = [
  { value: "discovery", label: "Discovery" },
  { value: "qualified", label: "Qualified" },
  { value: "matched", label: "Matched" },
  { value: "ready", label: "Ready" },
  { value: "submitted", label: "Submitted" },
  { value: "pending", label: "Pending" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

export const SUBMISSION_STATUSES: { value: SubmissionStatus; label: string }[] = [
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "selected", label: "Selected" },
  { value: "rejected", label: "Rejected" },
  { value: "expired", label: "Expired" },
];
