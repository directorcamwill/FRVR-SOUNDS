-- Song Lab Projects
CREATE TABLE public.song_lab_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID REFERENCES public.artists ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled Project',
  status TEXT DEFAULT 'idea' CHECK (status IN ('idea', 'writing', 'producing', 'recording', 'mixing', 'mastering', 'complete')),
  bpm INTEGER,
  key TEXT,
  genre TEXT,
  mood TEXT,
  lyrics TEXT,
  notes TEXT,
  structure TEXT,
  reference_tracks TEXT[] DEFAULT '{}',
  checklist JSONB DEFAULT '[]',
  song_id UUID REFERENCES public.songs ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_song_lab_artist ON public.song_lab_projects(artist_id);
ALTER TABLE public.song_lab_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own song_lab" ON public.song_lab_projects FOR ALL TO authenticated
  USING (artist_id IN (SELECT id FROM artists WHERE profile_id = auth.uid()))
  WITH CHECK (artist_id IN (SELECT id FROM artists WHERE profile_id = auth.uid()));
CREATE TRIGGER update_song_lab_updated_at BEFORE UPDATE ON public.song_lab_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- AI Assistant Conversations
CREATE TABLE public.ai_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID REFERENCES public.artists ON DELETE CASCADE NOT NULL,
  context_page TEXT,
  messages JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_conversations_artist ON public.ai_conversations(artist_id);
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own conversations" ON public.ai_conversations FOR ALL TO authenticated
  USING (artist_id IN (SELECT id FROM artists WHERE profile_id = auth.uid()))
  WITH CHECK (artist_id IN (SELECT id FROM artists WHERE profile_id = auth.uid()));
CREATE TRIGGER update_ai_conversations_updated_at BEFORE UPDATE ON public.ai_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Daily tasks time block column
ALTER TABLE public.daily_tasks ADD COLUMN IF NOT EXISTS time_block TEXT DEFAULT 'anytime' CHECK (time_block IN ('morning', 'afternoon', 'evening', 'anytime'));
