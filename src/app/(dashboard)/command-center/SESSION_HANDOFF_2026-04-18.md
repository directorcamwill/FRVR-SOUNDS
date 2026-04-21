# Session Handoff — 2026-04-18

Capturing the state at session close so the next Claude session picks up cleanly.

---

## 1. What was shipped this session

Across one long session, the following sprints from `EVOLUTION_PLAN_ADDENDUM.md` were completed.

### Sprint A — Brand Wiki + Brand Director (shipped)
- **Migration `00013_brand_wiki.sql`** — `brand_wiki` table (one row per artist) + RLS + updated_at trigger. Idempotent.
- **Agent**: `src/lib/agents/brand-director.ts` — hybrid (deterministic completeness scoring + Claude Sonnet guided coaching)
- **Shared helper**: `src/lib/agents/utils/brand-context.ts` — `getBrandContext()`, `requireBrandContext()`, `brandContextToPrompt()`. Every brand-aware agent reads through this.
- **Routes**: `GET/PUT /api/brand-wiki`, `POST /api/agents/brand-director`
- **UI**: new top-level `/brand` route with 6-tab form (Identity · Audience · Tone · Visual · Sonic · Sync Positioning). Tabs remount on `wiki.updated_at` so Apply-this suggestions reflect immediately. Coerces comma-strings to `TEXT[]` when applying array-field suggestions.
- **Sidebar**: Brand link in CORE group, gated on `NEXT_PUBLIC_BRAND_WIKI=true`
- **Seed script**: `scripts/seed-brand-wiki.mjs` (seeded "The Bluriver" at 100% for testing)

### Sprint B — Content Director (shipped)
- **Migration `00014_content_director.sql`** — extends `content_moments` with `source_agent`, `source_moment_type`, `source_song_id`, `source_opportunity_id`, `confidence`, `reasoning`, `hashtags`, `hook_ideas`, `batch_id`. Expanded `content_type` check.
- **Agent**: `src/lib/agents/content-director.ts` — **hard-gates on brand_wiki < 60%**
- **Route**: `POST /api/agents/content-director` (returns 422 with actionable body when gated)
- **UI**: `/content` page gets a **Director** dialog (moment type + source song + platform chips + custom note). Existing catalog-marketing "Catalog ideas" button preserved.

### Sprint C — Producer + Songwriter + Collab (shipped)
- **Migration `00015_song_lab_guidance.sql`** — `song_lab_projects` gains 6 cache cols (3 JSONB + 3 timestamps)
- **Agents**: `src/lib/agents/producer.ts`, `songwriter.ts`, `collab.ts` — all brand-aware via shared helper
- **Routes**: `/api/agents/{producer,songwriter,collab}`
- **UI**: `<GuidancePanel>` at `src/components/song-lab/guidance-panel.tsx` — three expandable cards in song-lab project detail right column

### Sprint D — Brand Fit (shipped, awaiting migration apply)
- **Migration `00016_brand_fit.sql`** — `songs.brand_fit_status` JSONB + `brand_fit_checked_at`. **⚠️ Not yet applied to DB. Paste from file, Run on the `nfihediocujeupwfjmzq` project.**
- **Agent**: `src/lib/agents/brand-fit.ts` — hybrid (deterministic genre/moods/BPM/key + LLM texture/reference/voice/sync qualitative dims)
- **Route**: `POST /api/agents/brand-fit`
- **UI**: `<BrandFitPanel>` at `src/components/vault/brand-fit-panel.tsx`. Full control on `/vault/[songId]`, read-only on `/song-lab/[projectId]` when project is linked to a vault song.

### Sprint E — Apply-to-idea + Opportunity Scanner (shipped)
- **`<GuidancePanel>`** extended with `onApplyToProject` callback. Each agent card gets an **Apply** button. Song-lab page implements `handleApplyGuidance` that fills idea fields (songwriter → structure + hook bank in lyrics + themes in notes; producer → structure + instrumentation + mix notes; collab → archetype list).
- **New route**: `POST /api/opportunities/match-project` — deterministic ranker, no LLM, ranks pipeline opportunities against project + brand. Scoring: genre match + mood overlap + brand format targets + avoid formats + brief format_family + deadline proximity.
- **New component**: `<OpportunityScanner>` at `src/components/song-lab/opportunity-scanner.tsx`. Placed in song-lab project detail left column, visible from writing stage onward.

---

## 2. Migration state (dev DB `nfihediocujeupwfjmzq`)

| # | Migration | Status |
|---|---|---|
| 00001–00012 | Initial + business + financial + operations + song-lab + confidence + sync-readiness + brief + package | ✅ Applied |
| 00013 | brand_wiki | ✅ Applied |
| 00014 | content_director extensions | ✅ Applied |
| 00015 | song_lab guidance cache | ✅ Applied |
| 00016 | brand_fit on songs | ⏳ **PENDING — paste `supabase/migrations/00016_brand_fit.sql` into the SQL editor** |

**Verify with**: `cd ~/Desktop/frvr-sounds && node scripts/check-brand-wiki.mjs` (returns OK when 00013 applied) or the generic check scripts in `scripts/`.

---

## 3. .env.local state (dev)

Active flags and keys (exact names, not values):
- `NEXT_PUBLIC_SUPABASE_URL` → `https://nfihediocujeupwfjmzq.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → publishable key (`sb_publishable_…`)
- `SUPABASE_SERVICE_ROLE_KEY` → secret key (`sb_secret_…`)
- `NEXT_PUBLIC_V2_COMMAND_CENTER=true` — v2 Command Center on
- `NEXT_PUBLIC_BRAND_WIKI=true` — Brand link + `/brand` page visible
- `NEXT_PUBLIC_ENGINE_V1=false` — Engine section stays off (no audio engine yet)
- Anthropic / OpenAI keys per `.env.example`

Backup exists: `.env.local.bak.20260416-195846` (pre–project-swap snapshot).

---

## 4. Seed data

- Artist onboarded: **The Bluriver** (from `/onboarding`)
- Brand wiki seeded at **100% completeness** by `scripts/seed-brand-wiki.mjs`. Niche: "Dark cinematic R&B for prestige TV + indie film". Full sonic identity, voice dos/donts, 4 reference tracks, sync targets.
- One song lab project exists: `e127def0-2f64-44af-bb8e-36e38d439d61` titled "A SAD NIGHT". Producer guidance already generated (confidence 0.92).
- Storage bucket `audio-files` exists with 50MB size limit + audio mime allowlist. Bootstrap script: `scripts/bootstrap-storage.mjs`.

---

## 5. Known issues carried into next session

1. **Producer agent takes ~28s** — Claude Sonnet on a heavy JSON schema. Client spinner stuck after response landed (server 200, DB write succeeded, client state didn't update). Fix path already designed: after POST resolves, re-fetch `/api/song-lab/[id]` and update state from truth. Also applies to Songwriter / Collab. **Not yet implemented.**
2. **Migration 00016 pending apply** — see §2.
3. **Middleware → proxy rename** — Next.js 16 deprecation warning on every build. Pre-existing chore, spawned earlier as a separate task.
4. **Song-lab assistant (`/api/assistant`) is still generic** — planned upgrade in addendum is to make it brand-aware via `getBrandContext()`, but not shipped yet.

---

## 6. What's still in the plan but NOT built

From `EVOLUTION_PLAN_ADDENDUM.md` §8 build order:

| Sprint | Content | Status |
|---|---|---|
| F | Automation Agent + `automation_schedules` + jobs queue foundation | not started |
| G | Content + Sync Loop orchestrator + `release_plan` table | not started |
| H | Real-audio Stage 1 analyzer (FFmpeg + `audio_analysis` table) — **multi-session** | not started |
| — | Sales Agent (operator-only) + `sales_leads` | not started |
| — | Autonomy Director Agent + `autonomy_score` | not started |
| — | Social Profile Designer | not started |
| — | Brand Single Designer / Album Designer | not started (heavy; needs new schema + orchestration) |

Also outstanding from the user's in-session asks that were planned but not executed:
- Song Lab → Vault **link-without-promote** (pick a vault song from song-lab without running Promote)
- Auto-run Brand Fit on song upload (currently manual)

---

## 7. How to resume in a new Claude Code session

1. **Open Claude Code in `/Users/filmbycamwill/Desktop/frvr-sounds`** (not the `ABBI CLIENT` pitch-deck project — that session is where this work was driven FROM, not the codebase)
2. **Read these three docs first**:
   - `src/app/(dashboard)/command-center/EVOLUTION_PLAN.md` (base plan)
   - `src/app/(dashboard)/command-center/EVOLUTION_PLAN_ADDENDUM.md` (additive sprints)
   - `src/app/(dashboard)/command-center/SESSION_HANDOFF_2026-04-18.md` (this file)
3. **Verify state** by running:
   ```bash
   node scripts/check-brand-wiki.mjs
   node scripts/check-song-lab-guidance.mjs
   npx tsc --noEmit
   npm run build
   ```
4. **Apply migration 00016** if not already:
   - `cat supabase/migrations/00016_brand_fit.sql | pbcopy`
   - Open https://supabase.com/dashboard/project/nfihediocujeupwfjmzq/sql/new
   - Confirm top bar says the dev project (not FRVR SOUNDS production) — the dev project might be labeled "FRVR SOUNDS / SAM" in the UI but its URL ID is `nfihediocujeupwfjmzq`
   - Paste → Run
5. **Start next sprint** — recommended order:
   - Fix the Producer/Songwriter/Collab client-refetch bug (~30 min)
   - Wire song-lab "Link vault song" picker (~30 min)
   - Then Sprint F (Automation Agent + jobs queue) — first real infra piece

---

## 8. Things to preserve / do not touch

- `page.backup.tsx` in command-center — v1 rollback
- All existing migrations 00001–00012 — foundation
- Financial OS, business setup, LLC agent, existing sync-engine, market-intel, health-monitor — do not reshape
- `.env.local.bak.20260416-195846` — keep as recovery point

---

## 9. Conventions established this session

- **Brand-aware agents** all read via `getBrandContext()` from `src/lib/agents/utils/brand-context.ts`. Single source of truth.
- **Hard-gate** agents return `{ gated: true, ... }` with HTTP 422 — UI renders a single gate banner with a link to `/brand`.
- **All new migrations are idempotent** (`CREATE TABLE IF NOT EXISTS`, `DROP POLICY IF EXISTS` before `CREATE POLICY`, `ADD COLUMN IF NOT EXISTS`). Safe to re-run on partial-state DBs.
- **Cached guidance** lives on the row it's about (e.g. `song_lab_projects.producer_guidance`, `songs.brand_fit_status`) so pages can render without re-hitting the LLM.
- **Low-confidence outputs** (confidence < 0.70) write a warning `alerts` row to feed the Command Center v2 Human Review queue.
