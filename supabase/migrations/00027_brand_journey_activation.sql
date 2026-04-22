-- Brand Journey activation timestamp. Set once, when the artist first
-- finishes all 7 Brand Journey modules (≥80% per-module completeness).
-- The /api/brand-wiki/activate endpoint writes this on the first qualifying
-- call and emits a celebratory alert row. Idempotent.

ALTER TABLE public.brand_wiki
  ADD COLUMN IF NOT EXISTS journey_activated_at TIMESTAMPTZ;
