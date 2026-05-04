// Which FRVR agents read from which Brand Journey modules.
// Used by the Wiki Globe dossier to show "agents reading this module" and
// by any future per-module analytics.

import type { BrandModuleId } from "@/types/brand";

export interface AgentLink {
  id: string;
  label: string;
  purpose: string;
  href?: string;
}

// Canonical map — every agent is only listed under the modules it actually
// reads fields from. Update in tandem with the buildUserMessage / brandContextToPrompt
// functions on each agent.
export const MODULE_AGENTS: Record<BrandModuleId, AgentLink[]> = {
  identity: [
    {
      id: "brand_director",
      label: "Brand Director",
      purpose: "Generates bios + elevator pitch from Identity.",
    },
    {
      id: "songwriter",
      label: "Songwriter",
      purpose: "Uses core_pain + transformation + key_themes in lyric drafts.",
      href: "/song-lab",
    },
    {
      id: "content_director",
      label: "Content Director",
      purpose: "Anchors posts in your origin story + key themes.",
      href: "/content",
    },
    {
      id: "collab",
      label: "Collab",
      purpose: "Uses your niche + key themes for collaborator intros.",
    },
  ],
  emotional: [
    {
      id: "content_director",
      label: "Content Director",
      purpose: "Pulls desired_emotions + emotional_tags into caption tone.",
      href: "/content",
    },
    {
      id: "brand_fit",
      label: "Brand Fit",
      purpose: "Scores tracks against your emotional territory.",
      href: "/vault",
    },
    {
      id: "placement_matcher",
      label: "Placement Matcher",
      purpose: "Weighs emotional_tags in sync matching.",
      href: "/placements",
    },
    {
      id: "producer",
      label: "Producer",
      purpose: "Uses energy + intensity markers for arrangement direction.",
      href: "/song-lab",
    },
  ],
  positioning: [
    {
      id: "content_director",
      label: "Content Director",
      purpose: "Leads press + bio copy with your positioning statement.",
      href: "/content",
    },
    {
      id: "collab",
      label: "Collab",
      purpose: "Pitches via your differentiators + competitive contrast.",
    },
    {
      id: "sync_brief",
      label: "Sync Brief",
      purpose: "Filters briefs by your category_lane.",
      href: "/pipeline",
    },
    {
      id: "supervisor_matcher",
      label: "Supervisor Matcher",
      purpose: "Uses category_lane + what_not to exclude bad-fit supervisors.",
      href: "/supervisors",
    },
  ],
  audience: [
    {
      id: "content_director",
      label: "Content Director",
      purpose: "Drafts posts to your primary audience + their desires.",
      href: "/content",
    },
    {
      id: "songwriter",
      label: "Songwriter",
      purpose: "Uses audience_identity_goals to shape emotional targets.",
      href: "/song-lab",
    },
    {
      id: "collab",
      label: "Collab",
      purpose: "Filters collaborators by audience overlap.",
    },
  ],
  visual: [
    {
      id: "content_director",
      label: "Content Director",
      purpose: "Uses palette + textures for art direction notes.",
      href: "/content",
    },
  ],
  sonic: [
    {
      id: "producer",
      label: "Producer",
      purpose: "Reads full Sonic DNA + references for production blueprint.",
      href: "/song-lab",
    },
    {
      id: "brand_fit",
      label: "Brand Fit",
      purpose: "Grades tracks on genre + moods + BPM + textures.",
      href: "/vault",
    },
    {
      id: "guided_recs",
      label: "Guided Recs",
      purpose: "Recommendation algorithm uses your sonic preferences.",
      href: "/vault",
    },
  ],
  routes: [
    {
      id: "sync_brief",
      label: "Sync Brief",
      purpose: "Filters opportunities to your format targets.",
      href: "/pipeline",
    },
    {
      id: "placement_matcher",
      label: "Placement Matcher",
      purpose: "Scores placements against your target formats.",
      href: "/placements",
    },
    {
      id: "supervisor_matcher",
      label: "Supervisor Matcher",
      purpose: "Prioritizes supervisors working in your target formats.",
      href: "/supervisors",
    },
  ],
  engine: [
    {
      id: "weekly_execution",
      label: "Weekly Execution",
      purpose:
        "Runs your hook library, calendar, and Content Fit scoring in one screen.",
      href: "/execution",
    },
    {
      id: "content_director",
      label: "Content Director",
      purpose:
        "Reads your pillars + cadence + hooks to draft this week's posts.",
      href: "/content",
    },
  ],
};

// Short one-liner per module, shown in the dossier header.
export const MODULE_DESCRIPTIONS: Record<BrandModuleId, string> = {
  identity:
    "The human truth under the artist. Core pain resolved, origin story, transformation arc, beliefs, themes.",
  emotional:
    "The emotional territory the music owns. Desired vs natural emotions, supervisor-search tags, energy + intensity dial.",
  positioning:
    "The lane you stake. Positioning statement, differentiators, category lane, what you're not, competitive contrast.",
  audience:
    "Who is the single person listening. Age + role + context + pain + desires + identity goals.",
  visual:
    "How your brand looks before a word is said. Palette, textures, typography, logo marks, press photos.",
  sonic:
    "What the music sounds like before anyone knows it's you. Genre, moods, BPM, textures, reference tracks.",
  routes:
    "The lanes your music goes to work. Sync format targets, libraries, formats to avoid. V2: primary revenue path + 100/1k/10k offer ladder.",
  engine:
    "Where identity becomes weekly output. Pillars, formats, platform mapping, weekly cadence, hook library, conversion path.",
};
