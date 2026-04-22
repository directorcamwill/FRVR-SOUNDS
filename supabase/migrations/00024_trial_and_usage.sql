-- 00024_trial_and_usage.sql
-- Tracks AI agent usage against plan quotas and trial-period limits.
-- Subscriptions already have `trial_ends_at` (from 00020); this adds the
-- per-period counter so we can enforce PLANS[plan_id].agent_run_quota and
-- the trial-specific cap (5 runs across the 7-day trial regardless of plan).

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS agent_runs_this_period INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS agent_runs_period_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_subscriptions_trial_ends_at ON subscriptions(trial_ends_at)
  WHERE trial_ends_at IS NOT NULL;

COMMENT ON COLUMN subscriptions.agent_runs_this_period IS 'Count of LLM agent runs this billing period (or this trial). Resets on period rollover via webhook.';
COMMENT ON COLUMN subscriptions.agent_runs_period_started_at IS 'Start of the current counting window — reset when Stripe tells us a new billing period started.';
