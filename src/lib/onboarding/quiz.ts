// V2 onboarding behavioral quiz.
// 10 questions that produce a tier recommendation (signal / frequency /
// broadcast). Recommendation is deterministic — no LLM call required.
// The reasoning behind each gate is documented inline so the rules are
// editable without re-reading the spec.

import type { PlanId } from "@/lib/plans";

export type QuizQuestionType =
  | "single_select"
  | "multi_select"
  | "text"
  | "url"
  | "rank";

export interface QuizOption {
  value: string;
  label: string;
}

export interface QuizQuestion {
  id: string;                       // q1, q2, ...
  type: QuizQuestionType;
  prompt: string;
  help?: string;
  placeholder?: string;
  options?: QuizOption[];           // single_select | multi_select | rank
  required?: boolean;
  measures: string;                 // human-readable "what this question measures"
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    type: "single_select",
    prompt: "How many pieces of content did you ship in the last 30 days?",
    measures: "Production capacity baseline",
    required: true,
    options: [
      { value: "0", label: "Zero — life happened" },
      { value: "1_4", label: "1–4" },
      { value: "5_15", label: "5–15" },
      { value: "16_plus", label: "16+" },
    ],
  },
  {
    id: "q2",
    type: "url",
    prompt: "Pick the song you released most recently. What's the link?",
    help: "Spotify / Apple / Bandcamp / SoundCloud — any public link works. Skip if you have no public release yet.",
    placeholder: "https://open.spotify.com/track/...",
    measures: "Whether real catalog exists; calibrates downstream prompts",
  },
  {
    id: "q3",
    type: "single_select",
    prompt: "When you posted last, did you check the analytics?",
    measures: "Feedback-loop readiness",
    required: true,
    options: [
      { value: "never", label: "Never — I post and move on" },
      { value: "skim", label: "Skimmed view counts" },
      { value: "read", label: "Read carefully — saves, sends, follows-from" },
      { value: "logged", label: "Logged it somewhere I can look back at" },
    ],
  },
  {
    id: "q4",
    type: "single_select",
    prompt:
      "If a fan DM'd you for merch right now, what would you sell them?",
    measures: "Revenue maturity",
    required: true,
    options: [
      { value: "nothing", label: "Nothing — I'd say thanks and move on" },
      { value: "improvise", label: "I'd improvise — find a t-shirt site" },
      { value: "link", label: "I have a link / Bandcamp / a thing" },
      { value: "ladder", label: "I have a 3-tier offer ladder ready" },
    ],
  },
  {
    id: "q5",
    type: "single_select",
    prompt:
      "Last 4 weeks — pick the closest: total time spent on artist business?",
    help: "Honest. The system shrinks to fit your time budget.",
    measures: "Sustainable cadence target",
    required: true,
    options: [
      { value: "lt_2", label: "<2 hours/week" },
      { value: "2_5", label: "2–5 hours/week" },
      { value: "5_15", label: "5–15 hours/week" },
      { value: "15_plus", label: "15+ hours/week" },
    ],
  },
  {
    id: "q6",
    type: "rank",
    prompt:
      "Drag-rank what you'd give up FIRST if a week fell apart (top = give up first):",
    help: "Reveals your real priorities — not the ones you'd state.",
    measures: "Revealed priorities under stress",
    required: true,
    options: [
      { value: "songwriting", label: "Songwriting" },
      { value: "posting", label: "Posting content" },
      { value: "fan_replies", label: "Replying to fans" },
      { value: "admin", label: "Admin / business work" },
    ],
  },
  {
    id: "q7",
    type: "single_select",
    prompt:
      "Have you ever paid for a sync placement service, distro premium, or PR push?",
    measures: "Investment readiness",
    required: true,
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "q8",
    type: "url",
    prompt: "Show us your last post.",
    help: "URL to a public IG / TikTok / YouTube / X post. We use it to calibrate.",
    placeholder: "https://...",
    measures: "Real artifact (calibrates difficulty / tone)",
  },
  {
    id: "q9",
    type: "single_select",
    prompt: "Which is closest to you?",
    measures: "The actual bottleneck — drives Director's first-week prompts",
    required: true,
    options: [
      {
        value: "figure_out",
        label: "I need to figure out what to make",
      },
      {
        value: "ship_consistently",
        label: "I know what to make, can't ship consistently",
      },
      {
        value: "cant_grow",
        label: "I ship consistently, can't grow",
      },
    ],
  },
  {
    id: "q10",
    type: "text",
    prompt:
      "If we built this for you, what would success look like in 90 days?",
    help: "Open-ended. Be specific. We seed your streak goal from this.",
    placeholder:
      "10 sync supervisor introductions taken; 2 placements pitched; first 100 paid fans on a Patreon equivalent.",
    measures: "Goal calibration + streak seed",
  },
];

export interface QuizResponses {
  q1?: string;
  q2?: string;
  q3?: string;
  q4?: string;
  q5?: string;
  q6?: string[]; // ordered
  q7?: string;
  q8?: string;
  q9?: string;
  q10?: string;
}

export type RecommendedTier = "signal" | "frequency" | "broadcast";

export interface TierSignals {
  floor: RecommendedTier;
  ceiling: RecommendedTier;
  system_fit: "manual_entry" | "ready_for_automation";
  recommendation: RecommendedTier;
  reasoning: string[];
}

const TIER_TO_PLAN: Record<RecommendedTier, PlanId> = {
  signal: "starter",
  frequency: "pro",
  broadcast: "studio",
};

const TIER_ORDER: RecommendedTier[] = ["signal", "frequency", "broadcast"];

function lower(a: RecommendedTier, b: RecommendedTier): RecommendedTier {
  return TIER_ORDER.indexOf(a) <= TIER_ORDER.indexOf(b) ? a : b;
}

// Deterministic recommendation. Q1+Q5+Q9 set the FLOOR (you can't operate the
// system if you don't have the production capacity). Q4+Q7 set the CEILING
// (you can't use Broadcast features without an existing offer concept).
// Q3+Q8 set system_fit (which surfaces in onboarding copy, not in tier).
export function recommendTier(r: QuizResponses): TierSignals {
  const reasoning: string[] = [];

  // ── Floor ──
  let floor: RecommendedTier = "signal";

  const ships30 = r.q1;
  const hours = r.q5;
  const bottleneck = r.q9;

  if (ships30 && ships30 !== "0" && hours && hours !== "lt_2") {
    floor = "frequency";
    reasoning.push(
      "Floor → Frequency: you're already shipping and have ≥2 hr/week to operate the system.",
    );
  } else {
    reasoning.push(
      "Floor → Signal: shipping cadence or weekly hours are below the threshold to operate the full system.",
    );
  }

  if (
    ships30 === "16_plus" &&
    hours === "15_plus" &&
    bottleneck === "cant_grow"
  ) {
    floor = "broadcast";
    reasoning.push(
      "Floor lifted to Broadcast: high cadence + high hours + the bottleneck is growth, not production.",
    );
  }

  // ── Ceiling ──
  let ceiling: RecommendedTier = "broadcast";

  const offer = r.q4;
  const invested = r.q7 === "yes";

  if (offer === "nothing" && !invested) {
    ceiling = "signal";
    reasoning.push(
      "Ceiling → Signal: no existing offer concept and no prior investment — Broadcast features would sit unused.",
    );
  } else if (offer === "nothing" || offer === "improvise") {
    ceiling = "frequency";
    reasoning.push(
      "Ceiling → Frequency: offer maturity is light; Broadcast (segmentation, campaigns) overshoots.",
    );
  } else {
    reasoning.push(
      "Ceiling → Broadcast: offer concept exists or you've invested before — full toolkit is in range.",
    );
  }

  // ── System fit (advisory only) ──
  const analyticsHabit = r.q3;
  const system_fit: TierSignals["system_fit"] =
    analyticsHabit === "logged" || analyticsHabit === "read"
      ? "ready_for_automation"
      : "manual_entry";

  // ── Recommendation = lower of floor / ceiling ──
  const recommendation = lower(floor, ceiling);

  return { floor, ceiling, system_fit, recommendation, reasoning };
}

export function tierToPlanId(tier: RecommendedTier): PlanId {
  return TIER_TO_PLAN[tier];
}

export function tierLabel(tier: RecommendedTier): string {
  return tier === "signal"
    ? "Starter"
    : tier === "frequency"
      ? "Pro Catalog"
      : "Sync Prepared";
}

export function tierTagline(tier: RecommendedTier): string {
  return tier === "signal"
    ? "We tell you what to ship. Templates, hook bank, guided weekly plan."
    : tier === "frequency"
      ? "We run the system with you. Full Brand Journey, Content Engine, weekly Feedback Loop."
      : "We help you scale and segment. Audience modeling, campaign builder, monetization automations.";
}

// Validate a payload before saving — required questions must be answered.
export function quizIsComplete(r: QuizResponses): boolean {
  for (const q of QUIZ_QUESTIONS) {
    if (!q.required) continue;
    const v = (r as Record<string, unknown>)[q.id];
    if (q.type === "rank") {
      if (!Array.isArray(v) || v.length !== (q.options?.length ?? 0))
        return false;
    } else {
      if (typeof v !== "string" || v.trim().length === 0) return false;
    }
  }
  return true;
}
