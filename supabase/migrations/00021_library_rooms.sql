-- 00021_library_rooms.sql
-- Public-facing catalog organized as curated "rooms" (vibes/use-cases),
-- inspired by drakerelated.com's spatial room model. Plus supervisor-built
-- shortlists and email-capture for full-track access. Fully idempotent.

CREATE TABLE IF NOT EXISTS library_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  hero_image_url TEXT,
  hero_video_url TEXT,
  accent_color TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS library_room_songs (
  room_id UUID NOT NULL REFERENCES library_rooms(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL REFERENCES library_deals(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (room_id, deal_id)
);

CREATE INDEX IF NOT EXISTS idx_library_rooms_published ON library_rooms(is_published, sort_order);
CREATE INDEX IF NOT EXISTS idx_library_room_songs_deal ON library_room_songs(deal_id);
CREATE INDEX IF NOT EXISTS idx_library_room_songs_room ON library_room_songs(room_id, sort_order);

CREATE TABLE IF NOT EXISTS library_shortlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  supervisor_email TEXT,
  supervisor_name TEXT,
  supervisor_company TEXT,
  notes TEXT,
  view_count INT NOT NULL DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS library_shortlist_songs (
  shortlist_id UUID NOT NULL REFERENCES library_shortlists(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL REFERENCES library_deals(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note TEXT,
  PRIMARY KEY (shortlist_id, deal_id)
);

CREATE INDEX IF NOT EXISTS idx_library_shortlists_slug ON library_shortlists(slug);
CREATE INDEX IF NOT EXISTS idx_library_shortlist_songs_deal ON library_shortlist_songs(deal_id);

-- Email captures from public catalog visitors (supervisors, studios, directors
-- who unlock full-track playback or create a shortlist). Feeds FRVR's CRM.
CREATE TABLE IF NOT EXISTS library_visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  company TEXT,
  role TEXT,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_count INT NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_library_visitors_last_seen ON library_visitors(last_seen_at DESC);

-- RLS
ALTER TABLE library_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_room_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_shortlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_shortlist_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_visitors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_rooms" ON library_rooms;
CREATE POLICY "public_select_rooms" ON library_rooms
  FOR SELECT
  TO anon
  USING (is_published = true);

DROP POLICY IF EXISTS "auth_manage_rooms" ON library_rooms;
CREATE POLICY "auth_manage_rooms" ON library_rooms
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "public_select_room_songs" ON library_room_songs;
CREATE POLICY "public_select_room_songs" ON library_room_songs
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "auth_manage_room_songs" ON library_room_songs;
CREATE POLICY "auth_manage_room_songs" ON library_room_songs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Shortlists: slug is the auth — long unguessable slugs + public read/write.
DROP POLICY IF EXISTS "public_all_shortlists" ON library_shortlists;
CREATE POLICY "public_all_shortlists" ON library_shortlists
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "public_all_shortlist_songs" ON library_shortlist_songs;
CREATE POLICY "public_all_shortlist_songs" ON library_shortlist_songs
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "public_insert_visitors" ON library_visitors;
CREATE POLICY "public_insert_visitors" ON library_visitors
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "public_update_visitors" ON library_visitors;
CREATE POLICY "public_update_visitors" ON library_visitors
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "auth_select_visitors" ON library_visitors;
CREATE POLICY "auth_select_visitors" ON library_visitors
  FOR SELECT
  TO authenticated
  USING (true);

CREATE OR REPLACE FUNCTION library_rooms_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS library_rooms_touch ON library_rooms;
CREATE TRIGGER library_rooms_touch
  BEFORE UPDATE ON library_rooms
  FOR EACH ROW
  EXECUTE FUNCTION library_rooms_touch_updated_at();

-- Seed the 8 initial rooms. ON CONFLICT keeps this idempotent on re-run.
INSERT INTO library_rooms (slug, name, tagline, description, accent_color, sort_order)
VALUES
  ('the-booth', 'The Booth',
   'Late-night R&B, intimate vocals, 2am feel.',
   'Vocal-forward, warm, close-miked. Score a quiet apartment, a slow pan across a lit bedroom, the moment before someone says the thing they shouldn''t.',
   '#B85CFF', 10),
  ('the-basement', 'The Basement',
   'Lo-fi hip-hop, beat tape, underground grime.',
   'Dusty drums, vinyl hiss, bass that sits low. Montage energy for a character finding their footing — or losing it.',
   '#DC2626', 20),
  ('the-overture', 'The Overture',
   'Orchestral builds, sweeping strings, emotional peak.',
   'Cinematic arrangements that start as a whisper and end as a cathedral. Strings, brass, choir. For weddings, redemption arcs, the third-act release — and the trailer moment where the music lifts and doesn''t come down.',
   '#F5D76E', 30),
  ('the-drive', 'The Drive',
   'Synthwave, night-drive momentum, neon.',
   'Steady pulse, saturated synths, forward motion. Highway at 2am, car chase, training montage, the moment a character stops hesitating.',
   '#00E0FF', 40),
  ('the-field', 'The Field',
   'Americana, folk, open-road warmth.',
   'Acoustic, honest, a little tired in a good way. Heartland road trips, quiet family scenes, the porch at dusk.',
   '#E8A76A', 50),
  ('the-alley', 'The Alley',
   'Dark, tense, crime-thriller — trailer openers.',
   'Pulsing low end, unease under the melody, teeth-bared suspense. True crime, heist setup, the cut where you realize they knew all along.',
   '#7A1FA2', 60),
  ('the-reel', 'The Reel',
   'Instrumentals and scores — film beds, no vocals.',
   'No words, all texture. Under dialogue, behind voiceover, setting a room before anyone speaks.',
   '#4CAF50', 70),
  ('lost-and-found', 'Lost & Found',
   'FRVR''s monthly editorial drop.',
   'Rotating curation. The songs our A&R team wouldn''t shut up about this month. Updated on the first of every month.',
   '#DC2626', 80)
ON CONFLICT (slug) DO NOTHING;

COMMENT ON TABLE library_rooms IS 'Curated vibe/use-case rooms for public catalog browse. Drake Related spatial model — rooms as themed zones, not genres.';
COMMENT ON TABLE library_room_songs IS 'Many-to-many: a deal can live in multiple rooms.';
COMMENT ON TABLE library_shortlists IS 'Supervisor-built playlists. Created with unguessable slug; slug is the auth.';
COMMENT ON TABLE library_visitors IS 'Email capture + session tracking for public catalog visitors. Feeds CRM.';
