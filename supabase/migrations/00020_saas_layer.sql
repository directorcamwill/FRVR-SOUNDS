-- 00020_saas_layer.sql
-- Multi-tenant SaaS primitives: subscriptions, announcements, super-admins.
-- Plans themselves live in code (src/lib/plans.ts) — this table just links
-- an artist to a plan_id (string) + billing state. Idempotent.

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'trialing',
    'active',
    'past_due',
    'canceled',
    'paused',
    'internal'
  )),
  trial_ends_at TIMESTAMPTZ,
  current_period_ends_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (artist_id)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);

CREATE TABLE IF NOT EXISTS super_admins (
  profile_id UUID PRIMARY KEY,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  granted_by UUID,
  note TEXT
);

CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'feature', 'warning', 'maintenance')),
  -- Empty array = visible to all. Otherwise, only visible to these plan IDs.
  target_plan_ids TEXT[] NOT NULL DEFAULT '{}',
  cta_label TEXT,
  cta_url TEXT,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  dismissible BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(starts_at, ends_at);

-- Per-user dismissals so we don't keep showing the same banner forever.
CREATE TABLE IF NOT EXISTS announcement_dismissals (
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL,
  dismissed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (announcement_id, profile_id)
);

-- RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_dismissals ENABLE ROW LEVEL SECURITY;

-- subscriptions: artists can see their own; super-admins via service role
DROP POLICY IF EXISTS "own_subscription" ON subscriptions;
CREATE POLICY "own_subscription" ON subscriptions
  FOR SELECT
  TO authenticated
  USING (
    artist_id IN (SELECT id FROM artists WHERE profile_id = auth.uid())
  );

-- super_admins: only authenticated can read (used for gating). Writes via service role only.
DROP POLICY IF EXISTS "auth_read_super_admins" ON super_admins;
CREATE POLICY "auth_read_super_admins" ON super_admins
  FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

-- announcements: all authenticated can read
DROP POLICY IF EXISTS "auth_read_announcements" ON announcements;
CREATE POLICY "auth_read_announcements" ON announcements
  FOR SELECT
  TO authenticated
  USING (true);

-- announcement_dismissals: own only
DROP POLICY IF EXISTS "own_dismissals" ON announcement_dismissals;
CREATE POLICY "own_dismissals" ON announcement_dismissals
  FOR ALL
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- updated_at trigger for subscriptions
CREATE OR REPLACE FUNCTION subscriptions_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS subscriptions_touch ON subscriptions;
CREATE TRIGGER subscriptions_touch
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION subscriptions_touch_updated_at();

-- Seed: grant super_admin to every existing artist's profile (you're the only
-- artist right now — this grants Cameron's account). Safe for future runs:
-- INSERT ON CONFLICT DO NOTHING.
INSERT INTO super_admins (profile_id, note)
SELECT profile_id, 'Auto-seeded on 00020 migration'
FROM artists
ON CONFLICT (profile_id) DO NOTHING;

-- Seed: ensure every existing artist has an internal-tier subscription so
-- they keep working after this migration. Subsequent signups will pick a
-- real tier during onboarding.
INSERT INTO subscriptions (artist_id, plan_id, status)
SELECT a.id, 'internal', 'internal'
FROM artists a
WHERE NOT EXISTS (SELECT 1 FROM subscriptions s WHERE s.artist_id = a.id);

COMMENT ON TABLE subscriptions IS 'Artist → plan + billing state. Plan definitions live in code.';
COMMENT ON TABLE super_admins IS 'Cross-tenant god-view access for operators (you).';
COMMENT ON TABLE announcements IS 'Broadcast banners to all accounts or filtered by plan.';
COMMENT ON TABLE announcement_dismissals IS 'Per-user dismissal tracking so banners disappear after one click.';
