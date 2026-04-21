-- Opportunity Brief + Placement DNA columns
-- Feeds two new agents (sync-brief, placement-dna) without a second table —
-- per EVOLUTION_PLAN §3.1 naming discipline: extend opportunities, don't
-- create a parallel sync_briefs table.
-- All additive + nullable.

ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS brief_details JSONB,
  ADD COLUMN IF NOT EXISTS brief_structured_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS placement_dna_cache JSONB,
  ADD COLUMN IF NOT EXISTS placement_dna_cached_at TIMESTAMPTZ;
