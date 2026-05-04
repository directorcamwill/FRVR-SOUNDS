# FRVR Sounds — Legacy Brand Journey (V1)

> **Status:** Frozen reference snapshot. Do not edit. This is the revert target if V2 is rolled back.
> **Captured:** 2026-05-01
> **Scope:** 7-module / 32-question Brand Journey + Director AI + Activation rewards as of capture date.

---

## 1. Module Map (V1)

| # | Module | Tagline | Questions |
|---|--------|---------|-----------|
| 1 | Identity | The human truth under the artist. | 5 |
| 2 | Emotional Signature | The emotional territory the music owns. | 4 |
| 3 | Positioning | The lane you stake. | 5 |
| 4 | Audience | Make the listener a real person. | 5 |
| 5 | Visual DNA | How your brand looks before a word is said. | 5 |
| 6 | Sound DNA | What the music sounds like before anyone knows it's you. | 5 |
| 7 | Routes | The lanes your music goes to work. | 3 |

Total: 32 questions. Linear progression. 80% per module unlocks activation.

---

## 2. Verbatim Questions (V1)

### Module 1 — Identity
1. `identity.core_pain` — "What pain does your music resolve for your listener that no other song in their queue can?"
2. `identity.origin_story` — "Tell me the moment your artist identity started. A specific memory — not a career summary."
3. `identity.transformation` — "Before your music → after. What changes in the listener?"
4. `identity.core_beliefs` — "3–5 non-negotiable beliefs that shape what you'll and won't make."
5. `identity.key_themes` — "The 3–5 themes every record of yours circles back to."

### Module 2 — Emotional Signature
6. `emotional.desired` — "What do you want the listener to feel in the first 15 seconds?"
7. `emotional.natural` — "What do listeners actually say they feel? If nothing yet, what does your best demo evoke in friends?"
8. `emotional.tags` — "Pick 5 tags a music supervisor would type to find your sound."
9. `emotional.intensity` — "Where on the dial does your music sit?" (Energy 1–10 + Intensity 1–10 + notes)

### Module 3 — Positioning
10. `positioning.statement` — "For ___, we make ___ that ___."
11. `positioning.differentiators` — "3 things you do that 90% of artists in your lane don't."
12. `positioning.category_lane` — "One sentence a stranger would repeat verbatim to describe your lane."
13. `positioning.what_not` — "3 adjacent lanes you get confused with — and what you do differently."
14. `positioning.competitive` — "Name 2 artists you get compared to. What do you do that they don't?"

### Module 4 — Audience
15. `audience.primary` — "Who is the single person listening?"
16. `audience.pain` — "3 things they're trying to escape or process."
17. `audience.desires` — "3 things they're trying to feel or become."
18. `audience.lifestyle` — "Where and when does your music enter their day?"
19. `audience.identity_goals` — "What does listening to your music let them believe about themselves?"

### Module 5 — Visual DNA
20. `visual.palette` — "Three hex colors that are your brand."
21. `visual.textures` — "The texture vocabulary of your world."
22. `visual.typography` — "Two typefaces — headline and body."
23. `visual.marks` — "Your marks." (logo + icon URLs)
24. `visual.photos` — "Press photo URLs."

### Module 6 — Sound DNA
25. `sonic.genres` — "Primary and secondary genre."
26. `sonic.moods` — "3–5 moods the music lives in."
27. `sonic.bpm_range` — "Typical BPM range."
28. `sonic.textures` — "3–5 sonic textures that recur in your records."
29. `sonic.references` — "3 reference tracks — and what to borrow from each."

### Module 7 — Routes
30. `routes.format_targets` — "Which sync formats are you actually chasing?"
31. `routes.format_avoids` — "Which formats should your catalog NEVER get pitched to?"
32. `routes.library_targets` — "Which libraries / placement homes is your music built for?"

---

## 3. Director AI (V1 modes)

- **Director's Notes** — refines a single answer; returns side-by-side diff + confidence; user accepts or keeps theirs.
- **Director's read** — inline critique with specificity score (0–1) + flags + suggestion. No auto-write.
- **Bio summarizer** — once Identity ≥80%, generates elevator pitch + short/medium/long bios; auto-writes to wiki at confidence ≥0.75.
- **Follow-up** — given a field + answer, generates one clarifying question (not exposed in V1 UI).
- **Guidance (whole-wiki)** — internal-only completeness review used by other agents.

Backend: [brand-director/route.ts](../src/app/api/agents/brand-director/route.ts)
Modes file: [src/lib/agents/brand-director.ts](../src/lib/agents/brand-director.ts)

---

## 4. Activation System (V1)

- **Trigger:** all 7 modules ≥80% completeness.
- **Effect:** sets `brand_wiki.journey_activated_at` once-per-artist; toast + rewards panel.
- **Unlocks:** 11 downstream tools (Content ideas, Lyrics, Production direction, Brand Fit grader, Collab intros, Sync matching, Supervisor matching, Social profile builder, Photo art direction, Products+offers, Bio generator).
- **Feature flag for full unlock:** `brand_wiki_activated` (Studio tier in V1 plans.ts).

---

## 5. Persistence (V1)

- **`public.brand_wiki`** — 33+ canonical columns per artist. Includes `current_module_id`, `current_step_id`, `module_completeness` (JSONB), `module_locked_at` (JSONB), `journey_notes`, `journey_activated_at`, `completeness_pct`.
- **`public.brand_module_responses`** — raw answer audit trail. Columns: `artist_id`, `module_id`, `question_id`, `field_key`, `raw_answer`, `refined_answer`, `critique` (JSONB), `confidence`, `accepted_refine`, timestamps. Unique on `(artist_id, module_id, question_id)`.
- **Migrations:** `00025_brand_journey.sql`, `00026_brand_journey_notes.sql`, `00027_brand_journey_activation.sql`.

---

## 6. Files (V1, do not delete)

- [src/app/(dashboard)/brand/page.tsx](../src/app/(dashboard)/brand/page.tsx)
- [src/lib/brand/modules.ts](../src/lib/brand/modules.ts)
- [src/lib/brand/validation.ts](../src/lib/brand/validation.ts)
- [src/lib/brand/agent-map.ts](../src/lib/brand/agent-map.ts)
- [src/types/brand.ts](../src/types/brand.ts)
- [src/components/brand/question-card.tsx](../src/components/brand/question-card.tsx)
- [src/components/brand/journey-nav.tsx](../src/components/brand/journey-nav.tsx)
- [src/components/brand/live-wiki-panel.tsx](../src/components/brand/live-wiki-panel.tsx)
- [src/components/brand/journey-notes.tsx](../src/components/brand/journey-notes.tsx)
- [src/components/brand/directors-notes.tsx](../src/components/brand/directors-notes.tsx)
- [src/components/brand/brand-wiki-rewards.tsx](../src/components/brand/brand-wiki-rewards.tsx)
- [src/components/brand/answer-inputs.tsx](../src/components/brand/answer-inputs.tsx)
- [src/app/api/agents/brand-director/route.ts](../src/app/api/agents/brand-director/route.ts)

---

## 7. Revert Procedure

To roll back from V2 to V1:
1. Restore the seven module definitions in `src/lib/brand/modules.ts` to their V1 question set above.
2. Drop V2-only columns from `brand_wiki` (added in migrations ≥ `00029_*`).
3. Restore `brand-wiki-rewards.tsx` activation behavior to "unlock 11 tools" (V1 list above) instead of routing to the Weekly Execution Dashboard.
4. Revert `plans.ts` tier names if renamed (Signal/Frequency/Broadcast → starter/pro/studio).
5. Disable any feature flag that gates V2 modules/output layers.
