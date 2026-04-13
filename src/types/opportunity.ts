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
  opportunity_matches?: OpportunityMatch[];
}

export interface OpportunityMatch {
  id: string;
  opportunity_id: string;
  song_id: string;
  fit_score: number;
  fit_reasons: string[];
  status: MatchStatus;
  matched_by: "ai" | "manual";
  created_at: string;
  song?: { id: string; title: string; sync_scores?: { overall_score: number }[] };
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
