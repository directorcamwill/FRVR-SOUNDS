import { getPlan, planHasFeature, PLANS, type FeatureKey, type PlanId } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";

export const IMPERSONATE_COOKIE = "frvr.impersonate";

// Server-side: look up the current user's plan + super-admin state and
// decide whether they can access a feature. Super-admins always return true
// (Cameron can use everything). Internal plan = Sync-Prepared-equivalent.
//
// Trial model: a subscription is "in trial" when status='trialing' and
// trial_ends_at is in the future. During trial every user is treated as
// Starter-tier for feature gating, and AI agent runs are capped at 5 total
// regardless of plan. Day 8 → Stripe's customer.subscription.updated webhook
// flips status='active' and the user's full plan features unlock.

const TRIAL_AGENT_RUN_CAP = 5;
const TRIAL_EFFECTIVE_PLAN: PlanId = "starter";

export interface UserAccess {
  profile_id: string;
  artist_id: string | null;
  plan_id: PlanId;
  effective_plan_id: PlanId; // plan_id unless trialing, then "starter"
  is_super_admin: boolean;
  subscription_status: string;
  is_trialing: boolean;
  trial_ends_at: string | null;
  agent_runs_this_period: number;
  agent_runs_limit: number | null; // null = unlimited
  agent_runs_remaining: number | null; // null = unlimited
  // When a super-admin is "viewing as" another artist, artist_id + plan
  // fields reflect the TARGET. is_impersonating gates mutations in
  // feature-guard.ts so admins can look without writing.
  is_impersonating: boolean;
  impersonator_profile_id: string | null;
  impersonated_artist_name: string | null;
}

export async function getUserAccess(): Promise<UserAccess | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();

  const [{ data: artist }, { data: superAdmin }] = await Promise.all([
    admin.from("artists").select("id").eq("profile_id", user.id).single(),
    admin
      .from("super_admins")
      .select("profile_id")
      .eq("profile_id", user.id)
      .maybeSingle(),
  ]);

  const isSuperAdmin = !!superAdmin;

  // Impersonation: super-admin only. Cookie carries a target artist_id; if
  // present we swap the queried artist/subscription context while keeping
  // profile_id + is_super_admin = true (so the admin can stop impersonating).
  let impersonatedArtistId: string | null = null;
  let impersonatedArtistName: string | null = null;
  if (isSuperAdmin) {
    const jar = await cookies();
    const raw = jar.get(IMPERSONATE_COOKIE)?.value;
    if (raw) {
      const { data: target } = await admin
        .from("artists")
        .select("id, artist_name")
        .eq("id", raw)
        .maybeSingle();
      if (target) {
        impersonatedArtistId = target.id;
        impersonatedArtistName = target.artist_name ?? null;
      }
    }
  }

  const effectiveArtistId = impersonatedArtistId ?? artist?.id ?? null;

  let planId: PlanId = "internal";
  let status = "internal";
  let trialEndsAt: string | null = null;
  let runsThisPeriod = 0;
  if (effectiveArtistId) {
    const { data: sub } = await admin
      .from("subscriptions")
      .select("plan_id, status, trial_ends_at, agent_runs_this_period")
      .eq("artist_id", effectiveArtistId)
      .maybeSingle();
    if (sub?.plan_id) planId = sub.plan_id as PlanId;
    if (sub?.status) status = sub.status;
    trialEndsAt = sub?.trial_ends_at ?? null;
    runsThisPeriod = sub?.agent_runs_this_period ?? 0;
  }

  const now = Date.now();
  const trialActive =
    status === "trialing" && !!trialEndsAt && new Date(trialEndsAt).getTime() > now;

  const effectivePlanId: PlanId = trialActive ? TRIAL_EFFECTIVE_PLAN : planId;

  const agentRunsLimit = trialActive
    ? TRIAL_AGENT_RUN_CAP
    : PLANS[planId].agent_run_quota;

  const remaining =
    agentRunsLimit === null ? null : Math.max(0, agentRunsLimit - runsThisPeriod);

  return {
    profile_id: user.id,
    artist_id: effectiveArtistId,
    plan_id: planId,
    effective_plan_id: effectivePlanId,
    is_super_admin: isSuperAdmin,
    subscription_status: status,
    is_trialing: trialActive,
    trial_ends_at: trialEndsAt,
    agent_runs_this_period: runsThisPeriod,
    agent_runs_limit: agentRunsLimit,
    agent_runs_remaining: remaining,
    is_impersonating: !!impersonatedArtistId,
    impersonator_profile_id: impersonatedArtistId ? user.id : null,
    impersonated_artist_name: impersonatedArtistName,
  };
}

export async function hasFeature(key: FeatureKey): Promise<boolean> {
  const access = await getUserAccess();
  if (!access) return false;
  if (access.is_super_admin) return true;
  return planHasFeature(access.effective_plan_id, key);
}

export async function requireFeature(key: FeatureKey) {
  const access = await getUserAccess();
  if (!access)
    return { access: null, ok: false as const, reason: "unauthenticated" };
  if (access.is_super_admin) return { access, ok: true as const };
  if (planHasFeature(access.effective_plan_id, key)) return { access, ok: true as const };

  // Surface trial-specific reason so UI can show "Unlocks when paid" instead of generic upgrade nudge.
  return {
    access,
    ok: false as const,
    reason: access.is_trialing
      ? ("locked_during_trial" as const)
      : ("plan_lacks_feature" as const),
    required_feature: key,
    current_plan: getPlan(access.plan_id),
    plan_if_paid: getPlan(access.plan_id),
  };
}

// Call this BEFORE making any LLM agent call. Returns ok:false with a clear
// reason if the user is at their quota (trial or paid). Increments the counter
// only when ok:true — wrap the increment separately after a successful run.
export async function checkAgentRunQuota(): Promise<
  | { ok: true; access: UserAccess }
  | { ok: false; reason: "unauthenticated" | "quota_exceeded" | "no_subscription"; access: UserAccess | null }
> {
  const access = await getUserAccess();
  if (!access) return { ok: false, reason: "unauthenticated", access: null };
  if (access.is_super_admin) return { ok: true, access };
  if (!access.artist_id)
    return { ok: false, reason: "no_subscription", access };
  if (access.agent_runs_limit === null) return { ok: true, access }; // unlimited
  if (access.agent_runs_this_period >= access.agent_runs_limit)
    return { ok: false, reason: "quota_exceeded", access };
  return { ok: true, access };
}

// Atomically increment the run counter. Call after a successful agent execution.
export async function incrementAgentRunCounter(artistId: string): Promise<void> {
  const admin = createAdminClient();
  const { data: current } = await admin
    .from("subscriptions")
    .select("agent_runs_this_period")
    .eq("artist_id", artistId)
    .maybeSingle();
  if (!current) return;
  await admin
    .from("subscriptions")
    .update({
      agent_runs_this_period: (current.agent_runs_this_period ?? 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("artist_id", artistId);
}

export const TRIAL_LIMITS = {
  agentRunCap: TRIAL_AGENT_RUN_CAP,
  effectivePlan: TRIAL_EFFECTIVE_PLAN,
};
