export interface BusinessSetup {
  id: string;
  artist_id: string;
  phase: number;

  // Phase 1
  artist_name_chosen: boolean;
  genre_defined: boolean;
  goals_defined: boolean;
  email_professional: boolean;
  social_handles_secured: boolean;

  // Phase 2
  llc_status:
    | "not_started"
    | "researching"
    | "in_progress"
    | "completed"
    | "not_needed";
  llc_state: string | null;
  llc_service: string | null;
  ein_obtained: boolean;
  business_bank_account: boolean;
  pro_registered: boolean;
  pro_name: string | null;
  publisher_setup: boolean;
  publisher_name: string | null;
  admin_deal: boolean;
  admin_company: string | null;

  // Phase 3
  daw_chosen: string | null;
  home_studio_budget: string | null;
  home_studio_setup: boolean;
  file_organization_system: boolean;
  naming_convention_set: boolean;
  metadata_template_created: boolean;
  backup_system: boolean;

  // Phase 4
  sync_ready_tracks: number;
  library_accounts: string[];
  distribution_setup: boolean;
  distributor_name: string | null;
  website_live: boolean;
  epk_created: boolean;

  // LLC Agent fields
  career_stage: "beginner" | "developing" | "professional";
  monthly_music_income: number;
  annual_music_income: number;
  revenue_streams: string[];
  release_frequency: "none" | "occasional" | "consistent";
  sync_activity: "none" | "preparing" | "actively_pitching";
  llc_name: string | null;
  llc_name_available: boolean | null;
  llc_filing_cost: number | null;
  llc_annual_cost: number | null;
  llc_recommended_service: string | null;
  llc_readiness_score: number;
  llc_readiness_level: "HIGH" | "MEDIUM" | "LOW";
  llc_decision: "START_LLC_NOW" | "PREPARE_FOR_LLC" | "WAIT";
  llc_explanation: string | null;
  llc_tasks: LLCTaskItem[];
  llc_warnings: string[];
  llc_next_action: LLCTaskItem | null;
  payment_routing_setup: boolean;

  // Progress
  overall_progress: number;
  phase1_progress: number;
  phase2_progress: number;
  phase3_progress: number;
  phase4_progress: number;

  ai_recommendations: AIRecommendation[];
  last_agent_run: string | null;
  created_at: string;
  updated_at: string;
}

export interface LLCTaskItem {
  id: string;
  title: string;
  description: string;
  status: "completed" | "pending" | "not_needed";
  estimated_time: string;
  cost: string;
  order: number;
}

export interface AIRecommendation {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  phase: number;
  estimated_time?: string;
  cost?: "free" | "$" | "$$" | "$$$";
}

export interface SetupPhase {
  number: number;
  title: string;
  description: string;
  progress: number;
  tasks: SetupTask[];
}

export interface SetupTask {
  key: string;
  label: string;
  description: string;
  completed: boolean;
  required: boolean;
  phase: number;
  category: string;
  helpText?: string;
}
