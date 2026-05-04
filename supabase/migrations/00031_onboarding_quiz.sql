-- V2 onboarding behavioral quiz — 10 questions that recommend a tier
-- (signal / frequency / broadcast). Stores raw answers + computed
-- recommendation. Idempotent.
--
-- The recommendation is advisory: it surfaces in the user's account but
-- doesn't change billing. To actually move plans the user goes through
-- the existing pricing flow.

CREATE TABLE IF NOT EXISTS public.onboarding_responses (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id              UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  responses              JSONB NOT NULL DEFAULT '{}'::jsonb,    -- { q1: "...", q2: "...", ... }
  tier_signals           JSONB NOT NULL DEFAULT '{}'::jsonb,    -- { floor, ceiling, system_fit, reasoning[] }
  recommended_plan_id    TEXT,                                  -- "starter" | "pro" | "studio"
  completed_at           TIMESTAMPTZ,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(artist_id)                                             -- one canonical response per artist
);

CREATE INDEX IF NOT EXISTS idx_onboarding_responses_artist
  ON public.onboarding_responses(artist_id);

ALTER TABLE public.onboarding_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own onboarding response" ON public.onboarding_responses;
CREATE POLICY "Users view own onboarding response"
  ON public.onboarding_responses FOR SELECT TO authenticated
  USING (artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid()));

DROP POLICY IF EXISTS "Users write own onboarding response" ON public.onboarding_responses;
CREATE POLICY "Users write own onboarding response"
  ON public.onboarding_responses FOR ALL TO authenticated
  USING (artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid()))
  WITH CHECK (artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid()));
