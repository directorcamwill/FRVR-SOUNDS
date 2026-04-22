// Brand Journey — static question data for the 4 MVP modules.
// The Brand tab renders these linearly; each answer maps to a brand_wiki field
// (and to a brand_module_responses row for the raw-answer audit trail).
//
// Adding a new module: append to BRAND_MODULES. Adding a new question: append
// to module.questions. Field_key must match a column on brand_wiki (or a
// composite write handled in the API route).

import type { BrandModuleId } from "@/types/brand";

export type AnswerInputType =
  | "text"          // single-line
  | "textarea"      // multi-line narrative
  | "chips"         // array of short strings (controlled vocab optional)
  | "templated"     // templated sentence with N labeled slots → joined string
  | "two_box"       // before/after → writes TWO fields
  | "intensity_dial" // 2 sliders + notes → writes 3 fields (energy/intensity/notes)
  | "multi_field"   // N labeled slots, each mapped to a distinct wiki column
  | "repeater";     // array of objects with a known sub-schema

export interface MultiFieldSlot {
  label: string;
  placeholder?: string;
  field_key: string;           // target brand_wiki column for this slot
  input_type?: "text" | "number" | "color";
}

export interface RepeaterField {
  field: string;
  label: string;
  placeholder?: string;
}

export interface TemplatedSlot {
  label: string;
  placeholder?: string;
}

export interface BrandQuestion {
  id: string;              // e.g., "identity.core_pain"
  module_id: BrandModuleId;
  field_key: string;       // target brand_wiki column (or primary column for composite types)
  prompt: string;
  help?: string;
  placeholder?: string;
  input: AnswerInputType;

  // text / textarea
  minLength?: number;
  maxLength?: number;
  requireNoun?: boolean;

  // chips
  minChips?: number;
  maxChips?: number;
  chipOptions?: string[];   // controlled-vocab suggestions; user may still add custom

  // templated / two_box
  templatedSlots?: TemplatedSlot[];
  templatedJoiner?: string; // default: slots joined with space + connective words

  // multi_field
  multiFields?: MultiFieldSlot[];

  // intensity_dial
  energyLabel?: string;     // "Energy (1–10)"
  intensityLabel?: string;  // "Intensity (1–10)"
  notesLabel?: string;

  // repeater
  repeaterMin?: number;
  repeaterMax?: number;
  repeaterSchema?: RepeaterField[];

  // reference examples shown in a collapsible
  strongExample?: string;
  weakExample?: string;
}

export interface BrandModule {
  id: BrandModuleId;
  label: string;
  tagline: string;
  order: number;
  questions: BrandQuestion[];
}

// ── Controlled vocab (reused across emotional questions) ──────────────────

const EMOTION_OPTIONS = [
  "longing",
  "reverent",
  "propulsive",
  "nocturnal",
  "grief",
  "euphoric",
  "tense",
  "intimate",
  "defiant",
  "hopeful",
  "lonely",
  "powerful",
  "numb",
  "restless",
];

const SUPERVISOR_TAG_OPTIONS = [
  "cinematic",
  "nocturnal",
  "slow-burn",
  "tension",
  "euphoric",
  "melancholic",
  "hypnotic",
  "anthemic",
  "introspective",
  "raw",
  "polished",
  "sparse",
  "layered",
  "organic",
  "synthetic",
  "driving",
  "ambient",
];

// ── Modules ───────────────────────────────────────────────────────────────

export const BRAND_MODULES: BrandModule[] = [
  {
    id: "identity",
    label: "Identity",
    tagline: "The human truth under the artist.",
    order: 1,
    questions: [
      {
        id: "identity.core_pain",
        module_id: "identity",
        field_key: "core_pain",
        prompt:
          "What pain does your music resolve for your listener that no other song in their queue can?",
        help: "Not a genre. A specific feeling in a specific moment.",
        input: "textarea",
        minLength: 40,
        requireNoun: true,
        placeholder:
          "The feeling of driving home at 2am after you said the thing you couldn't take back.",
        strongExample:
          "That 2am drive home after you said the thing you couldn't take back. My music is the silence after.",
        weakExample: "Sad feelings. Happy feelings. Relatable vibes.",
      },
      {
        id: "identity.origin_story",
        module_id: "identity",
        field_key: "origin_story",
        prompt:
          "Tell me the moment your artist identity started. A specific memory — not a career summary.",
        help: "Include a place, a person, or an age. Anchors make it real.",
        input: "textarea",
        minLength: 80,
        requireNoun: true,
        placeholder:
          "I was 16 in my uncle's basement in Memphis, the night I heard Sade's Lovers Rock for the first time.",
        strongExample:
          "I was 16 in my uncle's basement in Memphis when I heard Sade's Lovers Rock — the way the bass breathed. I stopped trying to write pop hooks that night.",
        weakExample: "I've always loved music since I was a kid.",
      },
      {
        id: "identity.transformation",
        module_id: "identity",
        field_key: "transformation_before",
        prompt: "Before your music → after. What changes in the listener?",
        help: "Two words or a short phrase in each box.",
        input: "two_box",
        templatedSlots: [
          {
            label: "Before they press play",
            placeholder: "numb, scrolling, distracted",
          },
          {
            label: "After the song ends",
            placeholder: "present, reflective, ready to call someone",
          },
        ],
      },
      {
        id: "identity.core_beliefs",
        module_id: "identity",
        field_key: "core_beliefs",
        prompt:
          "3–5 non-negotiable beliefs that shape what you'll and won't make.",
        help: "Rules, not preferences. What would you turn down a sync for?",
        input: "chips",
        minChips: 3,
        maxChips: 5,
        placeholder: "Never use autotune as a crutch",
      },
      {
        id: "identity.key_themes",
        module_id: "identity",
        field_key: "key_themes",
        prompt: "The 3–5 themes every record of yours circles back to.",
        help: "The list of places your songs keep returning to.",
        input: "chips",
        minChips: 3,
        maxChips: 5,
        placeholder: "Distance / Memory / Return",
      },
    ],
  },

  {
    id: "emotional",
    label: "Emotional Signature",
    tagline: "The emotional territory the music owns.",
    order: 2,
    questions: [
      {
        id: "emotional.desired",
        module_id: "emotional",
        field_key: "desired_emotions",
        prompt:
          "What do you want the listener to feel in the first 15 seconds?",
        help: "2–4 emotions. Specific, not polite.",
        input: "chips",
        minChips: 2,
        maxChips: 4,
        chipOptions: EMOTION_OPTIONS,
      },
      {
        id: "emotional.natural",
        module_id: "emotional",
        field_key: "natural_emotions",
        prompt:
          "What do listeners actually say they feel? If nothing yet, what does your best demo evoke in friends?",
        help: "Real feedback beats what you want them to feel.",
        input: "chips",
        minChips: 2,
        maxChips: 4,
        chipOptions: EMOTION_OPTIONS,
      },
      {
        id: "emotional.tags",
        module_id: "emotional",
        field_key: "emotional_tags",
        prompt: "Pick 5 tags a music supervisor would type to find your sound.",
        help: "Search terms, not adjectives. What would they type into a library search?",
        input: "chips",
        minChips: 5,
        chipOptions: SUPERVISOR_TAG_OPTIONS,
      },
      {
        id: "emotional.intensity",
        module_id: "emotional",
        field_key: "energy_marker",
        prompt: "Where on the dial does your music sit?",
        help: "Set the energy (how loud/driving) and intensity (how heavy emotionally). Add a note if it changes.",
        input: "intensity_dial",
        energyLabel: "Energy — quiet 1 ↔ 10 loud",
        intensityLabel: "Intensity — easy 1 ↔ 10 heavy",
        notesLabel:
          "Notes (optional) — when your music breaks this scale",
      },
    ],
  },

  {
    id: "positioning",
    label: "Positioning",
    tagline: "The lane you stake.",
    order: 3,
    questions: [
      {
        id: "positioning.statement",
        module_id: "positioning",
        field_key: "positioning_statement",
        prompt: 'One sentence: "For ___, we make ___ that ___."',
        help: "Bed Stuy at 2am, not 'music for everyone'.",
        input: "templated",
        templatedSlots: [
          {
            label: "For (audience)",
            placeholder: "indie filmmakers on prestige drama",
          },
          {
            label: "We make (format)",
            placeholder: "slow-burning R&B scores",
          },
          {
            label: "That (outcome)",
            placeholder: "land the quiet character moment without upstaging it",
          },
        ],
      },
      {
        id: "positioning.differentiators",
        module_id: "positioning",
        field_key: "differentiators",
        prompt: "3 things you do that 90% of artists in your lane don't.",
        help: "Not values, moves. Things you do on a session.",
        input: "chips",
        minChips: 3,
      },
      {
        id: "positioning.category_lane",
        module_id: "positioning",
        field_key: "category_lane",
        prompt:
          "One sentence a stranger would repeat verbatim to describe your lane.",
        help: "Shorter than your bio. Bigger than your genre.",
        input: "text",
        maxLength: 120,
        placeholder:
          "The dark cinematic R&B guy for prestige drama.",
      },
      {
        id: "positioning.what_not",
        module_id: "positioning",
        field_key: "what_not",
        prompt:
          "3 adjacent lanes you get confused with — and what you do differently.",
        input: "repeater",
        repeaterMin: 2,
        repeaterMax: 5,
        repeaterSchema: [
          {
            field: "confused_with",
            label: "Confused with",
            placeholder: "moody indie R&B",
          },
          {
            field: "difference",
            label: "What you do differently",
            placeholder: "no vocal runs, all architecture",
          },
        ],
      },
      {
        id: "positioning.competitive",
        module_id: "positioning",
        field_key: "competitive_contrast",
        prompt:
          "Name 2 artists you get compared to. What do you do that they don't?",
        input: "repeater",
        repeaterMin: 2,
        repeaterMax: 4,
        repeaterSchema: [
          {
            field: "artist",
            label: "Artist",
            placeholder: "The Weeknd",
          },
          {
            field: "difference",
            label: "What you do that they don't",
            placeholder: "no pop hooks, orchestral bed, leave more space",
          },
        ],
      },
    ],
  },

  {
    id: "audience",
    label: "Audience",
    tagline: "Make the listener a real person.",
    order: 4,
    questions: [
      {
        id: "audience.primary",
        module_id: "audience",
        field_key: "primary_audience",
        prompt: "Who is the single person listening?",
        help: "Age + role + city archetype + 1 specific detail.",
        input: "text",
        minLength: 20,
        requireNoun: true,
        placeholder:
          "32-year-old script supervisor in Silver Lake who runs 5 miles before coffee.",
      },
      {
        id: "audience.pain",
        module_id: "audience",
        field_key: "audience_pain_points",
        prompt: "3 things they're trying to escape or process.",
        input: "chips",
        minChips: 3,
        maxChips: 6,
      },
      {
        id: "audience.desires",
        module_id: "audience",
        field_key: "audience_desires",
        prompt: "3 things they're trying to feel or become.",
        input: "chips",
        minChips: 3,
        maxChips: 6,
      },
      {
        id: "audience.lifestyle",
        module_id: "audience",
        field_key: "audience_lifestyle_context",
        prompt: "Where and when does your music enter their day?",
        help: "2–3 concrete scenarios. Place + time + what they're doing.",
        input: "chips",
        minChips: 2,
        maxChips: 4,
      },
      {
        id: "audience.identity_goals",
        module_id: "audience",
        field_key: "audience_identity_goals",
        prompt:
          "What does listening to your music let them believe about themselves?",
        input: "textarea",
        minLength: 20,
      },
    ],
  },

  {
    id: "visual",
    label: "Visual DNA",
    tagline: "How your brand looks before a word is said.",
    order: 5,
    questions: [
      {
        id: "visual.palette",
        module_id: "visual",
        field_key: "color_primary",
        prompt: "Three hex colors that are your brand.",
        help: "Primary is what people remember. Accent is the punctuation. Paste any hex — we'll validate later.",
        input: "multi_field",
        multiFields: [
          {
            label: "Primary",
            field_key: "color_primary",
            placeholder: "#DC2626",
            input_type: "color",
          },
          {
            label: "Secondary",
            field_key: "color_secondary",
            placeholder: "#050505",
            input_type: "color",
          },
          {
            label: "Accent",
            field_key: "color_accent",
            placeholder: "#c0c8d8",
            input_type: "color",
          },
        ],
      },
      {
        id: "visual.textures",
        module_id: "visual",
        field_key: "texture_keywords",
        prompt: "The texture vocabulary of your world.",
        help: "Words a set designer would hear. Not colors — materials and finishes.",
        input: "chips",
        minChips: 3,
        maxChips: 8,
        chipOptions: [
          "chrome",
          "film grain",
          "warm tape",
          "dark gloss",
          "matte",
          "concrete",
          "smoke",
          "neon glow",
          "velvet",
          "linen",
          "brass",
          "rain",
          "VHS",
          "pencil shading",
        ],
      },
      {
        id: "visual.typography",
        module_id: "visual",
        field_key: "font_heading",
        prompt: "Two typefaces — headline and body.",
        help: "A heavy serif or condensed grotesk for headlines. Something humane for body.",
        input: "multi_field",
        multiFields: [
          {
            label: "Heading font",
            field_key: "font_heading",
            placeholder: "Playfair Display",
          },
          {
            label: "Body font",
            field_key: "font_body",
            placeholder: "Inter",
          },
        ],
      },
      {
        id: "visual.marks",
        module_id: "visual",
        field_key: "logo_url",
        prompt: "Your marks.",
        help: "Paste URLs if you have them. Leave blank for later.",
        input: "multi_field",
        multiFields: [
          {
            label: "Logo URL",
            field_key: "logo_url",
            placeholder: "https://...",
          },
          {
            label: "Icon / avatar URL",
            field_key: "icon_url",
            placeholder: "https://...",
          },
        ],
      },
      {
        id: "visual.photos",
        module_id: "visual",
        field_key: "press_photo_urls",
        prompt: "Press photo URLs.",
        help: "2–4 images that represent you now, not 2019.",
        input: "chips",
        minChips: 0,
        maxChips: 6,
        placeholder: "https://...",
      },
    ],
  },

  {
    id: "sonic",
    label: "Sound DNA",
    tagline: "What the music sounds like before anyone knows it's you.",
    order: 6,
    questions: [
      {
        id: "sonic.genres",
        module_id: "sonic",
        field_key: "sonic_genre_primary",
        prompt: "Primary and secondary genre.",
        help: "Primary is where a supervisor would file you. Secondary is what makes it not boring.",
        input: "multi_field",
        multiFields: [
          {
            label: "Primary genre",
            field_key: "sonic_genre_primary",
            placeholder: "Dark cinematic R&B",
          },
          {
            label: "Secondary genre",
            field_key: "sonic_genre_secondary",
            placeholder: "Ambient soul",
          },
        ],
      },
      {
        id: "sonic.moods",
        module_id: "sonic",
        field_key: "sonic_moods",
        prompt: "3–5 moods the music lives in.",
        help: "A music library searcher would type these verbatim.",
        input: "chips",
        minChips: 3,
        maxChips: 6,
        chipOptions: [
          "tense",
          "moody",
          "late-night",
          "cinematic",
          "euphoric",
          "melancholic",
          "hypnotic",
          "driving",
          "anthemic",
          "intimate",
          "mysterious",
          "triumphant",
          "heartbroken",
          "dangerous",
        ],
      },
      {
        id: "sonic.bpm_range",
        module_id: "sonic",
        field_key: "sonic_bpm_min",
        prompt: "Typical BPM range.",
        help: "The range 80% of your catalog sits in. Outliers don't count.",
        input: "multi_field",
        multiFields: [
          {
            label: "BPM min",
            field_key: "sonic_bpm_min",
            placeholder: "72",
            input_type: "number",
          },
          {
            label: "BPM max",
            field_key: "sonic_bpm_max",
            placeholder: "96",
            input_type: "number",
          },
        ],
      },
      {
        id: "sonic.textures",
        module_id: "sonic",
        field_key: "sonic_texture_keywords",
        prompt: "3–5 sonic textures that recur in your records.",
        help: "Engineer-speak. The things you can't help but reach for.",
        input: "chips",
        minChips: 3,
        maxChips: 6,
        chipOptions: [
          "warm tape",
          "sub-bass heavy",
          "airy reverb",
          "vinyl crackle",
          "muted piano",
          "close-mic vocal",
          "tape saturation",
          "side-chain pulse",
          "orchestral bed",
          "drum machine swing",
          "fingerpicked guitar",
          "analog synth wash",
        ],
      },
      {
        id: "sonic.references",
        module_id: "sonic",
        field_key: "reference_tracks",
        prompt: "3 reference tracks — and what to borrow from each.",
        help: "Not your whole playlist. The 3 songs that tell a producer how to handle yours.",
        input: "repeater",
        repeaterMin: 2,
        repeaterMax: 5,
        repeaterSchema: [
          {
            field: "artist",
            label: "Artist",
            placeholder: "Frank Ocean",
          },
          {
            field: "title",
            label: "Track",
            placeholder: "Pink + White",
          },
          {
            field: "why",
            label: "What to borrow (not imitate)",
            placeholder: "The harmonic texture, not the vocal delivery",
          },
        ],
      },
    ],
  },

  {
    id: "routes",
    label: "Routes",
    tagline: "The lanes your music goes to work.",
    order: 7,
    questions: [
      {
        id: "routes.format_targets",
        module_id: "routes",
        field_key: "sync_format_targets",
        prompt: "Which sync formats are you actually chasing?",
        help: "Not every format makes sense. Pick the 3–5 where your sound lives.",
        input: "chips",
        minChips: 3,
        maxChips: 8,
        chipOptions: [
          "tv_episode",
          "film",
          "ad_30",
          "ad_60",
          "ad_15",
          "trailer",
          "game",
          "web_social",
          "podcast",
          "library",
        ],
      },
      {
        id: "routes.format_avoids",
        module_id: "routes",
        field_key: "avoid_sync_formats",
        prompt:
          "Which formats should your catalog NEVER get pitched to?",
        help: "Saying no upfront prevents bad placements that burn your brand.",
        input: "chips",
        minChips: 0,
        maxChips: 6,
        chipOptions: [
          "tv_episode",
          "film",
          "ad_30",
          "ad_60",
          "ad_15",
          "trailer",
          "game",
          "web_social",
          "podcast",
          "library",
        ],
      },
      {
        id: "routes.library_targets",
        module_id: "routes",
        field_key: "sync_library_targets",
        prompt: "Which libraries / placement homes is your music built for?",
        help: "Names of libraries, agencies, or music houses you'd submit to first.",
        input: "chips",
        minChips: 2,
        maxChips: 8,
        placeholder: "Heavy Hitters, Audiio, Musicbed, APM",
      },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────

export function getModule(id: BrandModuleId): BrandModule | undefined {
  return BRAND_MODULES.find((m) => m.id === id);
}

export function getQuestion(questionId: string): BrandQuestion | undefined {
  for (const m of BRAND_MODULES) {
    const q = m.questions.find((x) => x.id === questionId);
    if (q) return q;
  }
  return undefined;
}

export function firstModule(): BrandModule {
  return BRAND_MODULES[0];
}

export function nextQuestion(
  moduleId: BrandModuleId,
  currentQuestionId: string | null
): { moduleId: BrandModuleId; questionId: string } | null {
  const mod = getModule(moduleId);
  if (!mod) return null;
  const idx =
    currentQuestionId == null
      ? -1
      : mod.questions.findIndex((q) => q.id === currentQuestionId);
  if (idx + 1 < mod.questions.length) {
    return { moduleId: mod.id, questionId: mod.questions[idx + 1].id };
  }
  // advance to next module's first question
  const nextMod = BRAND_MODULES.find((m) => m.order === mod.order + 1);
  if (nextMod) {
    return { moduleId: nextMod.id, questionId: nextMod.questions[0].id };
  }
  return null;
}

export function prevQuestion(
  moduleId: BrandModuleId,
  currentQuestionId: string
): { moduleId: BrandModuleId; questionId: string } | null {
  const mod = getModule(moduleId);
  if (!mod) return null;
  const idx = mod.questions.findIndex((q) => q.id === currentQuestionId);
  if (idx > 0) {
    return { moduleId: mod.id, questionId: mod.questions[idx - 1].id };
  }
  const prevMod = BRAND_MODULES.find((m) => m.order === mod.order - 1);
  if (prevMod) {
    return {
      moduleId: prevMod.id,
      questionId: prevMod.questions[prevMod.questions.length - 1].id,
    };
  }
  return null;
}
