-- Add AI confidence score to sync_scores
-- 0.0–1.0 scale. Nullable so historical rows remain valid.
-- Surfaces in the UI via <ConfidencePill> per UPGRADE_SPEC thresholds
-- (>=0.85 green, 0.70-0.84 chrome, <0.70 red + review flag).
ALTER TABLE public.sync_scores
  ADD COLUMN IF NOT EXISTS confidence NUMERIC(5,4)
    CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1));
