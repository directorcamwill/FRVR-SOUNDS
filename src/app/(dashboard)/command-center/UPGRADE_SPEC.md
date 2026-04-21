# Command Center — Audit + Upgrade Spec (v2)

**Status:** Ready for implementation
**Backup:** `page.backup.tsx` preserves the v1 Command Center.
**Goal:** Transform the Command Center from a generic dashboard into the premium **unified product spine** of FRVR Sounds — Intelligence → Creation → Finishing → Delivery → Ecosystem.

---

## Part 1 — Audit of current Command Center

### What's strong in v1
1. Clean data wiring — one hook per data source, `Promise.all` in `handleRefresh`.
2. Good primitives already in place: `MotionCard`, `GlowCard`, `GlowDot`, `AnimatedNumber`, `Skeleton`.
3. Red/black cinematic palette aligns with the brand spec.
4. Health score with color thresholds (green/amber/red) is the right instinct.
5. Orchestrator POST to `/api/agents` is the right decision pattern — Claude returns structured JSON, page renders it.

### What's weak / duplicated / missing

| # | Issue | Why it matters |
|---|---|---|
| 1 | **No product spine.** The page is 8 disconnected widgets stacked vertically. There is no "single canonical workflow" visible. | Users can't answer "what do I do next?" in one glance. Fails the premium-feel test. |
| 2 | **Four stat cards are low-signal.** "Total Songs = 12" tells you nothing actionable. | Wastes the most valuable real estate on the page. |
| 3 | **Priority Actions and Today's Tasks overlap.** Both are "what to do next" lists. | Duplicated systems. Collapse to one. |
| 4 | **Activity Feed is passive.** Shows past agent runs but offers no affordance to act. | Feels like a log, not a command surface. |
| 5 | **Health Widget is abstract.** "Catalog Completeness 62%" with no "fix this now" path. | Violates the "confidence + one-click path" principle. |
| 6 | **No Sync/Mix/Master layer.** The core product (per your spec) isn't represented on the Command Center at all. | The Command Center should *be* the product spine, not a sibling of it. |
| 7 | **No confidence scores visible.** Claude decisions land without confidence UI. | Kills trust in AI recommendations. |
| 8 | **"Welcome Back" is generic SaaS.** | Every Notion clone has this. |
| 9 | **Pipeline Summary is 2 numbers with no context.** No stage breakdown, no momentum indicator, no next-touch. | Dead weight. |
| 10 | **No canonical project surfaced.** The user has to navigate elsewhere to see "the song I'm working on right now." | Breaks the spine. |
| 11 | **Refresh button is a crutch.** Live data should feel live. | Use SWR or polling with optimistic states. |
| 12 | **No failure / human-review queue visible.** Per your spec, confidence < 0.70 auto-routes to review — that queue has no surface. | Premium products expose their safety nets. |
| 13 | **No "Current Focus" commitment.** The orchestrator returns `focus_area` but it's buried inside the Priority Actions component. | Focus should be the top line of the page. |
| 14 | **No rendering/processing job status.** Long audio jobs happen in a black box. | The product is an audio finishing engine — show the audio. |
| 15 | **Grid is boring.** Two-column `lg:grid-cols-2` repeated three times. | Cinematic product, rectangular dashboard. Mismatch. |

---

## Part 2 — Upgrade principles (non-negotiable)

1. **One spine, five layers.** The Command Center must visually communicate Intelligence → Creation → Finishing → Delivery → Ecosystem — top to bottom.
2. **Focus over volume.** Ship *one* clear next action above the fold, not a wall of widgets.
3. **Confidence visible.** Every AI-driven recommendation shows a confidence score (0–1) with color + plain-language label.
4. **Audio as a first-class citizen.** Current/recent renders, LUFS readouts, QC pass/fail surface directly.
5. **Human-review queue is always visible** when non-empty.
6. **No generic SaaS patterns.** Replace "Welcome Back" with signal. Replace stat cards with the Spine.
7. **Premium motion.** Breathing glows, staggered reveals, ambient red/cyan orbs — match the `frvr-sounds-presentation` aesthetic.
8. **Collapse duplications.** Priority Actions + Today's Tasks → single "Next Moves" stack. Pipeline Summary + Submissions → single "Pipeline Pulse" strip.

---

## Part 3 — New Command Center layout (v2)

```
┌──────────────────────────────────────────────────────────────┐
│  [01] FOCUS BAR                                              │
│  "Your system is focused on: [focus_area]"                   │
│  Confidence: 0.87 · System Active · Last sync 12s ago        │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│  [02] THE SPINE (horizontal, 5 nodes, animated signal line)  │
│  INTELLIGENCE → CREATION → FINISHING → DELIVERY → ECOSYSTEM  │
│  Each node: status dot (green/amber/red) + 1 metric + CTA    │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────┬───────────────────────────────┐
│  [03] NEXT MOVES             │  [04] CURRENT RECORD          │
│  Unified priority + today    │  Active project card          │
│  Each card: confidence,      │  Waveform preview, LUFS,      │
│  one-tap action, dismiss     │  stage, QC status, CTA        │
└──────────────────────────────┴───────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│  [05] FINISHING DECK (horizontal scroll)                     │
│  Cards for in-progress renders: mix, master, stems, sync     │
│  deliverables. Live job status + progress + QC badge.        │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────┬───────────────────────────────┐
│  [06] PIPELINE PULSE         │  [07] HEALTH + HUMAN REVIEW   │
│  Opps by stage + momentum    │  6-metric radar + review queue│
│  Next-touch list             │  (only shown if queue > 0)    │
└──────────────────────────────┴───────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│  [08] RECENT ACTIVITY (condensed, collapsible)               │
│  Agent run log — ambient, not central                        │
└──────────────────────────────────────────────────────────────┘
```

---

## Part 4 — Section specs (component-by-component)

### [01] FOCUS BAR
**Replaces:** Welcome Back banner
**Props:** `focus_area: string`, `confidence: number`, `last_sync_at: Date`
**Visual:**
- Full-width panel, 64px tall
- Left: bold white "Focused on: {focus_area}" (18px, tracking-tight)
- Right: confidence pill (color by threshold) + pulsing green dot + relative time
- Ambient red gradient wash, 5% opacity, left-to-right

**Data:** `/api/agents` → `focus_area` (already returned)

### [02] THE SPINE
**New component.** The signature visual of the v2 Command Center.
**Layout:** 5 nodes on a horizontal animated signal line (reuse `.signal-line` / `.signal-dot` from the presentation CSS).

| Node | Metric | CTA | Route |
|---|---|---|---|
| INTELLIGENCE | Active briefs | "Review briefs" | `/intelligence` |
| CREATION | Songs in blueprint | "Open Song Lab" | `/song-lab` |
| FINISHING | Jobs running | "View renders" | `/deliverables` |
| DELIVERY | Packages ready | "Ship package" | `/submissions` |
| ECOSYSTEM | Opps in pipeline | "See pipeline" | `/pipeline` |

**Each node:**
- 96px circle, red-glow if active, chrome if idle
- Status dot top-right (green/amber/red)
- Label above, metric below (animated number)
- On hover: scale 1.05 + border glow
- On click: route

**New API:** `/api/spine` returns `{ intelligence: {count, status}, creation: {...}, ... }`

### [03] NEXT MOVES
**Replaces:** PriorityActions + Today's Tasks (unified)
**Props:** `moves: Move[]`
**Move shape:**
```ts
interface Move {
  id: string
  title: string
  description: string
  urgency: "high" | "medium" | "low"
  confidence: number  // 0-1
  category: "intelligence" | "creation" | "finishing" | "delivery" | "ecosystem"
  action_url: string
  source: "orchestrator" | "task" | "review_queue"
}
```

**Each card:**
- Category stripe left edge (color-coded to spine)
- Urgency badge top-right
- Confidence score bottom-right with bar
- One primary CTA, dismiss on hover-reveal
- Max 5 visible, "See all" expands

**New API:** `/api/next-moves` merges orchestrator priority_actions + today's tasks + review queue, deduped + sorted by urgency × confidence.

### [04] CURRENT RECORD
**New component.** The "song I'm working on right now."
**Data:** Last-touched project from `/api/songs?last_touched=true&limit=1`
**Visual:**
- Large card, 420px tall
- Top: song title + artist
- Waveform preview (use wavesurfer.js or canvas)
- Metrics strip: BPM · Key · LUFS · True Peak · QC status badge
- Stage indicator: Brief → Blueprint → Mix → Master → QC → Deliver (current step highlighted)
- CTA: "Continue" routes to song-lab for that song

### [05] FINISHING DECK
**New component.** Horizontal-scroll card deck showing in-progress audio jobs.
**Data:** `/api/processing-jobs?status=running,queued`
**Each card:**
- Job type icon (mix / master / stems / cutdown / qc)
- Song title
- Progress bar (poll every 2s while visible)
- ETA
- Cancel + View buttons

**Empty state:** "No renders running. Start a new mix →" links to song-lab.

### [06] PIPELINE PULSE
**Replaces:** Pipeline Summary
**Visual:**
- Horizontal stage bar: Lead → Qualified → Briefed → Submitted → Negotiating → Won
- Each stage shows count + 7-day delta arrow (↑ ↓ →)
- Below: top 3 opportunities by next-touch-due

**Data:** `/api/opportunities?group_by=stage&include_momentum=true`

### [07] HEALTH + HUMAN REVIEW
**Layout:** Split card.
**Top half:** Radar chart (6 metrics from current Health Widget) — use recharts
**Bottom half:** Human-review queue
- Only rendered if `review_queue.length > 0`
- Each item: project title, issue type, confidence, "Review" CTA → opens modal

**New API:** `/api/review-queue` returns projects with confidence < 0.70 or explicit QC fail.

### [08] RECENT ACTIVITY
**Keep:** ActivityFeed component, but:
- Collapsible (collapsed by default, expands to 20 items)
- Remove from main grid, place at bottom as ambient info
- Add filter chips: All / Orchestrator / QC / Deliverables

---

## Part 5 — Required API additions

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/spine` | GET | Returns counts + status for 5 spine nodes |
| `/api/next-moves` | GET | Unified priority actions + tasks + review flags |
| `/api/processing-jobs` | GET | Active/queued audio render jobs with progress |
| `/api/review-queue` | GET | Human-review flagged projects (confidence < 0.70 or QC fail) |
| `/api/songs?last_touched=true&limit=1` | GET | Current Record data |
| `/api/opportunities?group_by=stage&include_momentum=true` | GET | Pipeline Pulse data |

---

## Part 6 — Motion + visual system

Inherit from `frvr-sounds-presentation/index.html`:
- `.orb` ambient blurs (red + cyan + white) — add to dashboard layout
- `.scanline` horizontal moving line — subtle, 8s loop
- `.signal-line` for the Spine
- Stagger reveals on scroll (`IntersectionObserver` → add `.v` class)
- `.pulse` dot for system-active indicator
- Red/cyan gradient accents on active states only

**New utility components to add to `/components/ui/motion.tsx`:**
- `<SpineNode>`
- `<ConfidencePill score={0.87} />`
- `<WaveformPreview src={...} />`
- `<StageIndicator current="mix" stages={[...]} />`
- `<AmbientOrbs />` (for dashboard background)

---

## Part 7 — Build order (one PR at a time)

1. **PR-1:** Add `<AmbientOrbs />` + scanline to `(dashboard)/layout.tsx`. Zero functional change, sets the premium feel.
2. **PR-2:** Replace Welcome Banner with FOCUS BAR. Surface `focus_area` + confidence.
3. **PR-3:** Build `<SpineNode>` + `[02] THE SPINE` component. New `/api/spine` endpoint.
4. **PR-4:** Merge Priority Actions + Today's Tasks → `[03] NEXT MOVES`. New `/api/next-moves` endpoint.
5. **PR-5:** Build `[04] CURRENT RECORD` with waveform + stage indicator.
6. **PR-6:** Build `[05] FINISHING DECK` + `/api/processing-jobs`. This is where audio becomes visible.
7. **PR-7:** Replace Pipeline Summary with `[06] PIPELINE PULSE`.
8. **PR-8:** Split Health Widget → `[07] HEALTH + HUMAN REVIEW` + `/api/review-queue`.
9. **PR-9:** Collapse Activity Feed → `[08] RECENT ACTIVITY` (ambient, bottom).
10. **PR-10:** Delete the 4 stat cards. (Killing them is the upgrade.)

---

## Part 8 — Top 10 things this v2 must get right

1. The Spine is the first thing the eye lands on after the focus bar.
2. Every Claude-generated recommendation shows a confidence pill.
3. Audio renders surface live — no black boxes.
4. Human review queue is *always* visible when non-empty.
5. Current Record makes "the song I'm working on" obvious in one glance.
6. Next Moves caps at 5 visible — restraint signals confidence.
7. No "Welcome Back." Focus Bar is pure signal.
8. Motion is ambient, never jittery. Breathing > bouncing.
9. Dead widgets (4 stat cards) are removed, not hidden.
10. Palette locked to black / chrome / red / cyan. No purple, no green except health success states.

---

## Rollback plan

- v1 preserved at `page.backup.tsx`.
- Restore: `cp page.backup.tsx page.tsx`
- Every new API endpoint should have a feature flag `NEXT_PUBLIC_V2_COMMAND_CENTER=true` during rollout.

---

## Out of scope for v2

- Signature Sound Profile surfacing (v3 moat layer)
- Preset marketplace widget (v3)
- Engineer review mode UI (v3)
- Learning feedback loop visualization (v3)

These belong on a later revision. Ship v2 first.
