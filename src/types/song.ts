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
  ai_analysis: string | null;
  ai_recommendations: string[];
  scoring_version: number;
  created_at: string;
}
