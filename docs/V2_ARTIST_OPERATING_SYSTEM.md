# FRVR Sounds V2 — Artist Operating System

> **Status:** Spec. Not yet implemented. V1 stays live behind feature flag `journey_v2 = false`.
> **Captured:** 2026-05-01
> **V1 reference (do not modify):** [V1_LEGACY_BRAND_JOURNEY.md](./V1_LEGACY_BRAND_JOURNEY.md)
> **Adjacent spec (different scope — Command Center UI):** [src/app/(dashboard)/command-center/EVOLUTION_PLAN.md](../src/app/(dashboard)/command-center/EVOLUTION_PLAN.md)

---

## 1. Legacy System (V1 Snapshot)

Frozen reference: [V1_LEGACY_BRAND_JOURNEY.md](./V1_LEGACY_BRAND_JOURNEY.md)

| Element | V1 |
|---|---|
| Modules | 7 (Identity → Routes) |
| Questions | 32 |
| Output | A populated Brand Wiki (description) |
| AI | Director's Notes (refine), Director's read (critique), Bio summarizer |
| Activation | All modules ≥80% → unlocks 11 isolated tools |
| Tiers | starter / pro / studio / internal |
| Loop | None — once filled, sits static |
| Revenue layer | Sync formats list only (passive routing) |

V1's flaw: identity is captured but **never operationalized**. The wiki is a document, not a machine.

---

## 2. Upgraded System Overview

V2 turns the wiki into an **engine that produces work**. Three structural shifts:

1. **Wiki → Engine.** Each module gains an Output Layer that converts answers into artifacts (hooks, scripts, calendar slots).
2. **Static → Looping.** A weekly Feedback Loop ingests performance and rewrites the audience + emotional model.
3. **Identity → Revenue.** Routes is rebuilt as a revenue ladder; every content piece routes to a tier of that ladder.

Activation no longer "unlocks tools." It unlocks one screen — the **Weekly Execution Dashboard** — which is where the artist lives from that point forward.

Tiers are renamed and given experiential difference, not just feature lists: **🎧 Signal**, **🔊 Frequency**, **🌍 Broadcast**.

V1 stays intact behind the `journey_v2` feature flag. Both module sets coexist in `src/lib/brand/modules.ts` exporting `MODULES_V1` and `MODULES_V2`.

---

## 3. Full Module Breakdown (1–8)

Every V1 question is preserved (no rephrasing without functional value). New questions are added only where they unlock an output. Every module gains an **Output Layer** — what the module **produces**, not just captures.

### Module 1 — Identity *(V1 questions 1–5 retained)*
**New Output Layer (`module_outputs.identity`):**
- **Content Pillars (3, derived).** From `key_themes` + `core_beliefs` → Director generates 3 content pillars, each with name + angle + sample post format. User edits/locks 3.
- **Origin-moment script template.** Auto-fills from `origin_story` into a 45-sec video script (hook → moment → reveal → CTA).
- **Belief-driven hook seeds (5).** From `core_beliefs` → 5 contrarian hooks ("90% of artists in [lane] do X. Here's why I refuse to.").

**New question (1 added):**
- `identity.public_truth` — *"What's a belief you hold that costs you fans? (We'll turn it into a content pillar.)"* — feeds the contrarian hook generator.

### Module 2 — Emotional Signature *(V1 questions 6–9 retained)*
**New Output Layer (`module_outputs.emotional`):**
- **Emotional Hook Bank (10).** Director maps each `desired_emotion` × `emotional_tag` cross-product into 10 platform-agnostic hooks, tagged by emotion.
- **Caption starters (per emotion).** 3 caption openings per desired emotion, used inline by content tools.
- **Mood-to-format map.** Tense moods → tension/cliffhanger formats; intimate moods → confessional formats; etc. Drives Module 8 format selection.

### Module 3 — Positioning + Niche Domination *(V1 questions 10–14 retained, layer added)*
**New questions (4 added — Niche Domination Layer):**
- `niche.micro_statement` — *"State your micro-niche in ≤8 words. Genre + audience + outcome only."*
- `niche.competitors` — Repeater (3–5 rows): name + URL + their dominant move + their weak spot. Director can pre-populate from positioning.
- `niche.gap` — *"What is no one in your lane doing — that you would?"* (textarea, 60+ chars, must contain a verb)
- `niche.ownable_territory` — Templated: *"I am the only artist who [X] for [Y] in [Z]."*

**New Output Layer (`module_outputs.positioning`):**
- **"Vs." video angle library.** One angle per competitor in `niche.competitors`.
- **Niche-statement post template.** A pinned-post-ready version of `niche.ownable_territory`.

### Module 4 — Audience *(V1 questions 15–19 retained)*
**New Output Layer (`module_outputs.audience`):**
- **Pain-point content prompts (3 per pain).** Each `audience_pain_points` entry → 3 content angles that resolve the pain.
- **Lifestyle slot calendar.** From `audience_lifestyle_context` → suggested post times (e.g. "5am run" → Tue/Thu 6am content slots).
- **Segment-aware hook variants.** Same hook, rewritten for primary audience and (Broadcast tier only) secondary segments.

### Module 5 — Visual DNA *(V1 questions 20–24 retained)*
**New Output Layer (`module_outputs.visual`):**
- **Post layout templates (3).** Square / portrait / reel cover, locked to palette + typography.
- **Cover-art prompt strings.** Pre-formatted prompts for image-gen tools using texture + palette + mood vocab.
- **Reels visual-treatment spec.** "Color grade, transition style, B-roll texture set" — fed into Module 8 format library.

### Module 6 — Sound DNA *(V1 questions 25–29 retained)*
**New Output Layer (`module_outputs.sonic`):**
- **BTS format library (4).** Reference-deconstruction reel, sound-design reaction, BPM/key reveal, "what to borrow" breakdown — each pre-templated using the artist's references.
- **Producer-reaction script.** Auto-fills the artist's `reference_tracks[].why_borrow` into a 60-sec voiceover.

### Module 7 — Routes → Revenue System *(UPGRADED)*

V1's three sync questions are kept. Around them is built a revenue spine.

**New questions (5 added):**
- `revenue.primary_path` — Single-select: Sync / Streaming / Direct fan (D2C) / Publishing / Live / Production-for-hire.
- `revenue.secondary_paths` — Multi-select (max 2).
- `revenue.offer_100` — *"What can you sell to your first 100 real fans? (≤$50)"*
- `revenue.offer_1k` — *"What's your $50–$500 product when you have 1,000 fans?"*
- `revenue.offer_10k` — *"What's your $500+ tier at 10,000 fans?"*

**New Output Layer (`module_outputs.revenue`):**
- **Offer Ladder card.** Three-tier visual (100 → 1k → 10k) with price, format, and the content type that converts to it.
- **Content → Revenue map.** A matrix: each content pillar × revenue path × CTA. E.g. *"BTS pillar × Direct-fan path → drives Patreon at 100-fan tier."*
- **Pitch templates per route.** Sync supervisor pitch, library submission cover, D2C fan-funnel email — all pre-filled with brand voice.

### Module 8 — Content Engine *(NEW)*

The execution layer. Six sub-sections, each producing a stored artifact.

| § | Field | Type | Saves to |
|---|---|---|---|
| 8.1 | **Content Pillars (locked)** — confirm/edit the 3 from Module 1 | Repeater(3) | `content_pillars` |
| 8.2 | **Repeatable Formats (5)** — each: name, structure, time-to-produce, pillar mapping | Repeater(5) | `content_formats` |
| 8.3 | **Platform Mapping** — primary platform + 2 secondary; format-to-platform matrix | Multi-select + matrix | `platform_strategy` |
| 8.4 | **Weekly Cadence** — slots-per-week per platform; batch day; ship days | Calendar grid | `weekly_cadence` |
| 8.5 | **Hook Library (10)** — 10 reusable hook templates, each tagged with pillar + emotion | Repeater(10) | `hook_library` |
| 8.6 | **Conversion Path** — fan stages: Stranger → Listener → Follower → Subscriber → Buyer; one CTA per stage | Stage editor | `conversion_path` |

**New Output Layer (`module_outputs.engine`):**
- **Week-1 calendar (auto-generated).** Director fills the cadence with concrete pieces for the next 7 days using all prior modules' outputs.
- **Hook → format → pillar → CTA bundles.** Pre-stitched units ready to ship.

---

## 4. New Systems Added

### 4.1 Content Fit Scoring System

Each piece of content (draft, post, script) receives 4 sub-scores before it can be shipped from the dashboard.

| Dimension | What it measures | Source signal |
|---|---|---|
| **Identity Match** | Does it carry `core_pain` / `core_beliefs` / `key_themes`? | Cosine sim on embeddings + Director rubric |
| **Emotional Accuracy** | Does the dominant emotion match `desired_emotions`? | Director-classified emotion → wiki match |
| **Audience Relevance** | Does it resolve `audience_pain_points` or address `audience_desires`? | Director rubric |
| **Platform Fit** | Does it match the conventions of its target platform? | Format spec lookup + length/aspect/hook-position check |

- Each: 0.0–1.0
- **Total = mean.** Threshold logic: `< 0.75 → "revise" state`; auto-attaches a Director suggestion per failing dimension. `≥ 0.75 → "ship-ready"`. `≥ 0.90 → "anchor piece"` (auto-pin to pillar feed).
- API: `POST /api/content/score` → returns `{ identity_match, emotional_accuracy, audience_relevance, platform_fit, total, flags[], suggestions[] }`
- Storage: `content_pieces.fit_score` (JSONB) + `content_pieces.fit_status` (enum).

### 4.2 Feedback Loop System (Weekly)

Runs every Monday 6am artist-local time via a scheduled job.

**Inputs:**
- Manual entry (Signal/Frequency tier): per-piece — views, saves, replies, sends, follows-from, sales attributed.
- Platform connectors (Broadcast tier): IG/TikTok/YT/Spotify API ingestion.

**Process:**
1. Score every piece shipped in the last 7 days.
2. Cluster by pillar / emotion / format → compute lift.
3. Compare predicted Fit Score vs. actual performance → produce **calibration delta**.
4. Update `audience_model` (which pains converted, which didn't) and `emotional_model` (which desired emotions actually moved fans).
5. Recommend next-week pillar weight shifts and format reallocation.

**Output (delivered as Monday digest):**
- Top 1 signal: "Pillar A is +47% over baseline; double its slots."
- Top 1 anti-signal: "The contrarian hook tested below threshold 4 weeks running; retire or rework."
- 1 model update applied (with revert button).

Storage: `feedback_runs` table (`run_id`, `artist_id`, `period_start`, `period_end`, `signals` JSONB, `model_diff` JSONB, `applied`, `created_at`).

### 4.3 Niche Domination Layer
*(See Module 3 above — system-level: it's a separate `niche` JSONB column on `brand_wiki` driving Director's "Make more niche" mode and a public "Niche Map" reward visualization.)*

### 4.4 Consistency System

Three artifacts, all stored on `brand_wiki`:

| Artifact | Content |
|---|---|
| **MVP Posting Plan** | The smallest plan you can sustain in a bad week. e.g. "1 reel + 1 carousel + 1 story Mon/Wed/Fri." Generated from `weekly_cadence` × tier defaults. |
| **Batching Strategy** | Single batch day, ordered checklist (script → record → edit → caption → schedule), time-boxed. |
| **Sustainability Constraints** | Max hours/week (artist sets); auto-shrinks calendar if exceeded. Hard rule: no week may exceed the cap; Director down-shifts to MVP plan. |

A **Streak object** tracks days where the MVP plan was met. Breaking the streak does NOT punish — it triggers a Director's-Notes "what changed?" check-in.

### 4.5 Director AI — Expanded Modes

V1 modes kept. V2 adds:

| Mode | Input | Output | Tier gate |
|---|---|---|---|
| `make_more_viral` | A draft + the wiki | Re-written with stronger hook, tension increase, payoff clarity. Returns viral-likelihood delta. | Frequency+ |
| `make_more_niche` | A draft + `niche` block | Strips broad appeal, injects insider language, sharpens to micro-niche. Returns niche-fit delta. | Frequency+ |
| `increase_emotional_clarity` | A draft + `desired_emotions` | Anchors to a single dominant emotion, removes emotional noise. Returns emotional-accuracy delta. | All tiers |
| `multiply_post` | A single piece | Returns 3–5 platform variants (Reel, carousel, X post, YT short, newsletter snippet) — each pre-formatted to platform conventions. | Frequency+ |

All modes route through `/api/agents/brand-director` with new `mode` enum values. Each costs 1 agent_run from quota.

### 4.6 Routes → Revenue System
*(Detailed in Module 7 above. System-level: introduces `offer_ladder` and `content_revenue_map` as first-class wiki objects consulted by every output generator.)*

---

## 5. Tier System (Signal / Frequency / Broadcast)

Internal `plan_id` values stay (`starter`, `pro`, `studio`) for billing continuity; **display names change** to Signal / Frequency / Broadcast. Add `internal` as before.

### 🎧 Signal *(replaces starter)*
**Posture:** "We tell you what to do."
- Modules served as a **simplified 3-question version per module** (highest-leverage Q only) to lower the activation floor.
- Output Layers run in **template-only mode**: pre-filled artifacts the user edits, no generative AI calls beyond the hook bank.
- Director AI: critique + bio summarizer only. No `make_more_viral`, no `multiply_post`.
- Content Engine: read-only template gallery — user copies, doesn't generate.
- Feedback Loop: weekly digest based on **manual** entry only.
- No Niche Domination Layer; no Offer Ladder beyond `offer_100`.

### 🔊 Frequency *(replaces pro)*
**Posture:** "We run the system with you."
- Full 8-module Brand Journey with all output layers active.
- Content Fit Scoring **on every piece**.
- Director AI: all modes available, capped at quota.
- Content Engine: live calendar generation, hook library actively rotated.
- Feedback Loop: weekly, manual-entry primary, simple platform connector for IG/TikTok.
- Offer Ladder up to `offer_1k`.

### 🌍 Broadcast *(replaces studio)*
**Posture:** "We help you scale and segment."
- Everything in Frequency, plus:
- **Audience segmentation** — multiple `audience_models` per artist (e.g. sync supervisors vs. fans). Each output layer renders per-segment.
- **Campaign Builder** — multi-week campaign object (theme, story arc, asset list, post schedule, milestone metrics).
- **Monetization automations** — offer-ladder triggers (e.g. "fan crosses 1k follow → email the 1k offer").
- Full platform connector suite + ingestion APIs.
- Offer Ladder all three tiers + custom tiers.
- Priority Director queue (lower latency, higher rate cap).

**Tier difference rule:** every tier must feel structurally different in a 5-minute session, not just have a longer feature list.

---

## 6. Activation + Dashboard

### Activation Trigger (changed)
- V1: 7 modules ≥80% → unlocks 11 tools.
- V2: **8 modules ≥80% AND Offer Ladder has at least `offer_100` AND Hook Library has 10 entries** → activates the **Weekly Execution Dashboard** at `/dashboard/execution`.
- V1's 11-tool reward panel becomes a secondary "Catalog" tab on the dashboard.

### Weekly Execution Dashboard

Single screen, four panels. This is the artist's home from activation onward.

| Panel | Content | Backed by |
|---|---|---|
| **Content Calendar** | Current week + next week. Each slot = pillar + format + platform + ship-status. Drag to reschedule. | `weekly_cadence`, `content_pieces` |
| **Hook Generator** | One-click rotates through `hook_library` × current pillar. "Use" button opens the draft editor. | `hook_library`, Director `multiply_post` mode |
| **Scoring Panel** | Last 5 shipped pieces with their 4 sub-scores. Anything `<0.75` is highlighted with the failing dimension and the Director's revise suggestion. | `content_pieces.fit_score` |
| **Growth Tracker** | Followers (per platform), completion-rate proxy, fan-ladder counts (Stranger/Listener/Follower/Subscriber/Buyer), revenue line. Sparkline + WoW deltas. | `growth_metrics`, `feedback_runs` |

Top strip: **Streak counter** + **next ship-due** (with a "ship now" CTA).

**Routes:**
- `/dashboard/execution` (page)
- `GET /api/dashboard/execution` (composite endpoint hydrating all 4 panels)

### Database additions (V2)
`brand_wiki` gains: `niche` (JSONB), `module_outputs` (JSONB), `content_pillars` (JSONB), `content_formats` (JSONB), `platform_strategy` (JSONB), `weekly_cadence` (JSONB), `hook_library` (JSONB), `conversion_path` (JSONB), `offer_ladder` (JSONB), `content_revenue_map` (JSONB), `consistency_plan` (JSONB), `audience_models` (JSONB array — Broadcast only).

New tables: `content_pieces`, `feedback_runs`, `growth_metrics`, `streak_log`, `campaigns` (Broadcast only).

Migration sequence: `00029_v2_journey_schema.sql` → `00030_v2_content_pieces.sql` → `00031_v2_feedback_loop.sql` → `00032_v2_dashboard_indexes.sql`.

---

## 7. Behavioral Loops

### 7.1 Onboarding Quiz — 10 Questions, Tier-Determining

Behavioral, not "what's your goal?" Each Q maps to a tier weight; final score selects tier with manual override.

| # | Question | What it actually measures |
|---|---|---|
| 1 | "How many pieces of content did you ship in the last 30 days?" *(0 / 1–4 / 5–15 / 16+)* | Production capacity baseline |
| 2 | "Pick the song you released most recently. What's the link?" | Whether real catalog exists (validates inputs) |
| 3 | "When you posted last, did you check the analytics?" *(Never / Skimmed / Read carefully / Logged it somewhere)* | Feedback-loop readiness |
| 4 | "If a fan DM'd you for merch right now, what would you sell them?" *(Nothing / I'd improvise / I have a link / I have a 3-tier ladder)* | Revenue maturity |
| 5 | "Last 4 weeks — pick the closest: total time spent on artist business?" *(<2hr/wk / 2–5 / 5–15 / 15+)* | Sustainable cadence target |
| 6 | "Drag-rank what you'd give up first if a week fell apart: songwriting / posting / replying to fans / admin." | Revealed priorities — not stated |
| 7 | "Have you ever paid for a sync placement service, distro premium, or PR push?" *(Y/N + freeform)* | Investment readiness |
| 8 | "Show us your last post." *(URL paste)* | Real artifact for Director to score → calibrates difficulty |
| 9 | "Which is closer to you: 'I need to figure out what to make' / 'I know what to make, can't ship consistently' / 'I ship consistently, can't grow'?" | The actual bottleneck |
| 10 | "If we built this for you, what would success look like in 90 days?" *(open)* | Goal calibration — also seeds the streak goal |

**Logic:** Q1 + Q5 + Q9 set the **floor** (you can't be Broadcast if you're shipping 0/wk and have <2hr). Q4 + Q7 set the **ceiling** (no Broadcast offer without an existing offer concept). Q3 + Q8 set **system fit** (manual-entry vs. needs automation). Q2 + Q6 + Q10 are stored as `onboarding_signals` — they don't gate but are read by the Director's first-week prompts. User can override the recommended tier downward at any time, upward only via paywall.

### 7.2 First 5-Minute Experience (Per Tier)

Hard rule: every tier produces a tangible artifact within 5 minutes that the user could ship the same day.

**🎧 Signal — 5-minute output:** the artist answers 3 micro-questions (one from Identity, one from Emotional, one from Audience) → Director returns **1 hook + 1 caption + 1 post format** ready to copy. Streak day 1 starts.

**🔊 Frequency — 5-minute output:** Identity module rapid-fill (skip optional Qs) → Director generates **3 content pillars + week-1 draft calendar** with 3 slots filled. The first piece is auto-scored. Activation goal in view.

**🌍 Broadcast — 5-minute output:** quiz answers + a connector handshake (one platform OAuth) → Director generates **a 30-day campaign skeleton + 3 audience segments seeded from existing followers + offer-ladder draft** populated with the user's existing products if any.

### 7.3 Seven-Day Habit Loop

Designed to be triggered by daily push at the artist's chosen ship-time.

| Day | Action | Insight | Reward |
|---|---|---|---|
| 1 | Pick a hook from your library, write/record, ship. | "Hooks tagged `tense` are scoring +0.18 above your average." | Streak begins. 1 unread Director's-Notes entry on yesterday's piece. |
| 2 | Reply to 5 comments on yesterday's piece using the **Voice Match** mode (Director rewrites in your tone). | Top reply you sent generated +X DMs. | New hook auto-added to library. |
| 3 | Batch-record 2 pieces (Director provides shot list). | Last week's batch saved 47 minutes vs. solo recording. | Slot in week-2 calendar pre-filled. |
| 4 | Score and ship 1 piece. If <0.75, take Director's revise. | "Audience Relevance is your weakest dimension this week." | Pillar weight auto-adjusts on next week's calendar. |
| 5 | Send 1 piece to your fan-funnel (newsletter / Patreon / story link). | "3% of viewers crossed Stranger → Listener; baseline 1.4%." | Offer Ladder progress bar moves. |
| 6 | Lighter day — 1 reshare or "anchor piece" repost. Sustainability check. | "You're at 4.2hr / 5hr cap — pace is healthy." | Streak protected. |
| 7 | **Weekly review** — Feedback Loop digest delivered. Confirm or revert model updates. | Top signal + top anti-signal of the week. | New Director mode unlocked at certain streak milestones (7 days → `multiply_post` mode unlocked at Signal tier as a teaser). |

The loop is **idempotent** — missing a day shrinks the streak but doesn't reset modules or scoring. The Streak object itself is stored to `streak_log` and read by the Dashboard top strip.

---

## 8. Key Product Differences — Before vs After

| Dimension | V1 | V2 |
|---|---|---|
| **Core promise** | "Define your brand." | "Run your artist business." |
| **Modules** | 7 | 8 (adds Content Engine) |
| **Question count** | 32 | 32 retained + ~10 net new (4 Niche, 5 Revenue, 1 Identity public-truth) |
| **Per-module output** | None — answers populate a wiki | Output Layer per module: hooks, scripts, templates, calendar slots |
| **AI modes** | 3 (refine, critique, summarize) | 7 (adds viral, niche, emotional clarity, multiply_post) |
| **Activation reward** | 11 unrelated tool unlocks | Single Weekly Execution Dashboard |
| **Tiers** | starter / pro / studio (feature lists) | Signal / Frequency / Broadcast (structurally different experiences) |
| **Revenue layer** | A list of sync targets | Primary path + offer ladder (100/1k/10k) + content-to-revenue map |
| **Scoring** | Per-question specificity (0–1) | Per-content-piece, 4-dimensional, threshold-gated |
| **Feedback** | None | Weekly loop that mutates audience + emotional model |
| **Niche** | Differentiators question | Niche Domination Layer with competitor evidence + ownable territory |
| **Consistency** | Implicit | MVP plan + batching + sustainability cap, all enforced |
| **Output cadence** | One-time wiki fill | Daily ship + weekly review + monthly campaign (Broadcast) |
| **Onboarding** | Linear question 1 | 10-question behavioral quiz → tier assignment → 5-min produced artifact |
| **Time-to-first-output** | 30+ minutes (must reach 80% to unlock anything) | ≤5 minutes per tier |
| **Failure mode** | Wiki sits unused after fill | Streak break triggers Director check-in; system bends to user, not vice versa |

---

## Implementation Notes (Engineering)

- **Feature flag:** `journey_v2` (boolean per artist). When off, V1 served from same routes — `MODULES_V1` exported alongside `MODULES_V2` in [src/lib/brand/modules.ts](../src/lib/brand/modules.ts).
- **Migrations are additive** — no V1 columns dropped. Revert = flip the flag.
- **Director route** (`/api/agents/brand-director`) gets new `mode` enum values; existing modes untouched.
- **Plan rename** is display-only initially; `plans.ts` `name` field changes, `id` stays. Tier feature-gates added as new `FeatureKey` values: `content_engine`, `content_fit_scoring`, `feedback_loop`, `multi_segment_audience`, `campaign_builder`, `multiply_post_mode`, `make_more_viral_mode`, `make_more_niche_mode`.
- **Weekly Execution Dashboard** is a new route (`/dashboard/execution`); does not replace the existing Command Center page (which has its own [V2 plan](../src/app/(dashboard)/command-center/UPGRADE_SPEC.md)). The two link to each other but are distinct surfaces.
- **Onboarding quiz** is a new route (`/onboarding/quiz`) and a new table `onboarding_responses`. Tier assignment writes to `subscriptions.recommended_plan_id`.

V1 is preserved verbatim. V2 ships behind a flag. Both can run side-by-side until the migration is complete.
