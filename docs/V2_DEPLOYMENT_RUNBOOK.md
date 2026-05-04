# FRVR Sounds V2 — Deployment Runbook

> **Status:** Ready to apply.
> **Captured:** 2026-05-04
> **Spec reference:** [V2_ARTIST_OPERATING_SYSTEM.md](./V2_ARTIST_OPERATING_SYSTEM.md)
> **Revert target:** [V1_LEGACY_BRAND_JOURNEY.md](./V1_LEGACY_BRAND_JOURNEY.md)

This is the safe path for taking the V2 build from "code-shipped" to "live for paying users." Everything is **additive and idempotent** — no destructive operations, no schema rewrites.

---

## Pre-flight (10 minutes)

### 1. Confirm migration files

```bash
ls supabase/migrations/0003* | sort
```

Expected output:
```
supabase/migrations/00030_brand_journey_v2.sql
supabase/migrations/00031_onboarding_quiz.sql
supabase/migrations/00032_cadence_columns.sql
```

If any are missing, stop here — they're in this repo as committed files, so a missing one means an editor save was lost.

### 2. Snapshot Supabase

Take a logical backup before applying:

```bash
# Replace <PROJECT_REF> with your actual ref (settings → general)
supabase db dump --project-ref <PROJECT_REF> -f backup-pre-v2-$(date +%Y%m%d).sql
```

Verify the file is non-empty:
```bash
ls -lh backup-pre-v2-*.sql
```

### 3. Confirm Anthropic credit balance

V2 introduces 11 new Director modes. If credits are exhausted, the LLM features will return billing errors (graceful — no data loss), but UX will degrade. Top up first:

→ https://console.anthropic.com/settings/billing

The cost-model memory says ~$0.026 per agent run. Generating pillars + hooks + scoring 1 piece + multiplying = ~5 calls = ~$0.13 per artist's first session.

---

## Apply migrations (5 minutes)

Apply in order — **00030 → 00031 → 00032**. Each is wrapped in `IF NOT EXISTS` guards, so re-running is safe.

### Option A — Supabase CLI (recommended)

```bash
supabase db push --project-ref <PROJECT_REF>
```

The CLI walks the `supabase/migrations` directory in lexical order and applies any not yet recorded in `supabase_migrations.schema_migrations`.

### Option B — SQL editor (manual)

Open Supabase Studio → SQL Editor and paste each file's contents in order:
1. `supabase/migrations/00030_brand_journey_v2.sql`
2. `supabase/migrations/00031_onboarding_quiz.sql`
3. `supabase/migrations/00032_cadence_columns.sql`

Each should return `Success` with no warnings. If you see `relation already exists`, that's expected — `IF NOT EXISTS` makes the migration a no-op for already-present objects.

---

## Post-flight verification (5 minutes)

### 1. Hit the health endpoint

There's a super-admin-only health-check route that confirms every V2 column and table is present:

```bash
# From your local terminal, with your auth cookie or service role key
curl -H "Cookie: <your_session_cookie>" https://frvr-sounds.vercel.app/api/admin/v2-health | jq
```

Expected shape:
```json
{
  "ok": true,
  "tables": {
    "content_pieces": "ok",
    "streak_log": "ok",
    "feedback_runs": "ok",
    "onboarding_responses": "ok"
  },
  "brand_wiki_columns": {
    "public_truth": "ok",
    "niche_micro_statement": "ok",
    "niche_competitors": "ok",
    "niche_gap": "ok",
    "niche_ownable_territory": "ok",
    "revenue_primary_path": "ok",
    "revenue_secondary_paths": "ok",
    "revenue_offer_100": "ok",
    "revenue_offer_1k": "ok",
    "revenue_offer_10k": "ok",
    "content_pillars": "ok",
    "content_formats": "ok",
    "platform_strategy": "ok",
    "weekly_cadence": "ok",
    "weekly_cadence_primary_count": "ok",
    "weekly_cadence_batch_day": "ok",
    "weekly_cadence_ship_days": "ok",
    "hook_library": "ok",
    "conversion_path": "ok",
    "offer_ladder": "ok",
    "content_revenue_map": "ok",
    "consistency_plan": "ok",
    "module_outputs": "ok",
    "audience_models": "ok"
  }
}
```

If any entry is `"missing"` instead of `"ok"`, the corresponding migration didn't apply — re-run it.

### 2. Smoke-test the new surfaces

Sign in to your account (the operator account) and walk through:

| Step | Path | Expected |
|---|---|---|
| 1 | `/onboarding/quickstart` | 3-question form, then artifact (~$0.05 in credits) |
| 2 | `/onboarding/quiz` | 10-question quiz → tier recommendation |
| 3 | `/brand` → Module 8 | New "Content Engine" module visible at 0% |
| 4 | `/brand` → Module 1 | "Module outputs" panel below the question card |
| 5 | `/execution` | 4 panels render, top strip shows live streak |
| 6 | `/execution/draft` | Editor with platform / hook / body / cta |
| 7 | `/execution/draft` → Score | Returns 4-dim score from your wiki |
| 8 | `/execution/draft` → Ship | Streak counter increments to 1 |
| 9 | `/execution/draft` → enter performance metrics → save | No error |
| 10 | `/execution/history` | Empty state initially; after first Monday cron, shows persisted run |

### 3. Confirm Monday cron path is intact

The existing `/api/cron/run` job picks up `weekly_digest` jobs from `automation_schedules`. Check that an automation schedule exists for at least one artist:

```sql
SELECT artist_id, schedule_type, enabled, next_run_at
FROM automation_schedules
WHERE schedule_type = 'weekly_digest'
LIMIT 5;
```

If no rows, the digest won't fire. The schedule is created elsewhere (via `/api/me/automation-schedules` or admin); the V2 build does not enroll new users automatically.

---

## Rollback procedure

If something goes wrong post-migration and you need to revert immediately:

### Option A — Hide V2 surfaces (no DB changes)

Comment out the new sidebar entry and route registrations:
- Remove `Weekly Execution` from [src/components/layout/sidebar.tsx](../src/components/layout/sidebar.tsx) (1 line)
- Comment out `<OnboardingCallout />` in [src/app/(dashboard)/command-center/page.tsx](../src/app/(dashboard)/command-center/page.tsx)
- The new pages (`/execution/*`, `/onboarding/*`) become unreachable but data persists.

### Option B — Restore the V1 module set (no DB changes)

In [src/lib/brand/modules.ts](../src/lib/brand/modules.ts):
- Remove the Module 8 (`engine`) block from `BRAND_MODULES`
- Remove the V2-optional questions (those marked `optional: true`) from Modules 1, 3, 7

V1 users see exactly the V1 journey again. V2 columns stay populated but unread.

### Option C — Drop V2 columns / tables (full revert)

Only do this if you're certain. It's destructive — any V2 data is lost.

```sql
-- V2 brand_wiki additions
ALTER TABLE brand_wiki
  DROP COLUMN IF EXISTS public_truth,
  DROP COLUMN IF EXISTS niche_micro_statement,
  DROP COLUMN IF EXISTS niche_competitors,
  DROP COLUMN IF EXISTS niche_gap,
  DROP COLUMN IF EXISTS niche_ownable_territory,
  DROP COLUMN IF EXISTS revenue_primary_path,
  DROP COLUMN IF EXISTS revenue_secondary_paths,
  DROP COLUMN IF EXISTS revenue_offer_100,
  DROP COLUMN IF EXISTS revenue_offer_1k,
  DROP COLUMN IF EXISTS revenue_offer_10k,
  DROP COLUMN IF EXISTS content_pillars,
  DROP COLUMN IF EXISTS content_formats,
  DROP COLUMN IF EXISTS platform_strategy,
  DROP COLUMN IF EXISTS weekly_cadence,
  DROP COLUMN IF EXISTS weekly_cadence_primary_count,
  DROP COLUMN IF EXISTS weekly_cadence_batch_day,
  DROP COLUMN IF EXISTS weekly_cadence_ship_days,
  DROP COLUMN IF EXISTS hook_library,
  DROP COLUMN IF EXISTS conversion_path,
  DROP COLUMN IF EXISTS offer_ladder,
  DROP COLUMN IF EXISTS content_revenue_map,
  DROP COLUMN IF EXISTS consistency_plan,
  DROP COLUMN IF EXISTS module_outputs,
  DROP COLUMN IF EXISTS audience_models;

DROP TABLE IF EXISTS content_pieces CASCADE;
DROP TABLE IF EXISTS streak_log CASCADE;
DROP TABLE IF EXISTS feedback_runs CASCADE;
DROP TABLE IF EXISTS onboarding_responses CASCADE;
```

You'd also remove the `engine` value from `BrandModuleId` and revert tier display names in `plans.ts`.

Do not drop columns while the application is still running V2 code — the API will start 500'ing on writes.

---

## Quota considerations

The 11 new Director modes consume `agent_runs` from the artist's quota:

| Plan | quota | Approx capacity |
|---|---|---|
| Signal (starter) | 5 / mo | one quickstart + a few refines |
| Frequency (pro) | 100 / mo | full Module 8 + weekly scoring |
| Broadcast (studio) | unlimited | no cap |

If you start seeing `429` from `/api/agents/brand-director` for Frequency users mid-month, raise the Pro quota in [plans.ts](../src/lib/plans.ts) — `agent_run_quota: 100` — and bump it to 200 or 300 depending on your cost-model headroom.

---

## Communications

Per the project memory rule (always-ask tier + announcement questions when shipping user-visible features):

- **Visibility:** all changes default-on for everyone, no feature flag layer at the route level.
- **Announcement:** consider posting to `/whats-new` or sending a one-time email — V2 is a major shift in UX (especially the Weekly Execution Dashboard) and existing activated users will see new modules appear.
- **Tier rename:** Signal / Frequency / Broadcast are display-only; billing IDs (`starter`/`pro`/`studio`) unchanged. Make sure the announcement explains the new names and that nothing about their plan changed.

---

## What's complete

- 13 V2 build slices shipped (see commit history)
- 3 migrations queued, all additive + idempotent
- 11 new Director modes wired and tested for type-safety
- `/api/admin/v2-health` checks every new column + table
- V1 Brand Journey preserved verbatim — full revert possible
