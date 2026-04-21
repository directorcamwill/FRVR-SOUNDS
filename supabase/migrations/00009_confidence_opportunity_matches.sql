-- Add AI confidence score to opportunity_matches
-- Same 0.0–1.0 semantics as sync_scores.confidence (migration 00008).
-- Nullable so historical AI + manual matches remain valid.
ALTER TABLE public.opportunity_matches
  ADD COLUMN IF NOT EXISTS confidence NUMERIC(5,4)
    CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1));
