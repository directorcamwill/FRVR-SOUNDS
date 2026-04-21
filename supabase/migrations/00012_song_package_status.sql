-- Per-song sync package readiness cache.
-- The Package Builder agent runs deterministic checks and writes a JSONB
-- snapshot here so the song detail page can render readiness without
-- recomputing on every load.
--
-- Additive only, nullable — pre-migration songs simply have null status
-- until the agent runs for them.

ALTER TABLE public.songs
  ADD COLUMN IF NOT EXISTS package_status JSONB,
  ADD COLUMN IF NOT EXISTS package_checked_at TIMESTAMPTZ;
