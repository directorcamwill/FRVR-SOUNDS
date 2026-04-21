# FRVR Sounds — System Evolution Plan (Non-Destructive)

**Based on:** live codebase audit (Next.js 16.2.3, Supabase, 8 AI agents, 50+ tables, 40+ API routes)
**Supersedes:** none — augments `UPGRADE_SPEC.md` and `SYNC_MIX_MASTER_SPEC.md`
**Operating mode:** EVOLVE, don't rebuild. Preserve everything that works.

---

## ⚠️ CRITICAL REALITY CHECK (read first)

The prior specs (`SYNC_MIX_MASTER_SPEC.md`) assumed the app was an AI mixing/mastering engine. **It is not.** The real codebase is:

> **A business + sync licensing + catalog management OS for independent artists.**
> Audio files are uploaded *already* mixed/mastered. There is zero DSP code, no FFmpeg, no Matchering, no LUFS analysis, no waveform generation.

This changes everything. This plan respects that truth and proposes an **additive Sync Production layer** that works alongside — not inside — the existing app. The Mix/Master engine becomes a **phased, optional module** behind feature flags, with honest scoping.

---

## 1. FULL AUDIT REPORT (with classifications)

### 1.1 System classifications

| # | System | Classification | Evidence | Notes |
|---|---|---|---|---|
| 1 | **Catalog / Song Vault** | ✅ EXISTS | `songs`, `song_metadata`, `stems` tables · `/vault/*` routes · `metadata-form.tsx`, `stems-manager.tsx` | Full CRUD, genre/mood/BPM/key/vocal metadata, 10 stem types, upload to Supabase storage |
| 2 | **Sync Scoring (AI)** | ✅ EXISTS | `sync-engine.ts` agent · `sync_scores` table · 7-component scoring | Claude-powered, 0–100, with reasoning |
| 3 | **Opportunity Pipeline** | ✅ EXISTS | `/pipeline/*` · `opportunities` + `opportunity_matches` tables · Kanban board | Full drag-drop by stage |
| 4 | **Submissions** | ✅ EXISTS | `/submissions` · `submissions` table · form + table UI | Status tracking, deadlines, fees |
| 5 | **AI Agents (8)** | ✅ EXISTS | `src/lib/agents/` — orchestrator, sync-engine, health-monitor, llc, business-manager, market-intel, catalog-marketing, royalty-scanner | Dual-LLM (Claude/GPT-4o-mini), logged to `agent_logs` |
| 6 | **Command Center Dashboard** | 🟡 PARTIAL | `/command-center/page.tsx` — 8 widgets, orchestrator-driven | Works but flat; see `UPGRADE_SPEC.md` for v2 |
| 7 | **Health Monitoring** | ✅ EXISTS | `health-monitor.ts` · `health_scores` table · 6 metrics | Drives health page + alerts |
| 8 | **Business Setup (4-phase)** | ✅ EXISTS | `business_setup` table (50+ columns) · `business-manager.ts` · LLC advisor | Very comprehensive |
| 9 | **Financial OS** | ✅ EXISTS | `song_splits`, `contracts`, `song_registrations`, `revenue_streams`, `revenue_entries`, `revenue_goals`, `external_accounts`, `deals` | Extremely mature; split sheets, PRO/MLC/ISRC tracking |
| 10 | **Intelligence Briefs** | ✅ EXISTS | `intelligence_briefs` table · `market-intel.ts` · `/intelligence` page | Weekly market briefs |
| 11 | **Deliverables Tracking** | 🟡 PARTIAL | `deliverables` table · `/deliverables` page · count-based progress | Generic — not aware of audio artifacts (masters, stems ZIP, cutdowns) |
| 12 | **Song Lab (production workspace)** | 🟡 PARTIAL | `song_lab_projects` table · AI chat · BPM/key/lyrics/refs/checklist | No blueprint schema, no arrangement map, no edit-points, no sync-first mode |
| 13 | **Ideas / Content / Daily Tasks** | ✅ EXISTS | `ideas`, `daily_tasks`, `content_moments`, `timeline_phases` | All wired to AI generation |
| 14 | **Audio Processing Engine** | ❌ MISSING | no FFmpeg, no Matchering, no Demucs, no LUFS, no waveform generation | Biggest gap vs. the spec |
| 15 | **Template / Preset Library** | ❌ MISSING | no template tables, no preset UI | Required for any future mix/master engine |
| 16 | **Reference Matching** | ❌ MISSING | no reference profile schema, no upload flow | Required for mastering |
| 17 | **Sync Brief Engine** | ❌ MISSING | `opportunities` ≠ a sync brief. Brief semantics (format family, dialog-safe, cutdowns) don't exist | Can add as additive module |
| 18 | **Placement DNA** | ❌ MISSING | no structured reference corpus, no probability-weighted heuristics | Additive module |
| 19 | **Song Blueprint Engine** | ❌ MISSING | `song_lab_projects` is close but lacks structure_map, edit_points, dynamic_arc, hook_map | Extend `song_lab_projects`, don't duplicate |
| 20 | **Production Template Engine** | ❌ MISSING | no templates for DAW routing / bus map / mix-chain defaults | Build new |
| 21 | **Dual Mix/Master (Sync + Release branches)** | ❌ MISSING | no branch table, no dual-profile rendering | Build new, audio engine-dependent |
| 22 | **Delivery Package / Cutdowns / Alternates** | ❌ MISSING | no package builder, no 60/30/15 cutdown job type | Build new |
| 23 | **QC Engine (audio)** | ❌ MISSING | no LUFS/true-peak/phase/mono/harshness checks | Audio engine-dependent |
| 24 | **Signature Sound Profiles** | ❌ MISSING | not in schema | Defer to V3 moat layer |
| 25 | **Metadata (for sync submission)** | 🟡 PARTIAL | `song_metadata` exists but missing: scene_tags, dialogue_safe_score, cutdown_points, loop_points, instrumental_available flag | Extend, don't duplicate |
| 26 | **Rights / Splits Readiness (for sync)** | ✅ EXISTS | `song_splits` + `split_participants` + `song_registrations` cover this thoroughly | Just needs to be *surfaced* for sync package |
| 27 | **Task Queue / Async Workers** | ❌ MISSING | agents run synchronously in API handlers | Blocks any long-running audio job |
| 28 | **Confidence Scoring UI** | ❌ MISSING | agents return confidence in logs but it's not rendered | Easy win |
| 29 | **Human Review Queue** | ❌ MISSING | no queue table, no UI for low-confidence overrides | Build new |
| 30 | **FRVR OS / Nite Room integration** | ❌ MISSING | zero references in code | Deferred |

### 1.2 Duplication check

| Potential duplicate | Verdict |
|---|---|
| `opportunities` vs a new `sync_briefs` table | ⚠️ **Risk of duplication.** Sync briefs belong *inside* opportunities as a structured sub-record, not as a parallel table. |
| `song_lab_projects` vs a new `song_blueprints` table | ⚠️ **Risk of duplication.** Extend `song_lab_projects` with blueprint fields, don't create a parallel table. |
| `sync-engine.ts` agent vs a new "sync scoring" engine | ⚠️ **Do NOT create a second sync engine.** Extend the existing agent. |
| `deliverables` vs a new `sync_deliverables` table | ⚠️ **Risk of duplication.** Extend `deliverables` with audio-artifact subtypes. |
| `song_metadata` vs a new `sync_metadata` table | ⚠️ **Duplicate — do not create.** Add columns to `song_metadata`. |
| `agent_logs` vs any new AI tracking table | ⚠️ **Do not create.** Use `agent_logs` for all agent traces. |

### 1.3 System health score

| Dimension | Score (0–10) | Why |
|---|---|---|
| Data model maturity | 9 | 50+ tables, thoughtful foreign keys, RLS, JSONB where it should be |
| AI orchestration | 8 | 8 agents, dual-LLM, structured outputs, logging — but no async queue |
| Sync licensing workflow | 8 | Pipeline + matching + submissions + scoring all wired |
| Business/financial OS | 9 | Exceptionally thorough for an indie-artist tool |
| UI system | 7 | shadcn + Framer Motion + Recharts in place; v1 Command Center flat |
| Audio infrastructure | 0 | Doesn't exist |
| Template system | 0 | Doesn't exist |
| Confidence/review UX | 2 | Data exists in logs, not surfaced |
| Async job system | 0 | Synchronous-only; blocks audio future |
| **Overall** | **6.0** | Excellent bones, missing the audio limb |

### 1.4 Top 10 leverage upgrades (highest ROI, non-destructive)

1. **Surface confidence scores** everywhere Claude decides (sync score, orchestrator priority actions, matches). One shared `<ConfidencePill>`. ~1 day, massive trust win.
2. **Upgrade Command Center to v2** (per `UPGRADE_SPEC.md`). Spine + Focus Bar + Next Moves. No new infrastructure needed.
3. **Add sync-submission readiness meter** to every song in the vault. Combines existing split/registration/metadata completeness data — zero new tables.
4. **Extend `song_metadata`** with sync-critical columns (scene_tags, dialogue_safe_score, cutdown_points, instrumental_available, loop_points). Pure ALTER migration.
5. **Extend `song_lab_projects`** with blueprint fields (structure_map, edit_points, dynamic_arc, hook_map, ending_type). Pure ALTER.
6. **Sync Brief sub-record on opportunities** — add `brief_details JSONB` column to `opportunities`. Format family, mood, dialogue-heavy, cutdowns, target library. Zero new tables.
7. **Human review queue** — reuse `alerts` table with `severity='urgent'` + new `alert_type='review_required'`. Zero new tables.
8. **Deliverables subtyping** — add `artifact_type` column (`streaming_master|sync_dynamic|instrumental|tv_mix|stems_zip|cutdown_60|cutdown_30|cutdown_15|sting|loop`) to existing `deliverables`. Pure ALTER.
9. **Async job queue** — add `jobs` table + a Vercel Cron + Supabase Edge Function worker. Unblocks every future long-running task.
10. **Placement DNA agent** — new Claude agent that reads prior placements from `opportunities` + `submissions` + `sync_scores` and emits structured heuristics by format family. Pure additive agent; no new schema beyond a cache column.

---

## 2. SAFE UPGRADE PLAN (system-by-system)

Rule of engagement per classification:
- ✅ EXISTS → leave intact, optional light polish
- 🟡 PARTIAL → extend only
- ❌ MISSING → build additively, feature-flagged

### 2.1 Command Center
**Classification:** 🟡 PARTIAL → upgrade per `UPGRADE_SPEC.md`.
**Preserve:** orchestrator API contract, MotionCard/GlowCard primitives, health widget data shape.
**Extend:** new Focus Bar, Spine, Next Moves, Current Record, Pipeline Pulse.
**No breaking changes.** Gate behind `NEXT_PUBLIC_V2_COMMAND_CENTER`.

### 2.2 Sync Scoring
**Classification:** ✅ EXISTS.
**Preserve:** `sync-engine.ts`, 7-component schema, API route.
**Light enhancement:** return `confidence` number in the response (it's in the prompt already — just expose). Add one column `confidence numeric(5,4)` to `sync_scores`.

### 2.3 Opportunities + Submissions
**Classification:** ✅ EXISTS.
**Preserve:** Kanban board, stage enum, all CRUD.
**Extend:** add `brief_details JSONB` on `opportunities` for sync brief structure. Build a "Sync Brief" form surface inside the opportunity detail page (not a new route).

### 2.4 Song Vault + Metadata
**Classification:** 🟡 PARTIAL.
**Preserve:** every existing column, song-card, radar chart.
**Extend:** ALTER `song_metadata` with new nullable columns (non-breaking):
- `scene_tags text[]`
- `dialogue_safe_score numeric(4,3)`
- `cutdown_points jsonb` (array of seconds)
- `loop_points jsonb`
- `instrumental_available boolean default false`
- `tv_mix_available boolean default false`

Also extend `songs` with `sync_submission_ready boolean generated`. Supabase supports generated columns; compute from splits complete + metadata complete + at least one artifact.

### 2.5 Song Lab
**Classification:** 🟡 PARTIAL.
**Preserve:** `song_lab_projects`, AI chat, reference tracks array.
**Extend:** ALTER `song_lab_projects` with:
- `mode text check (mode in ('release','sync_instrumental','sync_vocal','hybrid'))`
- `structure_map jsonb` (sections + bars)
- `edit_points jsonb` (seconds array)
- `dynamic_arc jsonb`
- `hook_map jsonb`
- `ending_type text check (ending_type in ('hard_button','cold_stop','fade','ring_out','loopable'))`
- `sync_score_estimate numeric(5,2)` (predicted score before finishing)
- `release_score_estimate numeric(5,2)`

### 2.6 Deliverables
**Classification:** 🟡 PARTIAL.
**Preserve:** category, target_count, current_count, `/deliverables` page.
**Extend:**
- `artifact_type text` (nullable) — identifies audio artifact when relevant
- `song_id uuid references songs(id)` (nullable, for when deliverable is tied to a specific track)
- `lufs_target numeric(6,2)`, `true_peak_target numeric(6,2)`, `qc_passed boolean`

Existing category-count deliverables keep working. New audio artifacts attach cleanly.

### 2.7 AI Agents (8)
**Classification:** ✅ EXISTS for all 8.
**Preserve:** all 8 agents, `agent_logs` table, dual-LLM pattern.
**Light enhancement:** every agent must return `confidence` (0–1) in its structured output. Update each agent's prompt + response Zod schema once.

### 2.8 Intelligence / Market Intel
**Classification:** ✅ EXISTS.
**Preserve:** `intelligence_briefs`, weekly cadence, `/intelligence` UI.
**Light enhancement:** feed `opportunities.brief_details` data into the market-intel agent so briefs cite real pipeline context.

### 2.9 Financial OS
**Classification:** ✅ EXISTS — untouched.
**Do not modify.**

### 2.10 Daily / Ideas / Content / Timeline
**Classification:** ✅ EXISTS.
**Preserve.** Only change: in Command Center v2, merge `daily_tasks` + orchestrator priority_actions into one Next Moves surface (read-only merge in UI; source tables remain separate).

---

## 3. SYNC ENGINE INTEGRATION PLAN (non-destructive additive layer)

### 3.1 Naming discipline to avoid collisions

The codebase already has `sync-engine.ts` (song scoring). We must NOT reuse that name.

**Decided names** (use throughout new code):
- Existing agent: **Sync Score Agent** (`sync-engine.ts` keeps its filename; internal label updated in docs)
- New agent: **Sync Brief Agent** (`src/lib/agents/sync-brief.ts`)
- New agent: **Placement DNA Agent** (`src/lib/agents/placement-dna.ts`)
- New agent: **Blueprint Agent** (`src/lib/agents/blueprint.ts`)
- New agent: **Production Template Agent** (`src/lib/agents/production-template.ts`)
- New agent: **Package Builder Agent** (`src/lib/agents/package-builder.ts`)

These are additive; zero existing agents are replaced.

### 3.2 Data flow (layered on existing system)

```
opportunity (EXISTS)
   └─ brief_details (NEW JSONB) ─┐
                                 ▼
                         Sync Brief Agent (NEW)
                                 │ emits structured brief
                                 ▼
                         Placement DNA Agent (NEW)
                                 │ reads historical opportunities/submissions/sync_scores
                                 │ emits format-family heuristics
                                 ▼
                          Blueprint Agent (NEW)
                                 │ writes to song_lab_projects.structure_map (EXTENDED)
                                 ▼
                   Production Template Agent (NEW)
                                 │ writes to song_lab_projects.production_template (NEW JSONB)
                                 ▼
                         Sync Score Agent (EXISTING — UNCHANGED contract,
                                             just receives richer inputs)
                                 ▼
                   [Optional future] Mix/Master Engine (external, audio-engine-dependent)
                                 ▼
                         Package Builder Agent (NEW)
                                 │ assembles deliverables (EXTENDED table)
                                 │ writes alerts if sync package incomplete
                                 ▼
                       /api/songs/:id/package (NEW route)
                                 │ streams ZIP
```

### 3.3 Integration touchpoints (every touch preserves existing code)

| Existing touchpoint | How we integrate without changing it |
|---|---|
| `/api/opportunities/[id]` PUT | Accepts new optional `brief_details` payload; no change to existing fields |
| `/api/songs/[id]/sync-score` POST | Can now optionally include `brief_id` in body; if present, agent reads the brief for context. Old calls keep working. |
| `opportunity_matches` | Unchanged. `fit_score` now benefits from brief context when present. |
| `agent_logs` | Five new `agent_type` values: `sync_brief`, `placement_dna`, `blueprint`, `production_template`, `package_builder` |
| Command Center | New section reads from existing data + new JSONB fields. No existing widget touched. |

### 3.4 Minimum migration required (for the Sync layer, no audio engine)

```sql
-- Opportunities: add sync brief sub-record
alter table opportunities
  add column brief_details jsonb,
  add column placement_dna_cache jsonb,
  add column placement_dna_cached_at timestamptz;

-- Song Lab: extend to blueprint + template
alter table song_lab_projects
  add column mode text check (mode in ('release','sync_instrumental','sync_vocal','hybrid')),
  add column structure_map jsonb,
  add column edit_points jsonb,
  add column dynamic_arc jsonb,
  add column hook_map jsonb,
  add column ending_type text,
  add column production_template jsonb,
  add column sync_score_estimate numeric(5,2),
  add column release_score_estimate numeric(5,2);

-- Song Metadata: sync-critical fields
alter table song_metadata
  add column scene_tags text[],
  add column dialogue_safe_score numeric(4,3),
  add column cutdown_points jsonb,
  add column loop_points jsonb,
  add column instrumental_available boolean default false,
  add column tv_mix_available boolean default false;

-- Sync Scores: expose confidence
alter table sync_scores
  add column confidence numeric(5,4);

-- Deliverables: audio artifact subtyping
alter table deliverables
  add column artifact_type text,
  add column song_id uuid references songs(id) on delete set null,
  add column lufs_target numeric(6,2),
  add column true_peak_target numeric(6,2),
  add column qc_passed boolean default false;

-- Agent logs: no migration needed; agent_type is text
```

One migration file: `supabase/migrations/00008_sync_production_layer.sql`. All columns nullable. Zero breaking changes.

### 3.5 API additions (additive only)

| New route | Purpose |
|---|---|
| `POST /api/agents/sync-brief` | Structure a free-text opportunity description into `brief_details` |
| `POST /api/agents/placement-dna` | Compute + cache heuristics for an opportunity's format family |
| `POST /api/agents/blueprint` | Generate a blueprint into `song_lab_projects` |
| `POST /api/agents/production-template` | Generate a template into `song_lab_projects.production_template` |
| `POST /api/agents/package-builder` | Build deliverable set + sync package checklist |
| `GET /api/songs/:id/package` | Stream ZIP of all artifacts + metadata + one-sheet |

All existing routes untouched.

---

## 4. MIX / MASTER ENGINE UPGRADE (honest scoping)

### 4.1 Reality

There is **no audio engine today.** A real mix/master engine means:
- Worker infrastructure (not Next.js request handler)
- FFmpeg in a worker/container
- Object storage read/write with signed URLs (Supabase storage exists)
- Matchering or similar for reference-based mastering
- A render job schema + queue
- LUFS/true-peak/phase measurement
- A preset library

This is 2–3 months of engineering, not a weekend. **Do not ship half of it.**

### 4.2 Three-stage path

**Stage 0 (this PR cycle): Metadata-only "Master Readiness" surface**
No audio processing. Just:
- `sync_submission_ready` computed flag on every song
- Sync package checklist UI (uses existing splits + registrations + metadata)
- Deliverables upgraded with `artifact_type` so users manually upload masters/stems/TV mixes/cutdowns
- QC checklist = metadata + splits + artifact presence (NOT audio analysis)

Ships in days. Zero audio code. Solves 80% of sync-submission pain.

**Stage 1 (future): Upload-side audio analysis (passive)**
- Add Supabase Edge Function that runs FFmpeg loudnorm on upload
- Measures LUFS + true peak + duration
- Populates `sync_scores` with real audio metrics
- No mastering yet, just measurement
- Ships in ~2 weeks behind feature flag

**Stage 2 (future): Reference-based mastering (active)**
- Worker (Vercel background function or separate Node service) running Matchering
- Render jobs queued via new `jobs` table
- Dual-branch output (sync + release)
- Deliverables populated automatically
- QC pass/fail on measured LUFS/true-peak vs. target
- Ships in ~6–8 weeks

**Stage 3 (optional moat): Signature Sound Profiles + template library**
- Only after Stages 0–2 are validated
- Premium tier

### 4.3 What to build now vs. defer

| Component | Build now (Stage 0)? | Why |
|---|---|---|
| `artifact_type` on deliverables | ✅ Yes | Pure ALTER, unblocks sync packages |
| Upload UI for masters/stems/TV mix/cutdowns | ✅ Yes | Reuses existing file upload pattern |
| Sync package checklist UI | ✅ Yes | Pure UI on existing data |
| `<ConfidencePill>` + surface on sync scores | ✅ Yes | 1-day win |
| FFmpeg in an Edge Function | ⏸ Stage 1 | Needs infra commitment |
| Matchering worker | ⏸ Stage 2 | Needs separate service |
| Dual-branch rendering | ⏸ Stage 2 | Depends on Stage 2 |
| Preset library schema | ⏸ Stage 2 | Only meaningful with audio engine |
| Signature Sound Profiles | ⏸ Stage 3 | Premium moat |

**Conclusion:** the "Mix/Master upgrade" for the next ship is **metadata + artifact management + readiness surfacing**, not DSP. Do not promise audio processing until Stage 2 lands.

---

## 5. UI ENHANCEMENT PLAN (not redesign)

### 5.1 What to preserve

- Every existing page layout and nav structure
- shadcn component usage (button, input, card, tabs, dialog, etc.)
- Recharts for financial/health charts
- `MotionCard`, `GlowCard`, `GlowDot`, `AnimatedNumber` primitives
- Sidebar + Topbar + AI assistant floating widget
- Kanban board for pipeline
- Radar chart on sync scores
- shadcn toast (sonner)

### 5.2 What to enhance (additive)

| Enhancement | Where | Effort |
|---|---|---|
| `<ConfidencePill score={0.87} />` | New primitive → surface on: sync scores, orchestrator actions, opportunity matches, health metrics | Small |
| `<AmbientOrbs />` + `<Scanline />` background | Dashboard layout (once) | Small |
| `<SyncReadinessMeter song={...} />` | Song vault card + song detail page | Medium |
| `<SyncPackageChecklist opportunityId={...} />` | Opportunity detail page | Medium |
| `<StageIndicator current="mix" stages={[...]} />` | Song detail + future Current Record widget | Small |
| Command Center v2 sections | `/command-center` only | Medium (per `UPGRADE_SPEC.md`) |
| Human-review banner | Dashboard layout; only renders when `alerts` has `alert_type='review_required'` | Small |

### 5.3 What NOT to touch

- Financial pages (`/money/*`) — leave fully alone
- Business pages (`/business/*`) — fully mature, no UX pain
- Settings, Learn, Daily, Ideas — functional, not bottlenecks
- Kanban pipeline — working well
- Submissions table — working well

### 5.4 Premium feel upgrades (zero-risk)

1. Add ambient red/cyan orb gradients to dashboard shell (copy from `frvr-sounds-presentation/index.html`)
2. Add a thin animated scanline at the top of the viewport
3. Stagger reveals on scroll using Framer Motion (already installed)
4. Confidence pill everywhere AI decides
5. Replace generic "Welcome Back" with Focus Bar
6. Loading states always name what they're loading (no orphan spinners)

---

## 6. DATABASE EXTENSION PLAN

One migration file covers Stage 0. Later stages add their own.

### 6.1 `supabase/migrations/00008_sync_production_layer.sql`

See Section 3.4 above for the full SQL. Summary:
- 3 new columns on `opportunities`
- 9 new columns on `song_lab_projects`
- 6 new columns on `song_metadata`
- 1 new column on `sync_scores`
- 4 new columns on `deliverables`

**Zero new tables. Zero column renames. All additions nullable or defaulted.** Fully reversible via `DROP COLUMN` if ever needed.

### 6.2 `supabase/migrations/00009_jobs_queue.sql` (when Stage 1 ships)

```sql
create table jobs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  job_type text not null,
  status text not null default 'queued' check (status in ('queued','running','completed','failed','cancelled')),
  payload jsonb not null default '{}'::jsonb,
  result jsonb,
  confidence numeric(5,4),
  error_message text,
  attempts integer default 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now()
);
create index idx_jobs_status on jobs(status);
create index idx_jobs_profile on jobs(profile_id);
```

RLS: profile owns its jobs.

### 6.3 `supabase/migrations/00010_audio_branches.sql` (when Stage 2 ships)

Adds `song_branches` (sync + release) and `audio_analysis` tables. Details deferred.

---

## 7. AI AGENT UPGRADE MAP

### 7.1 Existing agents — preserve + light enhancement

| Agent | File | Change |
|---|---|---|
| Orchestrator | `orchestrator.ts` | Add `confidence` to each priority action; read new JSONB fields to enrich context |
| Sync Score Agent | `sync-engine.ts` | Add `confidence` to response; optionally accept `brief_id` and `placement_dna` for richer scoring |
| Health Monitor | `health-monitor.ts` | Include sync package readiness in completeness calculation |
| LLC Agent | `llc-agent.ts` | No change |
| Business Manager | `business-manager.ts` | No change |
| Market Intel | `market-intel.ts` | Feed on real `opportunities.brief_details` data |
| Catalog Marketing | `catalog-marketing.ts` | No change |
| Royalty Scanner | `royalty-scanner.ts` | No change |

### 7.2 New agents — only where no overlap

| New agent | File | Responsibility |
|---|---|---|
| Sync Brief Agent | `src/lib/agents/sync-brief.ts` | Parse free-text opportunity into structured brief (format family, mood, dialogue-safe, cutdowns, lyric policy) |
| Placement DNA Agent | `src/lib/agents/placement-dna.ts` | From historical `opportunities` + `submissions` + `sync_scores`, emit format-family heuristics (BPM band, intro max, impact point, density). Cache into `opportunities.placement_dna_cache`. |
| Blueprint Agent | `src/lib/agents/blueprint.ts` | Emit structure_map + edit_points + dynamic_arc + hook_map into `song_lab_projects` |
| Production Template Agent | `src/lib/agents/production-template.ts` | Emit production template JSONB (buses, routing, instrumentation, transitions, mix style) |
| Package Builder Agent | `src/lib/agents/package-builder.ts` | Verify deliverables + metadata + splits are complete; produce package checklist + blockers list; write alerts if gaps |

**Agents we do NOT create (would duplicate):**
- ❌ "Metadata Agent" — metadata writes happen in the UI/form; doesn't need a dedicated agent
- ❌ "Intake Agent" — opportunity creation is a form, not an LLM call
- ❌ "QC Agent" for audio — defer until audio engine exists
- ❌ "Signature Sound Agent" — defer to Stage 3
- ❌ "Routing Agent" (FRVR/Nite Room) — deferred; no integration exists yet

### 7.3 Agent contract (enforce on every agent)

All agents must return:
```ts
interface AgentResult<T> {
  data: T;
  confidence: number;         // 0-1, REQUIRED
  reasoning: string;          // one-paragraph
  model_used: string;         // e.g. "claude-sonnet-4-20250514"
  tokens_used: number;
  duration_ms: number;
}
```

Low-confidence (< 0.70) results write an `alerts` row with `alert_type='review_required'`. The Command Center v2 human-review panel reads from there.

---

## 8. UPDATED SYSTEM ARCHITECTURE

### 8.1 Layered architecture (after Stage 0)

```
┌─────────────────────────────────────────────────────────────┐
│ PRESENTATION                                                │
│ Next.js App Router · shadcn · Framer Motion · Recharts     │
│ New: Focus Bar · Spine · ConfidencePill · ReadinessMeter   │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────┐
│ API (Next.js route handlers)                                │
│ Existing 40+ routes untouched · 6 new agent routes          │
│ New: /api/songs/:id/package · /api/agents/sync-brief ...    │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────┐
│ AI AGENT LAYER                                              │
│ 8 existing agents + 5 new · unified AgentResult<T> contract │
│ All logged to agent_logs · confidence-scored                │
│ LLM provider: Claude (default) / GPT-4o-mini (fallback)     │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────┐
│ DATA (Supabase / Postgres)                                  │
│ 50+ existing tables preserved · Stage 0 adds columns only   │
│ RLS everywhere · storage buckets: audio-files, stems        │
└─────────────────────────────────────────────────────────────┘

        [Deferred — Stage 1+]
        ┌──────────────────────────────────┐
        │ AUDIO WORKER (Stage 1–2)         │
        │ FFmpeg analysis on upload        │
        │ Matchering mastering jobs        │
        │ Queued via new `jobs` table      │
        └──────────────────────────────────┘
```

### 8.2 Product spine (user-facing)

```
OPPORTUNITY (existing)
   └─ Sync Brief (new sub-record)
         └─ Placement DNA (new cache)
              └─ Blueprint (extends song_lab_projects)
                   └─ Production Template (extends song_lab_projects)
                        └─ [Audio finishing — Stage 2]
                             └─ Deliverables (extends deliverables)
                                  └─ Sync Package (new UI on existing data)
                                       └─ Submission (existing)
```

---

## 9. USER FLOW — BEFORE vs AFTER

### 9.1 Before (today)

1. User creates opportunity from free-text email
2. User manually tags genre/mood on opportunity
3. User clicks "match songs" → AI suggests songs
4. User picks a song, creates a submission
5. User uploads masters/stems elsewhere (out of band)
6. User tracks submission status on `/submissions`
7. User has no sync-readiness signal on the catalog
8. User has no dual-branch concept
9. User has no package / cutdowns / alt versions tracked in-app

### 9.2 After (Stage 0)

1. User pastes opportunity email → **Sync Brief Agent** structures it into `brief_details`
2. **Placement DNA Agent** caches format-family heuristics
3. Existing AI match runs, now richer, returns with **confidence pills**
4. User picks a song → **Sync Readiness Meter** shows blockers (splits? metadata? artifacts?)
5. User uploads missing artifacts (master / TV mix / instrumental / cutdowns) with `artifact_type`
6. **Package Builder Agent** assembles checklist, flags remaining blockers, writes alerts
7. Command Center v2 Spine shows: INTELLIGENCE (briefs) → CREATION (blueprints) → FINISHING (uploads + qc) → DELIVERY (packages) → ECOSYSTEM (pipeline)
8. User hits "Download Package ZIP" → `/api/songs/:id/package` streams all artifacts + metadata + one-sheet
9. Submission is created with package attached
10. Low-confidence AI calls route to human review queue visible in the sidebar

### 9.3 After (Stage 2, optional future)

Adds: automatic audio analysis on upload, automatic dual-branch rendering, automatic QC pass/fail, automatic cutdown generation. Same UI spine; the audio just stops being manual.

---

## 10. DEVELOPER IMPLEMENTATION ROADMAP

Prioritized. Each sprint is 1–2 weeks for a single developer.

### Sprint 1 — Confidence + Readiness (pure UI + small migration)
- Add `confidence` column to `sync_scores`, update Sync Score Agent to emit it
- Build `<ConfidencePill>` primitive in `src/components/ui/motion.tsx`
- Surface pill on: sync scores, orchestrator priority actions, opportunity matches
- Migration `00008` (columns only, no new tables)
- Extend every existing agent response to include `confidence`
- **Ship.** Zero risk.

### Sprint 2 — Sync Package Readiness (metadata-only)
- Build `<SyncReadinessMeter>` — reads splits/registrations/metadata/artifacts
- Build `<SyncPackageChecklist>` — on opportunity detail page
- UI for uploading artifacts with `artifact_type` selection
- Extend `/api/deliverables` to accept audio artifact uploads tied to a `song_id`
- **Ship.** Still zero audio processing.

### Sprint 3 — Sync Brief + Placement DNA agents
- Build `src/lib/agents/sync-brief.ts`
- Build `src/lib/agents/placement-dna.ts`
- New routes `/api/agents/sync-brief`, `/api/agents/placement-dna`
- Opportunity detail page gets a "Structure this brief" CTA
- **Ship.** Additive only.

### Sprint 4 — Blueprint + Production Template agents
- Build `src/lib/agents/blueprint.ts`, `src/lib/agents/production-template.ts`
- Extend Song Lab project detail page with Blueprint + Template tabs
- New routes `/api/agents/blueprint`, `/api/agents/production-template`
- **Ship.**

### Sprint 5 — Package Builder + Download ZIP
- Build `src/lib/agents/package-builder.ts`
- Route `/api/songs/:id/package` (streams ZIP using archiver or similar; pulls from Supabase storage)
- Package Readiness widget on Command Center
- **Ship.** Sync submission workflow now complete end-to-end.

### Sprint 6 — Command Center v2
- PRs 1–10 from `UPGRADE_SPEC.md` Part 7
- All feature-flagged behind `NEXT_PUBLIC_V2_COMMAND_CENTER`
- **Ship.** v1 still available via flag-off.

### Sprint 7 — Human Review Queue
- New `alert_type='review_required'`
- Sidebar badge + dashboard panel
- Trigger: any agent confidence < 0.70 writes an alert
- Override UI: user can approve/reject/retry
- **Ship.**

### Sprint 8 — Job queue infrastructure
- Migration `00009_jobs_queue.sql`
- Vercel Cron or Supabase Edge Function worker
- Refactor long-running agents to enqueue jobs instead of blocking the request
- **Ship.** Unblocks Stages 1–2.

### Sprint 9+ — Stage 1: audio analysis on upload (FFmpeg)
- Supabase Edge Function with FFmpeg binary
- On upload, measure LUFS + true peak + duration + stream info
- Write to `sync_scores` + `deliverables.qc_passed`
- **Ship behind flag.**

### Sprint 11+ — Stage 2: Matchering mastering
- Separate Node service or Vercel background function
- Matchering integration
- Dual-branch rendering (sync + release profiles)
- New tables: `song_branches`, `audio_analysis`
- Signature Sound Profiles schema (Stage 3 moat)
- **Ship behind flag.**

---

## FINAL OBJECTIVE — restated with honesty

After this plan, FRVR Sounds will be:

- **More powerful** — sync packaging end-to-end, not just tracking
- **More intelligent** — 5 new agents adding brief structuring, placement DNA, blueprints, templates, package validation
- **More premium** — confidence everywhere, Command Center v2, readiness meters, ambient motion
- **More automated** — human-review queue, job queue foundation, cached placement heuristics
- **NOT completely different** — every existing route, table, and component continues to work

What this plan does **not** promise:
- Audio processing in Stage 0. It's Stage 2+.
- Rebuilding anything that works. Financial OS, business setup, pipeline, submissions, learn, ideas — untouched.
- Deleting `page.backup.tsx` or any existing migration.

**Build Stage 0 first. Validate. Then commit to audio engineering.**
