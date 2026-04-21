-- 00018_guided_recs_cache.sql
-- Adds a cache for Guided Recommendations output so pages can render
-- yesterday's analysis without re-hitting the LLM. Idempotent.

ALTER TABLE songs
  ADD COLUMN IF NOT EXISTS guided_recs JSONB,
  ADD COLUMN IF NOT EXISTS guided_recs_at TIMESTAMPTZ;

COMMENT ON COLUMN songs.guided_recs IS 'Cached structured output from the Guided Recommendations agent — an array of { priority, action, rationale, related_placement_id? } objects plus summary fields.';
COMMENT ON COLUMN songs.guided_recs_at IS 'When the cached recommendations were generated. Stale after 14 days — UI should prompt re-run.';
