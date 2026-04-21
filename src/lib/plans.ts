// Plan definitions — the single source of truth for feature gating across
// the app. Subscriptions reference plan_id; features are looked up here.
//
// Adding a new feature: add the key to FeatureKey, add the allowlist per
// plan in PLANS[planId].features, call hasFeature() wherever you gate UI
// or server routes.

export type PlanId = "starter" | "pro" | "studio" | "internal";

export type FeatureKey =
  // Core & read-only (all paying plans)
  | "song_vault"
  | "brand_wiki_edit"
  | "sync_directory"
  | "placements_reference"
  | "supervisor_directory"
  | "song_lab_projects"
  // Pro+
  | "ai_brand_director"
  | "ai_producer"
  | "ai_songwriter"
  | "ai_collab"
  | "ai_brand_fit"
  | "ai_opportunity_scanner"
  | "ai_content_director"
  | "placement_matcher"
  | "supervisor_matcher"
  | "pattern_intelligence"
  | "guided_recommendations"
  | "pipeline_tracking"
  | "package_builder"
  // Studio only
  | "metaphor_hub"
  | "money_llc"
  | "priority_library_submission"
  | "monthly_strategy_call"
  | "early_access";

export interface PlanDefinition {
  id: PlanId;
  name: string;
  tagline: string;
  priceMonthly: number | null; // USD/month; null for internal
  features: FeatureKey[];
  agent_run_quota: number | null; // null = unlimited
  song_vault_cap: number | null; // null = unlimited
  stripe_price_id_env?: string; // env var name holding the Stripe price ID
  highlight?: boolean; // rendered "most popular"
  visible_in_pricing: boolean; // internal plan shouldn't show up to end users
}

const STARTER_FEATURES: FeatureKey[] = [
  "song_vault",
  "brand_wiki_edit",
  "sync_directory",
  "placements_reference",
  "supervisor_directory",
  "song_lab_projects",
];

const PRO_FEATURES: FeatureKey[] = [
  ...STARTER_FEATURES,
  "ai_brand_director",
  "ai_producer",
  "ai_songwriter",
  "ai_collab",
  "ai_brand_fit",
  "ai_opportunity_scanner",
  "ai_content_director",
  "placement_matcher",
  "supervisor_matcher",
  "pattern_intelligence",
  "guided_recommendations",
  "pipeline_tracking",
  "package_builder",
];

const STUDIO_FEATURES: FeatureKey[] = [
  ...PRO_FEATURES,
  "metaphor_hub",
  "money_llc",
  "priority_library_submission",
  "monthly_strategy_call",
  "early_access",
];

export const PLANS: Record<PlanId, PlanDefinition> = {
  starter: {
    id: "starter",
    name: "Starter",
    tagline: "Core artist toolkit. Organize your catalog and learn sync the right way.",
    priceMonthly: 49,
    features: STARTER_FEATURES,
    agent_run_quota: 5,
    song_vault_cap: 10,
    stripe_price_id_env: "STRIPE_PRICE_STARTER",
    visible_in_pricing: true,
  },
  pro: {
    id: "pro",
    name: "Pro",
    tagline: "Full AI guidance + matching. Pitch-ready.",
    priceMonthly: 199,
    features: PRO_FEATURES,
    agent_run_quota: 100,
    song_vault_cap: null,
    stripe_price_id_env: "STRIPE_PRICE_PRO",
    highlight: true,
    visible_in_pricing: true,
  },
  studio: {
    id: "studio",
    name: "Studio",
    tagline: "White-glove catalog operator. Unlimited agents, priority library intake, direct strategy calls.",
    priceMonthly: 499,
    features: STUDIO_FEATURES,
    agent_run_quota: null,
    song_vault_cap: null,
    stripe_price_id_env: "STRIPE_PRICE_STUDIO",
    visible_in_pricing: true,
  },
  internal: {
    id: "internal",
    name: "Internal",
    tagline: "Operator account — full access.",
    priceMonthly: null,
    features: STUDIO_FEATURES,
    agent_run_quota: null,
    song_vault_cap: null,
    visible_in_pricing: false,
  },
};

export function getPlan(planId: string | null | undefined): PlanDefinition {
  if (planId && planId in PLANS) return PLANS[planId as PlanId];
  return PLANS.internal;
}

export function planHasFeature(planId: PlanId, key: FeatureKey): boolean {
  return PLANS[planId].features.includes(key);
}

export function visiblePricingPlans(): PlanDefinition[] {
  return Object.values(PLANS).filter((p) => p.visible_in_pricing);
}
