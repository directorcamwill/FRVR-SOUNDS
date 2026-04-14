-- ==========================================
-- FRVR SOUNDS - Operations Tables
-- ==========================================

-- TIMELINE / ROADMAP
CREATE TABLE public.timeline_phases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID REFERENCES public.artists ON DELETE CASCADE NOT NULL,
  phase_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_month INTEGER NOT NULL,
  end_month INTEGER NOT NULL,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed')),
  goals JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DELIVERABLES
CREATE TABLE public.deliverables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID REFERENCES public.artists ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('music_production', 'sync_submissions', 'content', 'brand_assets', 'products', 'growth_systems', 'registrations', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  target_count INTEGER DEFAULT 1,
  current_count INTEGER DEFAULT 0,
  target_date DATE,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'overdue')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DAILY TASKS
CREATE TABLE public.daily_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID REFERENCES public.artists ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general' CHECK (category IN ('music', 'business', 'content', 'sync', 'admin', 'learning', 'general')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done', 'cancelled')),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- IDEAS
CREATE TABLE public.ideas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID REFERENCES public.artists ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('song', 'content', 'campaign', 'brand', 'collaboration', 'product', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  inspiration TEXT,
  ai_generated BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'developing', 'in_progress', 'completed', 'archived')),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_timeline_artist ON public.timeline_phases(artist_id);
CREATE INDEX idx_deliverables_artist ON public.deliverables(artist_id);
CREATE INDEX idx_daily_tasks_artist ON public.daily_tasks(artist_id);
CREATE INDEX idx_daily_tasks_date ON public.daily_tasks(due_date);
CREATE INDEX idx_daily_tasks_status ON public.daily_tasks(status);
CREATE INDEX idx_ideas_artist ON public.ideas(artist_id);

-- RLS
ALTER TABLE public.timeline_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own timeline" ON public.timeline_phases FOR ALL TO authenticated
  USING (artist_id IN (SELECT id FROM artists WHERE profile_id = auth.uid()))
  WITH CHECK (artist_id IN (SELECT id FROM artists WHERE profile_id = auth.uid()));

CREATE POLICY "Users manage own deliverables" ON public.deliverables FOR ALL TO authenticated
  USING (artist_id IN (SELECT id FROM artists WHERE profile_id = auth.uid()))
  WITH CHECK (artist_id IN (SELECT id FROM artists WHERE profile_id = auth.uid()));

CREATE POLICY "Users manage own daily_tasks" ON public.daily_tasks FOR ALL TO authenticated
  USING (artist_id IN (SELECT id FROM artists WHERE profile_id = auth.uid()))
  WITH CHECK (artist_id IN (SELECT id FROM artists WHERE profile_id = auth.uid()));

CREATE POLICY "Users manage own ideas" ON public.ideas FOR ALL TO authenticated
  USING (artist_id IN (SELECT id FROM artists WHERE profile_id = auth.uid()))
  WITH CHECK (artist_id IN (SELECT id FROM artists WHERE profile_id = auth.uid()));

-- Triggers
CREATE TRIGGER update_timeline_phases_updated_at BEFORE UPDATE ON public.timeline_phases FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_deliverables_updated_at BEFORE UPDATE ON public.deliverables FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_daily_tasks_updated_at BEFORE UPDATE ON public.daily_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_ideas_updated_at BEFORE UPDATE ON public.ideas FOR EACH ROW EXECUTE FUNCTION update_updated_at();
