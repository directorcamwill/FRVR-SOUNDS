-- V2 trial flow bugfix: /api/artists upserts subscriptions with
-- status='incomplete' for new users (so they pass through Stripe checkout
-- to start their 7-day trial). The original CHECK constraint from 00020
-- didn't include 'incomplete', so the upsert silently failed and new
-- users ended up with no subscription row at all — breaking the AI gates.
--
-- Adds 'incomplete' to match Stripe's own subscription status terminology.
-- Idempotent: drops the old constraint by name and re-adds with the new
-- enumeration.

ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_status_check;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_status_check
    CHECK (status IN (
      'incomplete',
      'trialing',
      'active',
      'past_due',
      'canceled',
      'paused',
      'internal'
    ));
