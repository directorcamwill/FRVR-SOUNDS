# Coding-Session Handoff Prompt

**Purpose:** Copy-paste this prompt into a fresh Claude Code session (or hand to a dev) to implement the Command Center v2 + Sync/Mix/Master Engine.

**How to use:**
1. Open a new Claude Code session in `/Users/filmbycamwill/Desktop/frvr-sounds`
2. Paste the entire block in Part A below as your first message
3. Claude will read the specs and ask clarifying questions before starting
4. Approve the plan, then let it execute PR-by-PR

---

## PART A — The Handoff Prompt (copy from the next line)

---

You are taking over implementation of a significant upgrade to the FRVR Sounds Command Center. A prior session completed the audit and wrote two detailed specs. Your job is to implement them.

## Project context

- Stack: Next.js (App Router, TypeScript), Tailwind, Supabase (Postgres), Framer Motion, lucide-react
- Root: `/Users/filmbycamwill/Desktop/frvr-sounds`
- Primary target file: `src/app/(dashboard)/command-center/page.tsx`
- Brand palette: black (#050507), chrome (#c0c8d8), red (#dc2626), cyan (#22d3ee). No purple, no teal, no orange — ever.
- Claude is the orchestration/decision layer, NOT the DSP layer. All audio processing is external (FFmpeg, Matchering). Your UI renders decisions + job state + audio metadata.

## Required reading before you write any code

Read these three files in full:

1. `src/app/(dashboard)/command-center/UPGRADE_SPEC.md` — Command Center v2 layout + 10-PR build order
2. `src/app/(dashboard)/command-center/SYNC_MIX_MASTER_SPEC.md` — Sync/Mix/Master Engine section (PR-6 expanded into 6 sub-PRs)
3. `src/app/(dashboard)/command-center/page.backup.tsx` — the v1 Command Center (do NOT delete this)

Also skim:
- `CLAUDE.md` and `AGENTS.md` at repo root for project conventions
- `src/app/(dashboard)/layout.tsx` for the dashboard shell
- `src/components/ui/motion.tsx` for existing primitives (`MotionCard`, `GlowCard`, `GlowDot`, `AnimatedNumber`)
- `src/app/globals.css` for the token system
- `supabase/` folder for migration conventions

## What to build (in order)

Follow the 10 PRs from `UPGRADE_SPEC.md` Part 7, with PR-6 expanded into the 6 sub-PRs from `SYNC_MIX_MASTER_SPEC.md` Part 9. So the full sequence is:

1. PR-1: AmbientOrbs + scanline in dashboard layout
2. PR-2: Focus Bar (replaces Welcome Back)
3. PR-3: The Spine + `/api/spine`
4. PR-4: Next Moves (merges priority actions + today's tasks) + `/api/next-moves`
5. PR-5: Current Record (waveform + stage indicator)
6. PR-6.1: Engine types + DB migrations + stub APIs
7. PR-6.2: Engine Header + `/api/engine/status`
8. PR-6.3: Active Render Panel + `/api/engine/active-render`
9. PR-6.4: Queue + Upcoming + `/api/engine/queue` + reorder/pause/cancel/boost
10. PR-6.5: Dual Branch Preview + `/api/songs/:id/branches`
11. PR-6.6: Deliverables Grid + `/api/songs/:id/deliverables` + package ZIP
12. PR-7: Pipeline Pulse (replaces Pipeline Summary)
13. PR-8: Health + Human Review split + `/api/review-queue`
14. PR-9: Collapse Activity Feed to ambient footer
15. PR-10: Delete the 4 stat cards

## Implementation rules — non-negotiable

1. **Preserve `page.backup.tsx`.** Never edit or delete it. It is the v1 rollback.
2. **Feature-flag everything.** Wrap v2 rendering in `NEXT_PUBLIC_V2_COMMAND_CENTER === "true"`. Wrap the engine section in `NEXT_PUBLIC_ENGINE_V1 === "true"`. When both flags are off, the page must render identically to `page.backup.tsx`.
3. **One PR at a time.** After each PR, stop and report. Do not start the next one until I approve.
4. **Types first.** For every new API endpoint, add the TypeScript types to `src/types/engine.ts` (or equivalent) before writing the endpoint or the component.
5. **Stub then wire.** New endpoints may return fixtures for their first PR. Real data can be wired later. Mark fixture responses with `X-Fixture: true` header so we can grep them later.
6. **Confidence pill is a shared component.** Build `<ConfidencePill score={number} />` in `src/components/ui/motion.tsx` once. Thresholds: ≥0.85 green, 0.70–0.84 chrome, <0.70 red.
7. **No new color tokens.** Use existing Tailwind/CSS vars only. If you think you need a new color, stop and ask.
8. **Motion respects `prefers-reduced-motion`.** Every `motion.div` must degrade gracefully.
9. **No `// @ts-ignore` and no `any`.** If a type is hard, ask me — don't paper over it.
10. **Each PR ends with:** green `tsc --noEmit`, green `next lint`, and a manual check that both feature flags off still renders the old Command Center exactly.

## Before you write any code

Respond with:

1. A confirmation you've read all three spec files in full
2. Any ambiguities or questions from the specs
3. Your proposed PR-1 plan with exact file paths you'll touch
4. Any deviation from the spec you want to propose, with reasoning

Do not start coding until I approve your PR-1 plan.

## Definition of done for the whole project

- Both feature flags on → new Command Center renders with all 8 sections from `UPGRADE_SPEC.md` Part 3 + all 5 sub-panels from `SYNC_MIX_MASTER_SPEC.md` Part 2
- Both feature flags off → v1 Command Center renders identically to `page.backup.tsx`
- `tsc --noEmit` clean
- `next lint` clean
- No regression in existing dashboard routes (`/daily`, `/pipeline`, `/deliverables`, etc.)
- All new API endpoints documented in `SYNC_MIX_MASTER_SPEC.md` Part 4 exist and return either real data or marked fixtures
- All 4 new DB tables from `SYNC_MIX_MASTER_SPEC.md` Part 6 have migrations in `supabase/migrations/`
- `page.backup.tsx` is untouched

Begin with reading the three spec files and respond with your plan.

---

## PART B — How to use with a dev (non-Claude)

If you're handing this to a human developer instead of a Claude session:

1. Send them this file
2. Tell them the specs at `UPGRADE_SPEC.md` and `SYNC_MIX_MASTER_SPEC.md` are the source of truth
3. Ask them to review Part A above and reply with their PR-1 plan before starting
4. Gate merge of each PR on:
   - Feature flags off = v1 unchanged
   - TypeScript clean
   - Lint clean
   - Manual smoke test of that PR's surface

---

## PART C — Environment variables to add

Add to `.env.local` (and document in README):

```
# Enable Command Center v2 layout
NEXT_PUBLIC_V2_COMMAND_CENTER=false

# Enable Sync/Mix/Master Engine section
NEXT_PUBLIC_ENGINE_V1=false
```

Flip to `true` locally to preview during dev. Keep `false` in prod until PR-10 ships.

---

## PART D — Suggested commit message style

```
feat(command-center): PR-{n} — {short title}

Implements PR-{n} from UPGRADE_SPEC.md / SYNC_MIX_MASTER_SPEC.md.

- {bullet 1}
- {bullet 2}

Feature flag: NEXT_PUBLIC_V2_COMMAND_CENTER (or NEXT_PUBLIC_ENGINE_V1)
Spec: src/app/(dashboard)/command-center/{file}.md
```

---

## PART E — If anything goes wrong

Rollback order:

1. Disable the feature flag in `.env.local`
2. If that's not enough: `cp page.backup.tsx page.tsx`
3. If DB migrations caused issues: the new tables are additive only, no existing table modifications. Drop the 4 new tables if needed.
4. Revert the PR's commit.

The v1 Command Center is preserved bit-exact in `page.backup.tsx`. Restoring it is always one `cp` away.
