-- Brand Fit grade — metadata-based alignment score between a vault song and
-- the artist's brand_wiki (sonic identity + references + mix prefs).
-- Complement to sync_scores (which grades sync-readiness across 7 dimensions).
-- Fully idempotent.

ALTER TABLE public.songs
  ADD COLUMN IF NOT EXISTS brand_fit_status JSONB,
  ADD COLUMN IF NOT EXISTS brand_fit_checked_at TIMESTAMPTZ;
