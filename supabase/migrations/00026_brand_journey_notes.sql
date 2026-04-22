-- Collective notes for the Brand Journey — a running scratchpad the artist
-- can jot thoughts into while answering questions. One blob per artist,
-- saved alongside the rest of the wiki. Idempotent.

ALTER TABLE public.brand_wiki
  ADD COLUMN IF NOT EXISTS journey_notes TEXT;
