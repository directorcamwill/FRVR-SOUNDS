-- =============================================
-- FRVR SOUNDS — Financial Operating System
-- =============================================

-- SPLITS + OWNERSHIP
CREATE TABLE public.song_splits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  song_id UUID REFERENCES public.songs ON DELETE CASCADE NOT NULL,
  total_percentage NUMERIC DEFAULT 100 CHECK (total_percentage = 100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.split_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  split_id UUID REFERENCES public.song_splits ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('songwriter', 'producer', 'artist', 'featured', 'publisher', 'other')),
  writer_share NUMERIC DEFAULT 0 CHECK (writer_share >= 0 AND writer_share <= 100),
  publisher_share NUMERIC DEFAULT 0 CHECK (publisher_share >= 0 AND publisher_share <= 100),
  total_share NUMERIC GENERATED ALWAYS AS (writer_share + publisher_share) STORED,
  pro_affiliation TEXT,
  ipi_number TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CONTRACTS
CREATE TABLE public.contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID REFERENCES public.artists ON DELETE CASCADE NOT NULL,
  song_id UUID REFERENCES public.songs ON DELETE SET NULL,
  contract_type TEXT NOT NULL CHECK (contract_type IN ('collaboration', 'producer', 'sync_license', 'distribution', 'publishing', 'management', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'signed', 'expired', 'terminated')),
  start_date DATE,
  end_date DATE,
  terms JSONB DEFAULT '{}',
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.contract_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID REFERENCES public.contracts ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  email TEXT,
  signed BOOLEAN DEFAULT FALSE,
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- REGISTRATIONS
CREATE TABLE public.song_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  song_id UUID REFERENCES public.songs ON DELETE CASCADE NOT NULL,
  registration_type TEXT NOT NULL CHECK (registration_type IN ('pro', 'mlc', 'soundexchange', 'publishing_admin', 'copyright', 'isrc', 'other')),
  platform TEXT,
  status TEXT DEFAULT 'missing' CHECK (status IN ('missing', 'pending', 'complete')),
  external_id TEXT,
  notes TEXT,
  last_checked TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- REVENUE SYSTEM
CREATE TABLE public.revenue_streams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID REFERENCES public.artists ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('streaming', 'sync', 'pro_royalties', 'publishing', 'brand_deal', 'touring', 'merch', 'other')),
  platform TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.revenue_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id UUID REFERENCES public.revenue_streams ON DELETE CASCADE NOT NULL,
  song_id UUID REFERENCES public.songs ON DELETE SET NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  currency TEXT DEFAULT 'USD',
  source TEXT,
  period_start DATE,
  period_end DATE,
  received_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- REVENUE GOALS + CAMPAIGNS
CREATE TABLE public.revenue_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID REFERENCES public.artists ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  goal_amount NUMERIC NOT NULL CHECK (goal_amount > 0),
  current_amount NUMERIC DEFAULT 0,
  target_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'achieved', 'missed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- EXTERNAL ACCOUNTS HUB
CREATE TABLE public.external_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID REFERENCES public.artists ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('distribution', 'pro', 'publishing', 'sync_library', 'streaming', 'social', 'financial', 'other')),
  account_email TEXT,
  account_id TEXT,
  account_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'missing', 'setup_needed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DEALS
CREATE TABLE public.deals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID REFERENCES public.artists ON DELETE CASCADE NOT NULL,
  song_id UUID REFERENCES public.songs ON DELETE SET NULL,
  deal_type TEXT NOT NULL CHECK (deal_type IN ('exclusive', 'non_exclusive', 'sync_placement', 'brand_deal', 'other')),
  partner TEXT NOT NULL,
  description TEXT,
  fee_amount NUMERIC,
  terms JSONB DEFAULT '{}',
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'completed', 'expired', 'terminated')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_song_splits_song ON public.song_splits(song_id);
CREATE INDEX idx_split_participants_split ON public.split_participants(split_id);
CREATE INDEX idx_contracts_artist ON public.contracts(artist_id);
CREATE INDEX idx_contracts_song ON public.contracts(song_id);
CREATE INDEX idx_contract_participants_contract ON public.contract_participants(contract_id);
CREATE INDEX idx_song_registrations_song ON public.song_registrations(song_id);
CREATE INDEX idx_revenue_streams_artist ON public.revenue_streams(artist_id);
CREATE INDEX idx_revenue_entries_stream ON public.revenue_entries(stream_id);
CREATE INDEX idx_revenue_entries_song ON public.revenue_entries(song_id);
CREATE INDEX idx_revenue_entries_date ON public.revenue_entries(received_date);
CREATE INDEX idx_revenue_goals_artist ON public.revenue_goals(artist_id);
CREATE INDEX idx_external_accounts_artist ON public.external_accounts(artist_id);
CREATE INDEX idx_deals_artist ON public.deals(artist_id);
CREATE INDEX idx_deals_song ON public.deals(song_id);

-- RLS
ALTER TABLE public.song_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.split_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.song_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- RLS Policies (artist-owned through song or direct)
CREATE POLICY "Users manage own song_splits" ON public.song_splits FOR ALL TO authenticated
  USING (song_id IN (SELECT id FROM songs WHERE artist_id IN (SELECT id FROM artists WHERE profile_id = auth.uid())))
  WITH CHECK (song_id IN (SELECT id FROM songs WHERE artist_id IN (SELECT id FROM artists WHERE profile_id = auth.uid())));

CREATE POLICY "Users manage own split_participants" ON public.split_participants FOR ALL TO authenticated
  USING (split_id IN (SELECT id FROM song_splits WHERE song_id IN (SELECT id FROM songs WHERE artist_id IN (SELECT id FROM artists WHERE profile_id = auth.uid()))))
  WITH CHECK (split_id IN (SELECT id FROM song_splits WHERE song_id IN (SELECT id FROM songs WHERE artist_id IN (SELECT id FROM artists WHERE profile_id = auth.uid()))));

CREATE POLICY "Users manage own contracts" ON public.contracts FOR ALL TO authenticated
  USING (artist_id IN (SELECT id FROM artists WHERE profile_id = auth.uid()))
  WITH CHECK (artist_id IN (SELECT id FROM artists WHERE profile_id = auth.uid()));

CREATE POLICY "Users manage own contract_participants" ON public.contract_participants FOR ALL TO authenticated
  USING (contract_id IN (SELECT id FROM contracts WHERE artist_id IN (SELECT id FROM artists WHERE profile_id = auth.uid())))
  WITH CHECK (contract_id IN (SELECT id FROM contracts WHERE artist_id IN (SELECT id FROM artists WHERE profile_id = auth.uid())));

CREATE POLICY "Users manage own song_registrations" ON public.song_registrations FOR ALL TO authenticated
  USING (song_id IN (SELECT id FROM songs WHERE artist_id IN (SELECT id FROM artists WHERE profile_id = auth.uid())))
  WITH CHECK (song_id IN (SELECT id FROM songs WHERE artist_id IN (SELECT id FROM artists WHERE profile_id = auth.uid())));

CREATE POLICY "Users manage own revenue_streams" ON public.revenue_streams FOR ALL TO authenticated
  USING (artist_id IN (SELECT id FROM artists WHERE profile_id = auth.uid()))
  WITH CHECK (artist_id IN (SELECT id FROM artists WHERE profile_id = auth.uid()));

CREATE POLICY "Users manage own revenue_entries" ON public.revenue_entries FOR ALL TO authenticated
  USING (stream_id IN (SELECT id FROM revenue_streams WHERE artist_id IN (SELECT id FROM artists WHERE profile_id = auth.uid())))
  WITH CHECK (stream_id IN (SELECT id FROM revenue_streams WHERE artist_id IN (SELECT id FROM artists WHERE profile_id = auth.uid())));

CREATE POLICY "Users manage own revenue_goals" ON public.revenue_goals FOR ALL TO authenticated
  USING (artist_id IN (SELECT id FROM artists WHERE profile_id = auth.uid()))
  WITH CHECK (artist_id IN (SELECT id FROM artists WHERE profile_id = auth.uid()));

CREATE POLICY "Users manage own external_accounts" ON public.external_accounts FOR ALL TO authenticated
  USING (artist_id IN (SELECT id FROM artists WHERE profile_id = auth.uid()))
  WITH CHECK (artist_id IN (SELECT id FROM artists WHERE profile_id = auth.uid()));

CREATE POLICY "Users manage own deals" ON public.deals FOR ALL TO authenticated
  USING (artist_id IN (SELECT id FROM artists WHERE profile_id = auth.uid()))
  WITH CHECK (artist_id IN (SELECT id FROM artists WHERE profile_id = auth.uid()));

-- Updated_at triggers
CREATE TRIGGER update_song_splits_updated_at BEFORE UPDATE ON public.song_splits FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_song_registrations_updated_at BEFORE UPDATE ON public.song_registrations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_revenue_goals_updated_at BEFORE UPDATE ON public.revenue_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_external_accounts_updated_at BEFORE UPDATE ON public.external_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
