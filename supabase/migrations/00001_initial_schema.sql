-- ============================================================
-- FRVR SOUNDS - Initial Database Schema
-- Migration: 00001_initial_schema.sql
-- ============================================================

-- ============================================================
-- 1. TABLES
-- ============================================================

-- profiles
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  artist_name TEXT,
  avatar_url TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- artists
CREATE TABLE public.artists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  artist_name TEXT NOT NULL,
  genres TEXT[] DEFAULT '{}',
  moods TEXT[] DEFAULT '{}',
  pro_affiliation TEXT,
  ipi_number TEXT,
  publisher_name TEXT,
  has_stems BOOLEAN DEFAULT FALSE,
  has_pro_registration BOOLEAN DEFAULT FALSE,
  has_business_entity BOOLEAN DEFAULT FALSE,
  social_links JSONB DEFAULT '{}',
  goals TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- songs
CREATE TABLE public.songs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID REFERENCES public.artists ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  file_url TEXT,
  file_name TEXT,
  file_size_bytes BIGINT,
  duration_seconds NUMERIC,
  waveform_data JSONB,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- song_metadata
CREATE TABLE public.song_metadata (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  song_id UUID REFERENCES public.songs ON DELETE CASCADE UNIQUE NOT NULL,
  genre TEXT,
  sub_genre TEXT,
  moods TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  bpm INTEGER,
  key TEXT,
  tempo_feel TEXT,
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 10),
  lyrics TEXT,
  lyrics_themes TEXT[] DEFAULT '{}',
  has_vocals BOOLEAN DEFAULT TRUE,
  vocal_gender TEXT,
  language TEXT DEFAULT 'English',
  explicit_content BOOLEAN DEFAULT FALSE,
  one_stop BOOLEAN DEFAULT FALSE,
  instrumental_available BOOLEAN DEFAULT FALSE,
  similar_artists TEXT[] DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- stems
CREATE TABLE public.stems (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  song_id UUID REFERENCES public.songs ON DELETE CASCADE NOT NULL,
  stem_type TEXT NOT NULL CHECK (stem_type IN ('vocals', 'drums', 'bass', 'guitar', 'keys', 'strings', 'synth', 'fx', 'full_instrumental', 'other')),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size_bytes BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- sync_scores
CREATE TABLE public.sync_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  song_id UUID REFERENCES public.songs ON DELETE CASCADE NOT NULL,
  overall_score INTEGER CHECK (overall_score BETWEEN 0 AND 100),
  arrangement_score INTEGER CHECK (arrangement_score BETWEEN 0 AND 100),
  production_score INTEGER CHECK (production_score BETWEEN 0 AND 100),
  mix_score INTEGER CHECK (mix_score BETWEEN 0 AND 100),
  usability_score INTEGER CHECK (usability_score BETWEEN 0 AND 100),
  market_fit_score INTEGER CHECK (market_fit_score BETWEEN 0 AND 100),
  brand_safety_score INTEGER CHECK (brand_safety_score BETWEEN 0 AND 100),
  deliverables_score INTEGER CHECK (deliverables_score BETWEEN 0 AND 100),
  ai_analysis TEXT,
  ai_recommendations TEXT[] DEFAULT '{}',
  scoring_version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- opportunities
CREATE TABLE public.opportunities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID REFERENCES public.artists ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  source TEXT,
  source_url TEXT,
  opportunity_type TEXT CHECK (opportunity_type IN ('tv', 'film', 'commercial', 'trailer', 'video_game', 'web_content', 'podcast', 'library', 'other')),
  genres_needed TEXT[] DEFAULT '{}',
  moods_needed TEXT[] DEFAULT '{}',
  budget_range TEXT,
  deadline TIMESTAMPTZ,
  contact_name TEXT,
  contact_email TEXT,
  company TEXT,
  exclusive BOOLEAN DEFAULT FALSE,
  stage TEXT DEFAULT 'discovery' CHECK (stage IN ('discovery', 'qualified', 'matched', 'ready', 'submitted', 'pending', 'won', 'lost')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- opportunity_matches
CREATE TABLE public.opportunity_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id UUID REFERENCES public.opportunities ON DELETE CASCADE NOT NULL,
  song_id UUID REFERENCES public.songs ON DELETE CASCADE NOT NULL,
  fit_score INTEGER CHECK (fit_score BETWEEN 0 AND 100),
  fit_reasons TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'suggested' CHECK (status IN ('suggested', 'approved', 'rejected', 'submitted')),
  matched_by TEXT DEFAULT 'ai' CHECK (matched_by IN ('ai', 'manual')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(opportunity_id, song_id)
);

-- submissions
CREATE TABLE public.submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID REFERENCES public.artists ON DELETE CASCADE NOT NULL,
  opportunity_id UUID REFERENCES public.opportunities ON DELETE SET NULL,
  song_id UUID REFERENCES public.songs ON DELETE SET NULL,
  submitted_to TEXT NOT NULL,
  submitted_via TEXT,
  submission_date TIMESTAMPTZ DEFAULT NOW(),
  deadline TIMESTAMPTZ,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'shortlisted', 'selected', 'rejected', 'expired')),
  fee_amount NUMERIC,
  notes TEXT,
  follow_up_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- agent_logs
CREATE TABLE public.agent_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID REFERENCES public.artists ON DELETE CASCADE,
  agent_type TEXT NOT NULL,
  action TEXT NOT NULL,
  summary TEXT,
  details JSONB DEFAULT '{}',
  status TEXT DEFAULT 'completed',
  tokens_used INTEGER,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- alerts
CREATE TABLE public.alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID REFERENCES public.artists ON DELETE CASCADE NOT NULL,
  agent_type TEXT,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'urgent', 'critical')),
  title TEXT NOT NULL,
  message TEXT,
  action_url TEXT,
  read BOOLEAN DEFAULT FALSE,
  dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- health_scores
CREATE TABLE public.health_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID REFERENCES public.artists ON DELETE CASCADE NOT NULL,
  overall_score INTEGER CHECK (overall_score BETWEEN 0 AND 100),
  catalog_completeness INTEGER CHECK (catalog_completeness BETWEEN 0 AND 100),
  metadata_quality INTEGER CHECK (metadata_quality BETWEEN 0 AND 100),
  deliverables_readiness INTEGER CHECK (deliverables_readiness BETWEEN 0 AND 100),
  submission_activity INTEGER CHECK (submission_activity BETWEEN 0 AND 100),
  pipeline_health INTEGER CHECK (pipeline_health BETWEEN 0 AND 100),
  missing_items JSONB DEFAULT '[]',
  recommendations TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- intelligence_briefs
CREATE TABLE public.intelligence_briefs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID REFERENCES public.artists ON DELETE CASCADE NOT NULL,
  brief_type TEXT DEFAULT 'daily' CHECK (brief_type IN ('daily', 'weekly', 'alert')),
  title TEXT NOT NULL,
  summary TEXT,
  sections JSONB DEFAULT '[]',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- content_moments
CREATE TABLE public.content_moments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID REFERENCES public.artists ON DELETE CASCADE NOT NULL,
  trigger_event TEXT,
  content_type TEXT CHECK (content_type IN ('social_post', 'email', 'press_release', 'story', 'reel')),
  title TEXT,
  content TEXT,
  platform_suggestions TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'suggested' CHECK (status IN ('suggested', 'used', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. TRIGGER FUNCTION: updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_artists
  BEFORE UPDATE ON public.artists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_songs
  BEFORE UPDATE ON public.songs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_song_metadata
  BEFORE UPDATE ON public.song_metadata
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_opportunities
  BEFORE UPDATE ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_submissions
  BEFORE UPDATE ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 3. PROFILE AUTO-CREATION TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.song_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intelligence_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_moments ENABLE ROW LEVEL SECURITY;

-- profiles: users can read/update their own
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- artists: users can CRUD where profile_id = auth.uid()
CREATE POLICY "Users can view own artists"
  ON public.artists FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Users can create own artists"
  ON public.artists FOR INSERT
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own artists"
  ON public.artists FOR UPDATE
  USING (profile_id = auth.uid());

CREATE POLICY "Users can delete own artists"
  ON public.artists FOR DELETE
  USING (profile_id = auth.uid());

-- Helper: artist ownership check
-- songs: artist-owned
CREATE POLICY "Users can view own songs"
  ON public.songs FOR SELECT
  USING (artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid()));

CREATE POLICY "Users can create own songs"
  ON public.songs FOR INSERT
  WITH CHECK (artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid()));

CREATE POLICY "Users can update own songs"
  ON public.songs FOR UPDATE
  USING (artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid()));

CREATE POLICY "Users can delete own songs"
  ON public.songs FOR DELETE
  USING (artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid()));

-- song_metadata: song child table
CREATE POLICY "Users can view own song_metadata"
  ON public.song_metadata FOR SELECT
  USING (song_id IN (SELECT id FROM public.songs WHERE artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid())));

CREATE POLICY "Users can create own song_metadata"
  ON public.song_metadata FOR INSERT
  WITH CHECK (song_id IN (SELECT id FROM public.songs WHERE artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid())));

CREATE POLICY "Users can update own song_metadata"
  ON public.song_metadata FOR UPDATE
  USING (song_id IN (SELECT id FROM public.songs WHERE artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid())));

CREATE POLICY "Users can delete own song_metadata"
  ON public.song_metadata FOR DELETE
  USING (song_id IN (SELECT id FROM public.songs WHERE artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid())));

-- stems: song child table
CREATE POLICY "Users can view own stems"
  ON public.stems FOR SELECT
  USING (song_id IN (SELECT id FROM public.songs WHERE artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid())));

CREATE POLICY "Users can create own stems"
  ON public.stems FOR INSERT
  WITH CHECK (song_id IN (SELECT id FROM public.songs WHERE artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid())));

CREATE POLICY "Users can update own stems"
  ON public.stems FOR UPDATE
  USING (song_id IN (SELECT id FROM public.songs WHERE artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid())));

CREATE POLICY "Users can delete own stems"
  ON public.stems FOR DELETE
  USING (song_id IN (SELECT id FROM public.songs WHERE artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid())));

-- sync_scores: song child table
CREATE POLICY "Users can view own sync_scores"
  ON public.sync_scores FOR SELECT
  USING (song_id IN (SELECT id FROM public.songs WHERE artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid())));

CREATE POLICY "Users can create own sync_scores"
  ON public.sync_scores FOR INSERT
  WITH CHECK (song_id IN (SELECT id FROM public.songs WHERE artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid())));

CREATE POLICY "Users can update own sync_scores"
  ON public.sync_scores FOR UPDATE
  USING (song_id IN (SELECT id FROM public.songs WHERE artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid())));

CREATE POLICY "Users can delete own sync_scores"
  ON public.sync_scores FOR DELETE
  USING (song_id IN (SELECT id FROM public.songs WHERE artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid())));

-- opportunities: artist-owned
CREATE POLICY "Users can view own opportunities"
  ON public.opportunities FOR SELECT
  USING (artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid()));

CREATE POLICY "Users can create own opportunities"
  ON public.opportunities FOR INSERT
  WITH CHECK (artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid()));

CREATE POLICY "Users can update own opportunities"
  ON public.opportunities FOR UPDATE
  USING (artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid()));

CREATE POLICY "Users can delete own opportunities"
  ON public.opportunities FOR DELETE
  USING (artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid()));

-- opportunity_matches: accessible via opportunity or song ownership
CREATE POLICY "Users can view own opportunity_matches"
  ON public.opportunity_matches FOR SELECT
  USING (
    opportunity_id IN (SELECT id FROM public.opportunities WHERE artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid()))
    OR song_id IN (SELECT id FROM public.songs WHERE artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid()))
  );

CREATE POLICY "Users can create own opportunity_matches"
  ON public.opportunity_matches FOR INSERT
  WITH CHECK (
    opportunity_id IN (SELECT id FROM public.opportunities WHERE artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid()))
  );

CREATE POLICY "Users can update own opportunity_matches"
  ON public.opportunity_matches FOR UPDATE
  USING (
    opportunity_id IN (SELECT id FROM public.opportunities WHERE artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid()))
  );

CREATE POLICY "Users can delete own opportunity_matches"
  ON public.opportunity_matches FOR DELETE
  USING (
    opportunity_id IN (SELECT id FROM public.opportunities WHERE artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid()))
  );

-- submissions: artist-owned
CREATE POLICY "Users can view own submissions"
  ON public.submissions FOR SELECT
  USING (artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid()));

CREATE POLICY "Users can create own submissions"
  ON public.submissions FOR INSERT
  WITH CHECK (artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid()));

CREATE POLICY "Users can update own submissions"
  ON public.submissions FOR UPDATE
  USING (artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid()));

CREATE POLICY "Users can delete own submissions"
  ON public.submissions FOR DELETE
  USING (artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid()));

-- agent_logs: artist-owned
CREATE POLICY "Users can view own agent_logs"
  ON public.agent_logs FOR SELECT
  USING (artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid()));

CREATE POLICY "Users can create own agent_logs"
  ON public.agent_logs FOR INSERT
  WITH CHECK (artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid()));

-- alerts: artist-owned
CREATE POLICY "Users can view own alerts"
  ON public.alerts FOR SELECT
  USING (artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid()));

CREATE POLICY "Users can create own alerts"
  ON public.alerts FOR INSERT
  WITH CHECK (artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid()));

CREATE POLICY "Users can update own alerts"
  ON public.alerts FOR UPDATE
  USING (artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid()));

-- health_scores: artist-owned
CREATE POLICY "Users can view own health_scores"
  ON public.health_scores FOR SELECT
  USING (artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid()));

CREATE POLICY "Users can create own health_scores"
  ON public.health_scores FOR INSERT
  WITH CHECK (artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid()));

-- intelligence_briefs: artist-owned
CREATE POLICY "Users can view own intelligence_briefs"
  ON public.intelligence_briefs FOR SELECT
  USING (artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid()));

CREATE POLICY "Users can create own intelligence_briefs"
  ON public.intelligence_briefs FOR INSERT
  WITH CHECK (artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid()));

CREATE POLICY "Users can update own intelligence_briefs"
  ON public.intelligence_briefs FOR UPDATE
  USING (artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid()));

-- content_moments: artist-owned
CREATE POLICY "Users can view own content_moments"
  ON public.content_moments FOR SELECT
  USING (artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid()));

CREATE POLICY "Users can create own content_moments"
  ON public.content_moments FOR INSERT
  WITH CHECK (artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid()));

CREATE POLICY "Users can update own content_moments"
  ON public.content_moments FOR UPDATE
  USING (artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid()));

-- ============================================================
-- 5. INDEXES
-- ============================================================

CREATE INDEX idx_artists_profile_id ON public.artists(profile_id);
CREATE INDEX idx_songs_artist_id ON public.songs(artist_id);
CREATE INDEX idx_song_metadata_song_id ON public.song_metadata(song_id);
CREATE INDEX idx_stems_song_id ON public.stems(song_id);
CREATE INDEX idx_sync_scores_song_id ON public.sync_scores(song_id);
CREATE INDEX idx_opportunities_artist_id ON public.opportunities(artist_id);
CREATE INDEX idx_opportunity_matches_opportunity_id ON public.opportunity_matches(opportunity_id);
CREATE INDEX idx_opportunity_matches_song_id ON public.opportunity_matches(song_id);
CREATE INDEX idx_submissions_artist_id ON public.submissions(artist_id);
CREATE INDEX idx_agent_logs_artist_id ON public.agent_logs(artist_id);
CREATE INDEX idx_alerts_artist_id_read ON public.alerts(artist_id, read);
CREATE INDEX idx_health_scores_artist_id ON public.health_scores(artist_id);
CREATE INDEX idx_intelligence_briefs_artist_id ON public.intelligence_briefs(artist_id);
CREATE INDEX idx_content_moments_artist_id ON public.content_moments(artist_id);

-- ============================================================
-- 6. STORAGE BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('audio-files', 'audio-files', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('stems', 'stems', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage policies: audio-files
CREATE POLICY "Authenticated users can upload audio files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'audio-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own audio files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'audio-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own audio files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'audio-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own audio files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'audio-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Storage policies: stems
CREATE POLICY "Authenticated users can upload stems"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'stems' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own stems"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'stems' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own stems"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'stems' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own stems"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'stems' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Storage policies: avatars (public read, authenticated write)
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own avatars"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own avatars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
