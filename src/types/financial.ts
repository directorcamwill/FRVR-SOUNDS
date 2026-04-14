// =============================================
// FRVR SOUNDS — Financial Operating System Types
// =============================================

// SPLITS + OWNERSHIP
export interface SongSplit {
  id: string;
  song_id: string;
  total_percentage: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  split_participants?: SplitParticipant[];
  songs?: { title: string; status: string } | null;
}

export interface SplitParticipant {
  id: string;
  split_id: string;
  name: string;
  role: "songwriter" | "producer" | "artist" | "featured" | "publisher" | "other";
  writer_share: number;
  publisher_share: number;
  total_share: number;
  pro_affiliation: string | null;
  ipi_number: string | null;
  email: string | null;
  created_at: string;
}

// CONTRACTS
export interface Contract {
  id: string;
  artist_id: string;
  song_id: string | null;
  contract_type: "collaboration" | "producer" | "sync_license" | "distribution" | "publishing" | "management" | "other";
  title: string;
  description: string | null;
  status: "draft" | "pending" | "signed" | "expired" | "terminated";
  start_date: string | null;
  end_date: string | null;
  terms: Record<string, unknown>;
  file_url: string | null;
  created_at: string;
  updated_at: string;
  contract_participants?: ContractParticipant[];
  songs?: { title: string } | null;
}

export interface ContractParticipant {
  id: string;
  contract_id: string;
  name: string;
  role: string;
  email: string | null;
  signed: boolean;
  signed_at: string | null;
  created_at: string;
}

// REGISTRATIONS
export type RegistrationType = "pro" | "mlc" | "soundexchange" | "publishing_admin" | "copyright" | "isrc" | "other";
export type RegistrationStatus = "missing" | "pending" | "complete";

export interface SongRegistration {
  id: string;
  song_id: string;
  registration_type: RegistrationType;
  platform: string | null;
  status: RegistrationStatus;
  external_id: string | null;
  notes: string | null;
  last_checked: string;
  created_at: string;
  updated_at: string;
  songs?: { title: string; status: string } | null;
}

// REVENUE
export type RevenueType = "streaming" | "sync" | "pro_royalties" | "publishing" | "brand_deal" | "touring" | "merch" | "other";

export interface RevenueStream {
  id: string;
  artist_id: string;
  type: RevenueType;
  platform: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface RevenueEntry {
  id: string;
  stream_id: string;
  song_id: string | null;
  amount: number;
  currency: string;
  source: string | null;
  period_start: string | null;
  period_end: string | null;
  received_date: string;
  notes: string | null;
  created_at: string;
  revenue_streams?: RevenueStream | null;
  songs?: { title: string } | null;
}

export interface RevenueGoal {
  id: string;
  artist_id: string;
  title: string;
  goal_amount: number;
  current_amount: number;
  target_date: string | null;
  status: "active" | "achieved" | "missed" | "cancelled";
  created_at: string;
  updated_at: string;
}

// EXTERNAL ACCOUNTS
export type AccountCategory = "distribution" | "pro" | "publishing" | "sync_library" | "streaming" | "social" | "financial" | "other";
export type AccountStatus = "active" | "inactive" | "missing" | "setup_needed";

export interface ExternalAccount {
  id: string;
  artist_id: string;
  platform: string;
  category: AccountCategory;
  account_email: string | null;
  account_id: string | null;
  account_url: string | null;
  status: AccountStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// DEALS
export type DealType = "exclusive" | "non_exclusive" | "sync_placement" | "brand_deal" | "other";
export type DealStatus = "active" | "pending" | "completed" | "expired" | "terminated";

export interface Deal {
  id: string;
  artist_id: string;
  song_id: string | null;
  deal_type: DealType;
  partner: string;
  description: string | null;
  fee_amount: number | null;
  terms: Record<string, unknown>;
  start_date: string | null;
  end_date: string | null;
  status: DealStatus;
  created_at: string;
  updated_at: string;
  songs?: { title: string } | null;
}

// ROYALTY SCANNER
export interface RoyaltyScanResult {
  total_songs: number;
  fully_registered: number;
  missing_count: number;
  missing_details: {
    song_id: string;
    song_title: string;
    missing_types: RegistrationType[];
  }[];
}

// REVENUE SUMMARY
export interface RevenueSummary {
  total_income: number;
  this_month: number;
  last_month: number;
  by_type: { type: RevenueType; total: number }[];
  monthly: { month: string; total: number }[];
}
