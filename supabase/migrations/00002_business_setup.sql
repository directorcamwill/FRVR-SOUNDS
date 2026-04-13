CREATE TABLE public.business_setup (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID REFERENCES public.artists ON DELETE CASCADE NOT NULL,
  phase INTEGER DEFAULT 1,

  -- Phase 1: Foundation
  artist_name_chosen BOOLEAN DEFAULT FALSE,
  genre_defined BOOLEAN DEFAULT FALSE,
  goals_defined BOOLEAN DEFAULT FALSE,
  email_professional BOOLEAN DEFAULT FALSE,
  social_handles_secured BOOLEAN DEFAULT FALSE,

  -- Phase 2: Legal + Money
  llc_status TEXT DEFAULT 'not_started' CHECK (llc_status IN ('not_started', 'researching', 'in_progress', 'completed', 'not_needed')),
  llc_state TEXT,
  llc_service TEXT,
  ein_obtained BOOLEAN DEFAULT FALSE,
  business_bank_account BOOLEAN DEFAULT FALSE,
  pro_registered BOOLEAN DEFAULT FALSE,
  pro_name TEXT,
  publisher_setup BOOLEAN DEFAULT FALSE,
  publisher_name TEXT,
  admin_deal BOOLEAN DEFAULT FALSE,
  admin_company TEXT,

  -- Phase 3: Music Infrastructure
  daw_chosen TEXT,
  home_studio_budget TEXT,
  home_studio_setup BOOLEAN DEFAULT FALSE,
  file_organization_system BOOLEAN DEFAULT FALSE,
  naming_convention_set BOOLEAN DEFAULT FALSE,
  metadata_template_created BOOLEAN DEFAULT FALSE,
  backup_system BOOLEAN DEFAULT FALSE,

  -- Phase 4: Growth Ready
  sync_ready_tracks INTEGER DEFAULT 0,
  library_accounts TEXT[] DEFAULT '{}',
  distribution_setup BOOLEAN DEFAULT FALSE,
  distributor_name TEXT,
  website_live BOOLEAN DEFAULT FALSE,
  epk_created BOOLEAN DEFAULT FALSE,

  -- Progress
  overall_progress INTEGER DEFAULT 0,
  phase1_progress INTEGER DEFAULT 0,
  phase2_progress INTEGER DEFAULT 0,
  phase3_progress INTEGER DEFAULT 0,
  phase4_progress INTEGER DEFAULT 0,

  ai_recommendations JSONB DEFAULT '[]',
  last_agent_run TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_business_setup_artist ON public.business_setup(artist_id);

-- RLS
ALTER TABLE public.business_setup ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own business setup" ON public.business_setup
  FOR ALL TO authenticated
  USING (artist_id IN (SELECT id FROM artists WHERE profile_id = auth.uid()))
  WITH CHECK (artist_id IN (SELECT id FROM artists WHERE profile_id = auth.uid()));

-- Updated_at trigger
CREATE TRIGGER update_business_setup_updated_at
  BEFORE UPDATE ON public.business_setup
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
