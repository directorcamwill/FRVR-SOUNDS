-- Song Lab AI guidance cache — Producer, Songwriter, Collab agents each
-- write their latest structured output to its own JSONB column on the
-- song_lab_projects row so the right panel can render cached guidance
-- without re-hitting the LLM on every page load.
--
-- All columns nullable. Fully idempotent.

ALTER TABLE public.song_lab_projects
  ADD COLUMN IF NOT EXISTS producer_guidance JSONB,
  ADD COLUMN IF NOT EXISTS producer_guidance_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS songwriter_guidance JSONB,
  ADD COLUMN IF NOT EXISTS songwriter_guidance_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS collab_suggestions JSONB,
  ADD COLUMN IF NOT EXISTS collab_suggestions_at TIMESTAMPTZ;
