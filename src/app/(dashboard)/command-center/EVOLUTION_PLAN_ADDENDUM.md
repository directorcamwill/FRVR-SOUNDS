# FRVR Sounds — Evolution Plan **Addendum**

**Companion to:** `EVOLUTION_PLAN.md` (base plan), `UPGRADE_SPEC.md`, `SYNC_MIX_MASTER_SPEC.md`.
**Status:** Plan only — no code yet. Reviewed + ordered before any build.
**Purpose:** Add the 10 concepts from the Phase-0 re-audit prompt that are **not** already covered by the base plan, **without duplicating anything already planned or shipped.**

---

## Scope guardrails (read before designing new code)

Before adding anything to this addendum, it has to pass three tests:

1. **Not already in the base plan.** If `EVOLUTION_PLAN.md` §1–§10 already covers it, that's the source of truth.
2. **Not already shipped this session.** The P0 confidence pattern, P1 sync-readiness + artifact grid + Package Builder, P2 sync-brief + placement-dna agents, and the P3 Command Center v2 (FocusBar, Spine, NextMoves, CurrentRecord, PipelinePulse, HealthReviewPanel, AmbientActivityFeed) are **done.**
3. **Not duplicating an existing primitive.** Every new agent must return the same `AgentResult` shape. Every new table extends rather than forks existing data (per base plan §3.1 naming discipline).

If a concept fails any test it doesn't go in this addendum — period.

---

## 1. What's in scope (10 new concepts)

| # | Concept | Classification | Why it's net-new |
|---|---|---|---|
| 1 | **Artist Brand Wiki** | ❌ MISSING | Base plan tracks *song-level* metadata + *business* setup, but no unified brand/audience/tone/visual/sonic identity store. |
| 2 | **Brand Director Agent** | ❌ MISSING | No agent guides brand-building. Closest existing: market-intel (analyzes market, not brand). |
| 3 | **Content Director Agent** | ❌ MISSING | `content_moments` table exists (migration 00006) but no agent drafts content. Catalog-marketing agent exists but is catalog-focused, not content-focused. |
| 4 | **Outreach Agent** | ❌ MISSING | No agent drafts supervisor emails / DMs / cover letters. |
| 5 | **Sales Agent** | ❌ MISSING | No agent handles inbound client conversion (the B2B "sign up for FRVR Sounds services" flow). |
| 6 | **Automation Agent** | ❌ MISSING | No orchestration of recurring flows (weekly briefings, content drips, outreach cadence). |
| 7 | **Autonomy Director Agent** | ❌ MISSING | Base plan §4.1 scores autonomy once as a static 6.0/10 — no agent measures + improves over time. |
| 8 | **Content + Sync Loop** (1 track → release + content + sync package + cutdowns + metadata, one click) | 🟡 PARTIAL | Artifacts + metadata + package builder shipped; the **orchestration** across them is missing. |
| 9 | **Real-audio Sync Readiness Analyzer** | ❌ MISSING | SyncReadinessMeter is metadata-only. An actual-file analyzer (LUFS, true peak, arrangement detection) is the same thing as the audio-engineering Stage 1 already flagged. |
| 10 | **Guided onboarding flow** (locks → unlocks phases, forces brand wiki build before production) | 🟡 PARTIAL | Current 3-step onboarding exists but doesn't gate later features behind brand completeness. |

---

## 2. Section 1 — Artist Brand Wiki + Brand Director Agent *(foundation)*

### 2.1 Why it's foundational
Every other new agent reads from this. Content Director needs voice/tone, Outreach Agent needs positioning, Content+Sync Loop needs sonic identity to caption correctly, Sync Brief Agent gets richer when it knows who the artist *is*, not just what the song *is*.

Without Brand Wiki first, every downstream agent emits generic output. With it, every agent is brand-consistent.

### 2.2 Data model — migration `00013_brand_wiki.sql`

Single new table. Does **not** replace `artists` or `profiles` — extends them.

```sql
create table brand_wiki (
  artist_id uuid primary key references artists(id) on delete cascade,

  -- Identity
  niche text,                          -- e.g. "dark cinematic R&B for prestige TV"
  elevator_pitch text,                 -- 1–2 sentences
  origin_story text,                   -- long-form artist story
  bio_short text,                      -- 150 chars
  bio_medium text,                     -- 300 chars
  bio_long text,                       -- 600 chars

  -- Audience
  primary_audience text,               -- "indie film supervisors 30–45"
  secondary_audience text,
  audience_pain_points text[],

  -- Tone + voice
  tone_descriptors text[],             -- ["cinematic","measured","confident"]
  voice_dos text[],                    -- what to say
  voice_donts text[],                  -- what not to say
  core_messaging text,

  -- Visual identity
  color_primary text,                  -- hex
  color_secondary text,
  color_accent text,
  font_heading text,
  font_body text,
  texture_keywords text[],             -- ["chrome","film grain","dark gloss"]
  logo_url text,                       -- file_key in audio-files bucket or external CDN
  icon_url text,
  press_photo_urls text[],

  -- Sonic identity
  sonic_genre_primary text,
  sonic_genre_secondary text,
  sonic_moods text[],
  sonic_bpm_range int4range,
  sonic_key_preferences text[],
  sonic_texture_keywords text[],       -- ["warm tape","sub-bass heavy","airy reverb"]
  reference_tracks jsonb default '[]'::jsonb,
  -- [{ artist, title, spotify_url?, why }]

  -- Mix/master preferences
  mix_preferences jsonb default '{}'::jsonb,
  -- { lufs_target, true_peak_target, stereo_width, vocal_character, compression_style }

  -- Sync positioning
  sync_format_targets text[],          -- ["tv_episode","film","trailer"]
  sync_library_targets text[],         -- libraries they want to submit to
  avoid_sync_formats text[],

  -- Meta
  completeness_pct int default 0,      -- computed by Brand Director
  last_guided_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS: artist_id must map to the user's profile
alter table brand_wiki enable row level security;
create policy "own brand wiki" on brand_wiki for all to authenticated
  using (artist_id in (select id from artists where profile_id = auth.uid()))
  with check (artist_id in (select id from artists where profile_id = auth.uid()));
```

### 2.3 Brand Director Agent — `src/lib/agents/brand-director.ts`

**Hybrid**: deterministic completeness scoring + LLM-driven guidance/refinement. Not pure-LLM.

**Input:** partial `brand_wiki` row + optional focus (`"identity" | "audience" | "tone" | "visual" | "sonic" | "sync_positioning"`).

**Output (`AgentResult<BrandGuidance>`):**
```ts
interface BrandGuidance {
  completeness_pct: number;
  missing_critical: string[];      // keys that block downstream agents
  missing_polish: string[];
  next_question: string;           // one question to ask the artist next
  next_question_choices?: string[];// optional multi-choice for faster fills
  suggested_edits: Array<{ field: string; current: string | null; suggestion: string; reasoning: string }>;
  // Auto-generated when the artist asks
  bio_variants?: { short: string; medium: string; long: string };
}
```

**Routing:**
- `POST /api/agents/brand-director` — body `{ focus?: BrandFocus; generate?: "bio"|"pitch"|"origin_story" }` → returns guidance, optionally writes back generated fields to `brand_wiki` when user approves.
- Writes alerts with `severity='warning'` when `completeness_pct < 60` and the artist is on the sync submission path (per base plan §7.3 review-queue contract).

### 2.4 UI surface — new route `/brand`

New top-level dashboard route, not buried under business or settings. Structure:
- **Wiki side panel** (left, fixed) — scrollable card per section: Identity, Audience, Tone, Visual, Sonic, Sync Positioning. Each card shows completeness %, click to edit inline.
- **Director chat** (right, floating) — drives the guided flow. Asks `next_question`, shows multi-choice chips, renders `suggested_edits` with accept/edit/reject on each.
- **Completeness bar** (top) — reuses the readiness-bar pattern from `<SyncReadinessMeter>`.

First-visit behavior: if `completeness_pct == 0`, the Director Agent takes over — the page is modal-like until at least `"missing_critical"` is resolved. After that, free navigation.

### 2.5 Lock/unlock wiring (also addresses concept #10)
- `/song-lab`, `/vault` upload, and `/pipeline` create-opportunity remain accessible (don't block creative work).
- `POST /api/songs/[id]/sync-score` and `POST /api/agents/package-builder` **soft-gate**: if brand_wiki is < 40% complete, they return with a warning blocker ("Your Brand Wiki is incomplete — scores will be generic") but still run.
- The new `/api/agents/content-director`, `/api/agents/outreach`, and the Content+Sync Loop **hard-gate**: they refuse to run if brand wiki is < 60% complete. User is redirected to `/brand`.

This is the progression you're after — no one gets locked out of uploading, but the high-leverage agent outputs require the wiki.

### 2.6 Integration with existing agents (write-through, not duplicate)
Update the following agents to accept an optional `brandContext` arg built from `brand_wiki`:
- `sync-brief` — enriches brief interpretation with brand voice
- `sync-engine` — scores with brand sonic identity in context
- `placement-dna` — biases heuristics toward artist's stated targets
- `orchestrator` — priority actions cite brand context ("Your wiki says you want prestige TV — X opportunity fits")

Pure additive; existing callers that don't pass `brandContext` keep working.

---

## 3. Section 2 — Growth Agents *(Content Director, Outreach, Sales, Automation)*

Four small agents. Each has the same shape: reads Brand Wiki + existing DB, emits structured output, logs to `agent_logs`, writes low-confidence results to `alerts`.

### 3.1 Content Director Agent — `src/lib/agents/content-director.ts`
**Purpose:** Drafts on-brand content from a song, a placement win, or a catalog event.

**Inputs:** song or opportunity, `content_moment_type: "song_release" | "placement_win" | "behind_scenes" | "catalog_update" | "brand_story"`, target platforms.

**Outputs:** structured content variants — captions (IG/TikTok/X/LinkedIn), hook ideas, hashtag sets, short-video shot-lists. Each variant carries a confidence + reasoning.

**Reads:** `brand_wiki.voice_dos/donts`, `brand_wiki.tone_descriptors`, song data.

**Writes:** `content_moments` rows (table already exists) with `source_agent='content_director'`.

**No new table.** Reuses `content_moments` from migration 00006.

### 3.2 Outreach Agent — `src/lib/agents/outreach.ts`
**Purpose:** Drafts cold-outreach messages to music supervisors, library curators, or placement contacts. **Does NOT send** — user must review + send themselves.

**Inputs:** opportunity or contact (name + company + role), Brand Wiki, optionally a song the artist wants to pitch.

**Outputs:** subject + body for email, DM version, shorter follow-up version. Each with confidence and a tone-match score (how closely it matches `brand_wiki.voice_dos`).

**Supporting table:** new `outreach_drafts` table:
```sql
create table outreach_drafts (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references artists(id) on delete cascade,
  opportunity_id uuid references opportunities(id) on delete set null,
  contact_name text,
  contact_email text,
  contact_company text,
  channel text check (channel in ('email','dm_instagram','dm_linkedin','dm_x','other')),
  subject text,
  body text,
  status text default 'draft' check (status in ('draft','approved','sent','replied')),
  confidence numeric(5,4),
  agent_reasoning text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

**UI:** new panel on `/pipeline/[id]` called "Outreach Drafts". Also a `/outreach` page for drafts not tied to an opportunity.

**Guardrail:** per base `user_privacy` rules — never auto-send; every send requires explicit user click.

### 3.3 Sales Agent — `src/lib/agents/sales.ts`
**Purpose:** Helps the user (Cameron) run *their own* FRVR Sounds B2B sales — qualifying inbound leads for the platform's membership/setup/premium tiers (per the pitch deck's revenue model: $297/mo / $997 setup / $2k premium).

**Different from Outreach Agent** — Outreach = artist pitching to music supervisors; Sales = Cameron onboarding clients to FRVR Sounds.

**Inputs:** lead (name + context + intent), offer tier ("membership"|"setup"|"premium"|"custom"), conversation history.

**Outputs:** next-best response (rebuttals, qualifying questions, proposed package), probability-to-close score, suggested pricing.

**Supporting table:** new `sales_leads` + `sales_conversation_turns`:
```sql
create table sales_leads (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references artists(id) on delete cascade,
  lead_name text, lead_email text, lead_source text,
  stage text check (stage in ('inquiry','qualified','proposal_sent','closed_won','closed_lost')),
  tier_interest text, close_probability numeric(5,4),
  proposed_price_cents integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create table sales_conversation_turns (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references sales_leads(id) on delete cascade,
  role text check (role in ('lead','sales_agent')),
  message text not null,
  confidence numeric(5,4),
  created_at timestamptz default now()
);
```

**UI:** `/sales` route with pipeline (inquiry → closed), turn-by-turn assistant.

**Scope caveat:** this is a **founder tool**, not an artist tool. Gated behind a per-artist `is_operator boolean` flag on `artists` (default false). Regular artist accounts never see `/sales`.

### 3.4 Automation Agent — `src/lib/agents/automation.ts`
**Purpose:** Orchestrates recurring flows. Runs on schedule (Vercel Cron / Supabase pg_cron).

**Example flows:**
- Weekly: run orchestrator + market-intel + package-builder for all active songs, email digest if high-urgency blockers exist
- Daily: ping outreach_drafts where `status='approved' AND no send recorded in 3 days` → nudge
- Per-release: when a song flips to `status='active'`, trigger Content Director for release moments

**Supporting table:** new `automation_schedules`:
```sql
create table automation_schedules (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references artists(id) on delete cascade,
  schedule_type text check (schedule_type in ('weekly_digest','daily_outreach_nudge','release_content_burst','custom')),
  cron_expression text,
  enabled boolean default true,
  last_run_at timestamptz,
  next_run_at timestamptz,
  config jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
```

**UI:** `/settings/automation` — toggle switches per schedule, preview of what will run next.

**Dependency:** requires a job queue (base plan §6.2 `jobs` table). If jobs queue hasn't been built, Automation Agent ships as **read-only preview** that generates a todo list the user runs manually, and becomes auto-executing when jobs lands.

---

## 4. Section 3 — Autonomy Director Agent

### 4.1 Purpose
Scores system-wide autonomy + suggests the single highest-leverage improvement.

### 4.2 Agent — `src/lib/agents/autonomy-director.ts`

**Pure deterministic** (like package-builder). No LLM tokens.

**Inputs:** artist_id.

**Checks across the system:**
- Has brand_wiki with `completeness_pct >= 80`? Score +10
- Has at least 1 song with `package_status.ready = true`? +15
- Has any `outreach_drafts` sent in last 30 days? +10
- Has any automation_schedules enabled? +10
- Orchestrator run in last 7 days? +5
- Sync brief structured on any active opportunity? +10
- Average confidence of last 20 agent runs > 0.80? +10
- Any unreviewed low-confidence alerts? −5 per item
- Deliverables on any sync-submitted song all ready? +10
- Real-audio analyzer wired (Stage 1 shipped)? +20

Max = 100. Written to `artists.autonomy_score` (new column).

**Output:** score + top-3 leverage improvements with estimated score delta each.

**UI:** extends the Command Center v2 Focus Bar — when autonomy_score < 70, Focus Bar shows the single suggested improvement alongside focus_area.

**Supporting column:** add to `artists` via migration `00014_autonomy.sql`:
```sql
alter table artists
  add column if not exists autonomy_score int,
  add column if not exists autonomy_checked_at timestamptz,
  add column if not exists is_operator boolean default false;
```

---

## 5. Section 4 — Content + Sync Loop (orchestration)

### 5.1 Purpose
One-click expansion of a finished song into its full productization surface.

### 5.2 Flow
From a song with `package_status.ready = true`:

```
                ┌──────────────────────────────────────┐
song (ready) ──▶│          Content + Sync Loop         │
                │  (orchestrates existing agents)      │
                └────┬──────┬──────┬──────┬────────────┘
                     │      │      │      │
                     ▼      ▼      ▼      ▼
          release_plan  content  sync_submissions  cutdown_jobs
          (new table)   _moments  (existing)        (requires audio
                        (existing)                   engine — deferred)
```

### 5.3 Orchestrator — `src/lib/agents/content-sync-loop.ts`

Not a new LLM agent. A thin coordinator that:
1. Reads song + package_status + brand_wiki
2. Calls Content Director for release + 30-day follow-up content moments
3. Generates a streaming release checklist into new `release_plan` table
4. Generates sync submission drafts (one per `sync_library_targets` in brand_wiki)
5. (Deferred) Queues cutdown jobs when audio engine exists

### 5.4 Supporting table: `release_plan`
```sql
create table release_plan (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null references songs(id) on delete cascade unique,
  distributor_name text,                 -- "DistroKid" / "TuneCore" etc
  release_date date,
  isrc text,
  one_sheet_url text,                    -- generated by Package Builder
  stream_art_url text,
  pre_save_url text,
  content_moments_planned int default 0,
  content_moments_published int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### 5.5 UI surface
- Button on `/vault/[songId]`: "Run Content + Sync Loop" — visible only when `package_status.ready = true`.
- Post-loop: a new "Release Plan" tab appears on the song detail page, showing what was generated and what's pending user review.

---

## 6. Section 5 — Real-Audio Sync Readiness Analyzer

### 6.1 This is just "audio engineering Stage 1" renamed
Already analyzed earlier in the session. **Not re-planning** — the plan is:
- Stack: Vercel Node function + `ffmpeg-static` + `fluent-ffmpeg`
- New `audio_analysis` table (LUFS integrated / short-term / true peak / loudness range / duration / format)
- `POST /api/songs/[songId]/analyze`
- Auto-trigger on upload
- Measurements surface in ArtifactGrid next to `lufs_target` with pass/fail tint

Build order puts this **after** Brand Wiki + Growth Agents because (a) those ship in a single session each, (b) this one is a multi-session infrastructure commitment.

### 6.2 Extension once shipped
Once real audio measurement exists, `sync-engine` gets a new input: measured LUFS + true peak + spectral profile. This upgrades the *mix score* from LLM-vibes to data-grounded.

**Open question for the user:** before I ship Stage 1, do we commit to the Vercel Node path (my earlier recommendation), or do you want a dedicated worker on Railway/Fly? The second is 2× more infra but has no timeout ceiling.

---

## 7. Build order

Each row ships in **one** focused session (unless marked multi-session).

| Sprint | Content | New migration | New routes | New files | Depends on |
|---|---|---|---|---|---|
| **A** | Brand Wiki + Brand Director Agent + `/brand` route | 00013 | `/api/brand-wiki` (GET/PUT), `/api/agents/brand-director` | ~8 | — |
| **B** | Content Director + integrate with existing `content_moments` | — | `/api/agents/content-director` | ~4 | A |
| **C** | Outreach Agent + `outreach_drafts` + opportunity panel | 00014 (combined with autonomy fields) | `/api/agents/outreach` + CRUD for drafts | ~6 | A |
| **D** | Sales Agent + `sales_leads` + `/sales` route | 00015 | `/api/agents/sales`, `/api/sales/leads` | ~8 | A (soft) |
| **E** | Autonomy Director + column add + Focus Bar integration | 00016 | `/api/agents/autonomy-director` | ~3 | A, B, C at minimum |
| **F** | Automation Agent + `automation_schedules` + jobs queue foundation | 00017 + jobs queue migration | `/api/agents/automation`, `/api/cron/run` | ~6 | all of A–E meaningful; also needs Supabase Cron or Vercel Cron setup |
| **G** | Content + Sync Loop orchestrator + `release_plan` | 00018 | `/api/agents/content-sync-loop` | ~5 | A, B, C, package-builder (shipped) |
| **H** (multi-session) | Real-audio analyzer — Stage 1 | 00019 + deps install | `/api/songs/[id]/analyze`, on-upload hook | ~8 | independent but highest infra risk |

**Estimated single-session cost per sprint:** A ≈ 2hr, B/C/D/E/F/G ≈ 1–1.5hr each, H ≈ 2 sessions.

**Recommended execution order (highest leverage first):**
1. **A first, always.** Without Brand Wiki, every other new agent emits generic content.
2. Then **B + G** to unlock the content loop (high visible value).
3. Then **C + D** for outreach/sales (direct revenue).
4. Then **E** for system-wide signal.
5. Then **F** once jobs queue exists.
6. **H** in parallel if a second session/agent is available.

---

## 8. What this addendum deliberately does NOT add

- **No new audio processing agent.** The "Audio Sync Readiness Analyzer" is file-level measurement only; mix/master synthesis is still base plan Stage 2, deferred.
- **No FRVR OS / Nite Room integration.** Still deferred — no upstream system to integrate with yet.
- **No "Brand Studio" generator** (AI-generated logos / press photos). Visual identity stores URLs the artist provides; generating visuals is a specialized problem (DALL-E/SDXL) that'd be a separate initiative.
- **No second sync engine.** Existing `sync-engine.ts` keeps its contract.
- **No replacement of existing onboarding.** The current 3-step onboarding still runs; Brand Wiki layers on top as the next milestone after onboarding.
- **No new LLM provider.** Continues on Claude/GPT-4o-mini per existing `callLLM`.

---

## 9. System-wide integration after addendum ships

```
┌──────────────────────────────────────────────────────────────┐
│              ARTIST BRAND WIKI (new — foundation)            │
│   niche · audience · tone · visual · sonic · sync targets    │
└─────┬────────────┬────────────┬────────────┬────────────┬────┘
      │            │            │            │            │
      ▼            ▼            ▼            ▼            ▼
 sync-brief   sync-engine  placement   Content       Outreach
 (extended)   (extended)   -dna (ext)  Director      Agent
                                       (new)         (new)
                                           │            │
                                           ▼            ▼
                                     content_       outreach_
                                     moments        drafts
                                                       │
                                                       ▼
                                                 Sales Agent
                                                 (new, operator-only)

 Content + Sync Loop (new)  reads everything above + package_status
                            → writes release_plan + pre-populates
                              submissions via existing routes

 Automation Agent (new)     schedules recurring runs of all above
 Autonomy Director (new)    measures + writes autonomy_score
```

Every new arrow is **read-through** of existing data. No duplicated schema, no parallel agents, no forked tables.

---

## 10. Ready-to-execute checklist

Before touching code on Sprint A, confirm with the user:
1. ✅ Addendum approved (this document)
2. ⏳ Brand Wiki schema fields signed off — especially the visual identity columns (logo_url / icon_url / press_photo_urls) — confirm we use the existing `audio-files` bucket with a `brand-assets/` prefix, or provision a new bucket.
3. ⏳ Brand Director Agent LLM budget — confirm Claude Sonnet is acceptable (vs. a cheaper fallback for rapid back-and-forth).
4. ⏳ Feature flag name — `NEXT_PUBLIC_BRAND_WIKI=true`?
5. ⏳ Route placement — `/brand` top-level vs. `/profile/brand`?

Once those five are answered, Sprint A is a one-session ship.

---

**End of addendum.** The base plan (`EVOLUTION_PLAN.md`) remains unchanged and authoritative for everything it already covers.
