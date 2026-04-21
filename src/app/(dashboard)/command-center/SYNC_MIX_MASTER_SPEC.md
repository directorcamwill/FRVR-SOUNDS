# Sync / Mix / Master Engine — Command Center Section Spec

**Companion to:** `UPGRADE_SPEC.md`
**Status:** Ready for implementation
**Purpose:** Defines the new **Sync / Mix / Master Engine** surface on the Command Center — the product spine's Finishing + Delivery layer made visible.

---

## Part 1 — Product thesis for this section

The Sync / Mix / Master Engine is the **operational heart** of FRVR Sounds. On the Command Center it must answer four questions in one glance:

1. What is being finished right now?
2. What is its confidence + QC status?
3. What still needs to happen for it to ship?
4. What sync/release destinations is it going to?

If a user can't answer those four questions in 3 seconds, the section has failed.

---

## Part 2 — Where it lives on the Command Center

Per `UPGRADE_SPEC.md` Part 3, the Command Center v2 is organized top-to-bottom as the product spine. The Sync / Mix / Master Engine is section **[05] FINISHING DECK**, but expanded into a richer multi-panel experience:

```
┌──────────────────────────────────────────────────────────────┐
│  [05A] ENGINE HEADER                                         │
│  "Sync / Mix / Master Engine" + global status + new-job CTA  │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────┬───────────────────────────────┐
│  [05B] ACTIVE RENDER PANEL   │  [05C] QUEUE + UPCOMING       │
│  Currently processing job    │  Next 5 jobs waiting          │
│  Live progress + QC preview  │  Reorder / pause / cancel     │
└──────────────────────────────┴───────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│  [05D] DUAL BRANCH PREVIEW                                   │
│  Side-by-side: Sync Master ⇄ Release Master                  │
│  LUFS meters, waveforms, A/B toggle                          │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│  [05E] DELIVERABLES GRID                                     │
│  Cards for each output: streaming/sync/instrumental/TV/stems │
│  Status, LUFS target, QC pass, download                      │
└──────────────────────────────────────────────────────────────┘
```

Collapses to a single-column stack on mobile/tablet.

---

## Part 3 — Section-by-section widget specs

### [05A] ENGINE HEADER
**Purpose:** Global engine status + primary CTA.

**Visual:**
- Height: 72px
- Left: "SYNC / MIX / MASTER ENGINE" (uppercase mono, 11px, tracking 0.3em, chrome)
- Below title: sub-heading showing active confidence thresholds ("Auto-review below 70%")
- Right: 3-pill status cluster
  - `{active_jobs} rendering` (red pulse if > 0)
  - `{queued_jobs} queued` (amber if > 0)
  - `{review_queue} review` (red if > 0, hidden if 0)
- Right-most: primary button "New Render" → opens render wizard modal

**Data source:** `/api/engine/status`

**Props:**
```ts
interface EngineHeaderProps {
  activeJobs: number;
  queuedJobs: number;
  reviewQueue: number;
  confidenceThreshold: number; // default 0.70
  onNewRender: () => void;
}
```

---

### [05B] ACTIVE RENDER PANEL
**Purpose:** Show the one job the system is currently processing with live telemetry.

**Visual:**
- Large card, ~380px tall
- Top row: song title + artist name + job type badge (MIX / MASTER / STEMS / CUTDOWN / QC)
- Waveform strip (canvas), animated to show processed vs unprocessed regions
- Progress bar with ETA (polls `/api/engine/jobs/:id` every 2s)
- Telemetry strip (4 metrics):
  - Current LUFS (animated number)
  - True Peak dB
  - Gain Reduction (live from limiter)
  - Elapsed / ETA
- "What Claude decided" micro-panel:
  - Selected template (e.g., "Dark R&B · Vocal Forward · Expensive Dark v1")
  - Confidence pill (color-coded)
  - 1-line reasoning
- Bottom row: Cancel + View Full Log buttons

**Empty state:** Ambient panel with "No active render. Start one →" and a subtle pulse animation on the New Render CTA.

**Data source:** `/api/engine/active-render` (long-poll or SSE)

**Props:**
```ts
interface ActiveRenderProps {
  job: ActiveJob | null;
  onCancel: (jobId: string) => void;
  onViewLog: (jobId: string) => void;
}

interface ActiveJob {
  id: string;
  songId: string;
  songTitle: string;
  artistName: string;
  jobType: "mix" | "master" | "stems" | "cutdown" | "qc";
  progress: number; // 0-100
  etaSeconds: number;
  elapsedSeconds: number;
  currentLufs: number;
  currentTruePeak: number;
  currentGainReduction: number;
  selectedTemplate: {
    id: string;
    name: string;
    confidence: number; // 0-1
    reasoning: string;
  };
  waveformUrl: string; // pre-computed peaks
}
```

---

### [05C] QUEUE + UPCOMING
**Purpose:** Show the next 5 jobs waiting to run. Reorderable.

**Visual:**
- Card, same height as Active Render (side-by-side desktop)
- List of 5 rows max
- Each row:
  - Drag handle (left)
  - Song title + job type badge
  - Confidence pill + estimated duration
  - Kebab menu: Pause / Cancel / Boost Priority
- Footer: "{n} more in queue" with link to full queue page
- Empty state: "Queue clear. Engine idle."

**Data source:** `/api/engine/queue?limit=5`

**Props:**
```ts
interface QueuePanelProps {
  jobs: QueuedJob[];
  totalQueued: number;
  onReorder: (fromIdx: number, toIdx: number) => void;
  onPause: (jobId: string) => void;
  onCancel: (jobId: string) => void;
  onBoost: (jobId: string) => void;
}

interface QueuedJob {
  id: string;
  songTitle: string;
  jobType: "mix" | "master" | "stems" | "cutdown" | "qc";
  confidence: number;
  estimatedDurationSeconds: number;
  position: number;
}
```

---

### [05D] DUAL BRANCH PREVIEW
**Purpose:** The signature visual. Show the Sync Master and Release Master side-by-side.

**Visual:**
- Full-width panel, ~280px tall
- Split vertically down the middle with a thin chrome rule
- Left half: **SYNC MASTER**
  - Label top-left: "SYNC MASTER" (red mono)
  - Profile name below: "Sync Dynamic · -18 LUFS"
  - Waveform (chrome)
  - LUFS meter (vertical bar) + True Peak dB
  - QC badge (PASS / REVIEW / FAIL)
- Right half: **RELEASE MASTER**
  - Label top-left: "RELEASE MASTER" (cyan mono)
  - Profile name below: "Streaming Balanced · -14 LUFS"
  - Waveform (cyan)
  - LUFS meter + True Peak dB
  - QC badge
- Center column (60px wide): vertical A/B toggle button. Click to scrub both players in sync. Play button bottom, loudness-matched toggle top.
- Below the split: 4-band spectrogram comparison strip (sub / low-mid / high-mid / air) showing tonal delta between branches.

**Empty state (no rendered branches yet):** Ghost panel with "Render a master to see the dual branch comparison."

**Data source:** `/api/songs/:id/branches`

**Props:**
```ts
interface DualBranchProps {
  songId: string;
  syncBranch: BranchResult | null;
  releaseBranch: BranchResult | null;
  isPlaying: boolean;
  loudnessMatched: boolean;
  onPlayToggle: () => void;
  onLoudnessMatchToggle: () => void;
}

interface BranchResult {
  id: string;
  profileName: string;
  lufsIntegrated: number;
  truePeakDb: number;
  loudnessRange: number;
  qcStatus: "pass" | "review" | "fail";
  waveformUrl: string;
  audioUrl: string;
  spectralBalance: {
    sub: number;      // -1 to 1 (relative to reference)
    lowMid: number;
    highMid: number;
    air: number;
  };
}
```

---

### [05E] DELIVERABLES GRID
**Purpose:** Show all output formats for the current record and their readiness.

**Visual:**
- Grid of 8 cards (responsive: 4 cols desktop, 2 cols tablet, 1 col mobile)
- Each card: ~140px tall
  - Top: deliverable type icon + label
  - Middle: target spec (e.g., "-14 LUFS · -1 dBTP")
  - Status badge: READY / RENDERING / QUEUED / FAILED / NEEDS_REVIEW
  - Bottom: download icon (active when ready) + QC pass badge

**Deliverables shown (fixed order):**
1. Streaming Master (Spotify/Apple balanced)
2. Loud Master (-9 LUFS variant)
3. Sync Dynamic Master
4. Broadcast Master (ATSC A/85 or EBU R128)
5. Instrumental
6. A cappella
7. TV Mix (no lead vocal)
8. Stems ZIP

**Each card color-codes its target family:**
- Streaming → cyan
- Sync → red
- Utility (instrumental/acap/TV/stems) → chrome

**Footer row below grid:**
- "Download Package ZIP" button (disabled until all critical deliverables are READY)
- Metadata completeness pill: "Metadata 92% complete →"
- Sync package readiness: "Sync submission ready ✓" (green) or "3 items blocking →"

**Data source:** `/api/songs/:id/deliverables`

**Props:**
```ts
interface DeliverablesGridProps {
  songId: string;
  deliverables: Deliverable[];
  metadataCompleteness: number; // 0-100
  syncPackageReady: boolean;
  syncPackageBlockers: string[];
  onDownload: (deliverableId: string) => void;
  onDownloadPackage: () => void;
}

interface Deliverable {
  id: string;
  type: "streaming_master" | "loud_master" | "sync_dynamic_master"
      | "broadcast_master" | "instrumental" | "acapella"
      | "tv_mix" | "stems_zip";
  label: string;
  targetLufs: number;
  targetTruePeak: number;
  status: "ready" | "rendering" | "queued" | "failed" | "needs_review";
  qcPassed: boolean;
  downloadUrl: string | null;
  renderedAt: string | null;
  family: "streaming" | "sync" | "utility";
}
```

---

## Part 4 — New API contracts

All endpoints live under `/api/engine/*` or `/api/songs/:id/*`. JSON only. Auth via existing middleware.

### GET `/api/engine/status`
Returns the global engine state for the header.

**Response:**
```json
{
  "active_jobs": 1,
  "queued_jobs": 4,
  "review_queue": 2,
  "confidence_threshold": 0.70,
  "system_health": "ok"
}
```

### GET `/api/engine/active-render`
Returns the currently processing job with live telemetry. Prefer SSE; fall back to 2s polling.

**Response (when active):**
```json
{
  "id": "job_a9f2",
  "song_id": "song_3c1d",
  "song_title": "Midnight Rain",
  "artist_name": "Cam Williams",
  "job_type": "master",
  "progress": 62,
  "eta_seconds": 48,
  "elapsed_seconds": 72,
  "current_lufs": -14.2,
  "current_true_peak": -1.0,
  "current_gain_reduction": 2.4,
  "selected_template": {
    "id": "dark-rnb-vocal-forward-expensive-dark-v1",
    "name": "Dark R&B · Vocal Forward · Expensive Dark",
    "confidence": 0.87,
    "reasoning": "Detected dark R&B with upper-mid harshness. Reducing 3-6k before widening."
  },
  "waveform_url": "/media/peaks/song_3c1d.json"
}
```

**Response (when idle):**
```json
{ "id": null }
```

### GET `/api/engine/queue?limit=5`
**Response:**
```json
{
  "jobs": [
    {
      "id": "job_b1c3",
      "song_title": "Lotus Room",
      "job_type": "mix",
      "confidence": 0.82,
      "estimated_duration_seconds": 140,
      "position": 1
    }
  ],
  "total_queued": 4
}
```

### POST `/api/engine/queue/reorder`
**Body:** `{ "jobId": "job_b1c3", "newPosition": 3 }`
**Response:** `{ "ok": true }`

### POST `/api/engine/jobs/:id/pause`
### POST `/api/engine/jobs/:id/cancel`
### POST `/api/engine/jobs/:id/boost`
All return `{ "ok": true }` or `{ "error": "reason" }`.

### GET `/api/songs/:id/branches`
Returns the dual-branch render state for a song.

**Response:**
```json
{
  "song_id": "song_3c1d",
  "sync_branch": {
    "id": "branch_s1",
    "profile_name": "Sync Dynamic",
    "lufs_integrated": -18.1,
    "true_peak_db": -2.0,
    "loudness_range": 9.2,
    "qc_status": "pass",
    "waveform_url": "/media/peaks/branch_s1.json",
    "audio_url": "/media/audio/branch_s1.mp3",
    "spectral_balance": { "sub": 0.1, "low_mid": -0.05, "high_mid": 0.2, "air": 0.15 }
  },
  "release_branch": {
    "id": "branch_r1",
    "profile_name": "Streaming Balanced",
    "lufs_integrated": -14.0,
    "true_peak_db": -1.0,
    "loudness_range": 6.8,
    "qc_status": "pass",
    "waveform_url": "/media/peaks/branch_r1.json",
    "audio_url": "/media/audio/branch_r1.mp3",
    "spectral_balance": { "sub": 0.15, "low_mid": -0.1, "high_mid": 0.3, "air": 0.25 }
  }
}
```

### GET `/api/songs/:id/deliverables`
**Response:**
```json
{
  "song_id": "song_3c1d",
  "metadata_completeness": 92,
  "sync_package_ready": false,
  "sync_package_blockers": [
    "Split sheet unsigned",
    "Scene tags missing",
    "Instrumental not QC-passed"
  ],
  "deliverables": [
    {
      "id": "d_01",
      "type": "streaming_master",
      "label": "Streaming Master",
      "target_lufs": -14,
      "target_true_peak": -1,
      "status": "ready",
      "qc_passed": true,
      "download_url": "/media/deliver/d_01.wav",
      "rendered_at": "2026-04-16T14:22:10Z",
      "family": "streaming"
    }
  ]
}
```

### POST `/api/engine/render`
Kicks off a new render. Used by the "New Render" CTA modal.

**Body:**
```json
{
  "song_id": "song_3c1d",
  "job_types": ["mix", "master"],
  "reference_ids": ["ref_a1", "ref_b2"],
  "delivery_goals": ["streaming_balanced", "sync_dynamic"],
  "use_signature_sound": true
}
```

**Response:** `{ "job_ids": ["job_a9f2", "job_a9f3"] }`

### GET `/api/songs/:id/package`
Builds + streams the final deliverables ZIP.

---

## Part 5 — Core data shapes (TypeScript)

Put these in `src/types/engine.ts`:

```ts
export type JobType = "mix" | "master" | "stems" | "cutdown" | "qc";
export type JobStatus = "queued" | "running" | "paused" | "completed" | "failed" | "cancelled";
export type QcStatus = "pass" | "review" | "fail";
export type DeliverableStatus = "ready" | "rendering" | "queued" | "failed" | "needs_review";
export type DeliveryFamily = "streaming" | "sync" | "utility";
export type DeliverableType =
  | "streaming_master" | "loud_master" | "sync_dynamic_master" | "broadcast_master"
  | "instrumental" | "acapella" | "tv_mix" | "stems_zip";

export interface EngineStatus {
  active_jobs: number;
  queued_jobs: number;
  review_queue: number;
  confidence_threshold: number;
  system_health: "ok" | "degraded" | "down";
}

export interface SelectedTemplate {
  id: string;
  name: string;
  confidence: number;
  reasoning: string;
}

export interface ActiveJob {
  id: string;
  song_id: string;
  song_title: string;
  artist_name: string;
  job_type: JobType;
  progress: number;
  eta_seconds: number;
  elapsed_seconds: number;
  current_lufs: number;
  current_true_peak: number;
  current_gain_reduction: number;
  selected_template: SelectedTemplate;
  waveform_url: string;
}

export interface QueuedJob {
  id: string;
  song_title: string;
  job_type: JobType;
  confidence: number;
  estimated_duration_seconds: number;
  position: number;
}

export interface SpectralBalance {
  sub: number;
  low_mid: number;
  high_mid: number;
  air: number;
}

export interface BranchResult {
  id: string;
  profile_name: string;
  lufs_integrated: number;
  true_peak_db: number;
  loudness_range: number;
  qc_status: QcStatus;
  waveform_url: string;
  audio_url: string;
  spectral_balance: SpectralBalance;
}

export interface Deliverable {
  id: string;
  type: DeliverableType;
  label: string;
  target_lufs: number;
  target_true_peak: number;
  status: DeliverableStatus;
  qc_passed: boolean;
  download_url: string | null;
  rendered_at: string | null;
  family: DeliveryFamily;
}
```

---

## Part 6 — Database additions (Postgres)

Minimum tables required on top of whatever already exists. Use the conventions in the existing `supabase/` folder.

```sql
-- Tracks every render job the engine processes
create table engine_jobs (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null references songs(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  job_type text not null check (job_type in ('mix','master','stems','cutdown','qc')),
  status text not null check (status in ('queued','running','paused','completed','failed','cancelled')),
  position integer,
  progress integer default 0,
  selected_template_id uuid references templates(id),
  template_confidence numeric(5,4),
  template_reasoning text,
  current_lufs numeric(8,3),
  current_true_peak numeric(8,3),
  current_gain_reduction numeric(8,3),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now()
);

create index idx_engine_jobs_status on engine_jobs(status);
create index idx_engine_jobs_song on engine_jobs(song_id);

-- The two rendered branches per song (sync + release)
create table song_branches (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null references songs(id) on delete cascade,
  branch_type text not null check (branch_type in ('sync','release')),
  profile_name text not null,
  profile_id text not null,
  lufs_integrated numeric(8,3),
  true_peak_db numeric(8,3),
  loudness_range numeric(8,3),
  qc_status text check (qc_status in ('pass','review','fail')),
  waveform_key text,
  audio_key text,
  spectral_balance jsonb,
  rendered_at timestamptz default now(),
  unique(song_id, branch_type)
);

-- Final deliverables
create table song_deliverables (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null references songs(id) on delete cascade,
  deliverable_type text not null,
  label text not null,
  family text check (family in ('streaming','sync','utility')),
  target_lufs numeric(8,3),
  target_true_peak numeric(8,3),
  status text not null check (status in ('ready','rendering','queued','failed','needs_review')),
  qc_passed boolean default false,
  file_key text,
  rendered_at timestamptz,
  created_at timestamptz default now(),
  unique(song_id, deliverable_type)
);

-- Per-song sync package readiness
create table sync_package_checks (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null references songs(id) on delete cascade unique,
  metadata_completeness integer default 0,
  sync_package_ready boolean default false,
  blockers jsonb default '[]'::jsonb,
  last_checked_at timestamptz default now()
);
```

---

## Part 7 — Motion / visual rules specific to this section

- **Active Render waveform:** progress-fill uses a linear red-to-cyan gradient; processed region gets a subtle glow, unprocessed stays chrome.
- **LUFS meters:** vertical bars with a target-band overlay (green band for on-target, amber above/below).
- **Dual-branch A/B toggle:** scrubbing must be sample-accurate between both audio files; loudness-matched mode applies a level trim so human comparison is fair.
- **Deliverable card transitions:** when a deliverable flips `rendering → ready`, animate the QC badge in with a 400ms breathing glow.
- **Confidence pills:**
  - ≥ 0.85 → green
  - 0.70–0.84 → chrome
  - < 0.70 → red + shows "Review" affordance
- All motion respects `prefers-reduced-motion`.

---

## Part 8 — Empty / failure / edge states

| State | Render |
|---|---|
| No active render | Ghost Active Render panel + dim "Start a render" CTA |
| No queue | "Queue clear. Engine idle." chrome text, no empty rows |
| No dual-branch rendered yet | Split panel shows ghosted waveforms + "Render a master to see comparison" |
| QC fails on a branch | Branch waveform tints red, QC badge says FAIL, row expands to show top 3 issues |
| Metadata < 100% | Footer pill is amber with "Complete metadata →" link |
| Sync blockers > 0 | Footer shows red count, clicking opens Sync Checklist modal |
| Engine degraded | Header shows amber system dot + "Engine degraded — jobs may be delayed" banner |

---

## Part 9 — Build order (within PR-6 from UPGRADE_SPEC)

Split PR-6 into 6 sub-PRs so this section ships incrementally:

1. **6.1** — types + DB migrations + empty stub API endpoints returning fixtures
2. **6.2** — Engine Header ([05A]) wired to real `/api/engine/status`
3. **6.3** — Active Render panel ([05B]) with polling
4. **6.4** — Queue + Upcoming panel ([05C]) with reorder
5. **6.5** — Dual Branch Preview ([05D]) with A/B player
6. **6.6** — Deliverables Grid ([05E]) + package ZIP endpoint

Each sub-PR is shippable on its own; earlier PRs degrade gracefully if later APIs aren't wired yet.

---

## Part 10 — Top 10 things this section must get right

1. The active render is always the focal point when something is running.
2. Confidence is shown on every template decision with a color pill.
3. The dual-branch A/B comparison is loudness-matched by default.
4. Every deliverable card tells you one thing: is it ready to ship?
5. Sync-package blockers are surfaced, not hidden in a nested page.
6. The queue is reorderable with drag + drop.
7. LUFS + True Peak values are always visible, never in a tooltip.
8. Job failures show the top issue inline, not a vague "failed" state.
9. No spinner without context — every loading state names what it's loading.
10. Black / chrome / red / cyan. No purple. No teal. No orange. Ever.

---

## Rollback / feature flag

Gate the whole section behind `NEXT_PUBLIC_ENGINE_V1=true`. When off, the Command Center shows only the v1 Deliverables Progress widget. When on, the full engine section replaces it.
