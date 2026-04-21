-- 00017_song_lab_tabs.sql
-- Adds structured fields for the tabbed Song Lab detail view.
-- Each field backs a dedicated tab so Apply-to-project can route guidance
-- without clobbering lyrics or structure.
--
-- Idempotent: safe to re-run.

ALTER TABLE song_lab_projects
  ADD COLUMN IF NOT EXISTS writing_ideas TEXT,
  ADD COLUMN IF NOT EXISTS producer_ideas TEXT,
  ADD COLUMN IF NOT EXISTS metaphors TEXT,
  ADD COLUMN IF NOT EXISTS brand_connection TEXT,
  ADD COLUMN IF NOT EXISTS project_mode TEXT DEFAULT 'single',
  ADD COLUMN IF NOT EXISTS placement_intent TEXT DEFAULT 'both',
  ADD COLUMN IF NOT EXISTS album_context JSONB;

COMMENT ON COLUMN song_lab_projects.writing_ideas IS 'Songwriter-agent output (themes, hooks, couplets). Not raw lyrics.';
COMMENT ON COLUMN song_lab_projects.producer_ideas IS 'Producer-agent output (instrumentation, arrangement, mix direction).';
COMMENT ON COLUMN song_lab_projects.metaphors IS 'Concept/metaphor hub — depth layer feeding lyric and production choices.';
COMMENT ON COLUMN song_lab_projects.brand_connection IS 'How this project ties back to the brand wiki (free-text artist notes).';
COMMENT ON COLUMN song_lab_projects.project_mode IS 'single | album — scope of the release.';
COMMENT ON COLUMN song_lab_projects.placement_intent IS 'sync | brand_release | both — where this track is aimed.';
COMMENT ON COLUMN song_lab_projects.album_context IS 'Nullable; only populated when project_mode = album. { album_title, song_position, concept }.';
