-- 00019_library_system.sql
-- FRVR Sounds Music Library — intake (artist submissions → review) + outreach
-- (catalog songs → pitches to supervisors / studios → CRM-lite tracking).
-- Fully idempotent.

CREATE TABLE IF NOT EXISTS library_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Submitter contact (public form — anyone can submit)
  submitter_name TEXT NOT NULL,
  submitter_email TEXT NOT NULL,
  submitter_phone TEXT,
  -- Song info
  artist_name TEXT NOT NULL,
  song_title TEXT NOT NULL,
  song_file_path TEXT,
  proposed_deal_type TEXT NOT NULL CHECK (proposed_deal_type IN ('rev_share', 'upfront_fee')),
  -- Metadata
  genre TEXT,
  sub_genre TEXT,
  moods TEXT[],
  bpm INT,
  key TEXT,
  vocal_type TEXT,
  lyrics TEXT,
  sync_history TEXT,
  is_one_stop BOOLEAN DEFAULT false,
  instrumental_available BOOLEAN DEFAULT false,
  -- Legal attestation
  attestation_owns_rights BOOLEAN NOT NULL DEFAULT false,
  -- Artist notes
  notes_from_artist TEXT,
  -- Review state
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'accepted', 'rejected', 'signed')),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  review_notes TEXT,
  rejection_reason TEXT,
  -- Cached auto-scores
  auto_brand_fit_score INT,
  auto_sync_readiness INT
);

CREATE TABLE IF NOT EXISTS library_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES library_submissions(id) ON DELETE SET NULL,
  song_title TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  deal_type TEXT NOT NULL CHECK (deal_type IN ('rev_share', 'upfront_fee')),
  artist_split_pct INT NOT NULL,
  frvr_split_pct INT NOT NULL,
  upfront_fee_cents INT,
  upfront_fee_status TEXT CHECK (upfront_fee_status IN ('pending', 'paid', 'failed', 'refunded', 'not_applicable')),
  term_months INT NOT NULL,
  starts_at DATE,
  ends_at DATE,
  exclusive_sync BOOLEAN NOT NULL DEFAULT false,
  exclusive_master BOOLEAN NOT NULL DEFAULT false,
  exclusive_publishing BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending_signature' CHECK (status IN ('pending_signature', 'active', 'expired', 'terminated')),
  signed_at TIMESTAMPTZ,
  song_file_path TEXT,
  -- Denormalized metadata so pitches don't need to hit submissions on every render
  genre TEXT,
  sub_genre TEXT,
  moods TEXT[],
  bpm INT,
  key TEXT,
  vocal_type TEXT,
  is_one_stop BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pitch_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN (
    'music_supervisor',
    'music_department',
    'studio',
    'ad_agency',
    'network',
    'library_broker',
    'game_studio',
    'other'
  )),
  company TEXT,
  contact_path TEXT,
  notes TEXT,
  added_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS library_pitches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES library_deals(id) ON DELETE CASCADE,
  -- Target source: 'supervisor_directory' (static SUPERVISORS const) or 'pitch_target' (pitch_targets table)
  target_kind TEXT NOT NULL CHECK (target_kind IN ('supervisor_directory', 'pitch_target')),
  target_ref TEXT NOT NULL,
  -- Snapshot of target name at the time of pitch (so history survives directory edits)
  target_name TEXT NOT NULL,
  target_company TEXT,
  -- Hybrid brief: link is always live, PDF is printable from the link route
  pitch_slug TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'opened', 'interested', 'passed', 'placed')),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  opened_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  view_count INT NOT NULL DEFAULT 0,
  notes TEXT,
  follow_up_date DATE,
  sent_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_library_submissions_status ON library_submissions(status);
CREATE INDEX IF NOT EXISTS idx_library_deals_status ON library_deals(status);
CREATE INDEX IF NOT EXISTS idx_library_pitches_deal ON library_pitches(deal_id);
CREATE INDEX IF NOT EXISTS idx_library_pitches_slug ON library_pitches(pitch_slug);
CREATE INDEX IF NOT EXISTS idx_library_pitches_status ON library_pitches(status);

-- RLS
ALTER TABLE library_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE pitch_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_pitches ENABLE ROW LEVEL SECURITY;

-- library_submissions: public can INSERT (the submission form); only authenticated can SELECT/UPDATE
DROP POLICY IF EXISTS "public_insert_submissions" ON library_submissions;
CREATE POLICY "public_insert_submissions" ON library_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "auth_select_submissions" ON library_submissions;
CREATE POLICY "auth_select_submissions" ON library_submissions
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "auth_update_submissions" ON library_submissions;
CREATE POLICY "auth_update_submissions" ON library_submissions
  FOR UPDATE
  TO authenticated
  USING (true);

-- library_deals: authenticated only
DROP POLICY IF EXISTS "auth_all_deals" ON library_deals;
CREATE POLICY "auth_all_deals" ON library_deals
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- pitch_targets: authenticated only
DROP POLICY IF EXISTS "auth_all_pitch_targets" ON pitch_targets;
CREATE POLICY "auth_all_pitch_targets" ON pitch_targets
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- library_pitches: authenticated can manage; anon can SELECT a single pitch by slug (brief page)
DROP POLICY IF EXISTS "auth_all_pitches" ON library_pitches;
CREATE POLICY "auth_all_pitches" ON library_pitches
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_pitch_by_slug" ON library_pitches;
CREATE POLICY "anon_select_pitch_by_slug" ON library_pitches
  FOR SELECT
  TO anon
  USING (true);

-- updated_at trigger for deals
CREATE OR REPLACE FUNCTION library_deals_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS library_deals_touch ON library_deals;
CREATE TRIGGER library_deals_touch
  BEFORE UPDATE ON library_deals
  FOR EACH ROW
  EXECUTE FUNCTION library_deals_touch_updated_at();

COMMENT ON TABLE library_submissions IS 'Intake: external artists submit songs for FRVR Sounds library representation.';
COMMENT ON TABLE library_deals IS 'Accepted submissions with deal terms — the actual catalog FRVR represents.';
COMMENT ON TABLE pitch_targets IS 'Operator-curated list of non-supervisor pitch targets (studios, music departments, ad agencies).';
COMMENT ON TABLE library_pitches IS 'CRM layer: each row is a song pitched to a target, with status + hybrid brief link tracking.';
