-- Bugfix companion to 00030: Module 8's "engine.cadence" question is a
-- `multi_field` whose three slots write to per-slot field_keys
-- (weekly_cadence_primary_count / _batch_day / _ship_days), but only the
-- aggregate `weekly_cadence` JSONB column existed in 00030. Result: PUTs
-- silently dropped the cadence answers.
--
-- Adds the three flat columns the slots actually write to. Idempotent —
-- safe to re-run, safe to apply on top of (or before) 00030.
--
-- The aggregate `weekly_cadence` JSONB stays in place for future use
-- (server-side composition, cron-job snapshots, etc.).

ALTER TABLE public.brand_wiki
  ADD COLUMN IF NOT EXISTS weekly_cadence_primary_count   INTEGER,
  ADD COLUMN IF NOT EXISTS weekly_cadence_batch_day       TEXT,
  ADD COLUMN IF NOT EXISTS weekly_cadence_ship_days       TEXT;
