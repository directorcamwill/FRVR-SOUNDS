import { NextResponse } from "next/server";
import {
  requireFeature,
  getUserAccess,
  type UserAccess,
} from "@/lib/features";
import { planHasFeature, getPlan, type FeatureKey } from "@/lib/plans";

// Server-route gate: returns a 403 NextResponse if the caller's plan doesn't
// include the feature. Otherwise returns null and the route continues.
// Super-admins always pass.
export async function gateFeature(
  key: FeatureKey
): Promise<NextResponse | null> {
  const result = await requireFeature(key);
  if (result.ok) return null;

  if (result.reason === "unauthenticated")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const currentPlan =
    "current_plan" in result ? result.current_plan : undefined;

  if (result.reason === "locked_during_trial") {
    return NextResponse.json(
      {
        error: "locked_during_trial",
        required_feature: key,
        message: `This feature unlocks when your trial converts to paid ${currentPlan?.name ?? ""}.`,
        upgrade_url: "/pricing",
      },
      { status: 403 }
    );
  }

  return NextResponse.json(
    {
      error: "plan_lacks_feature",
      required_feature: key,
      message: `Your current plan (${currentPlan?.name ?? "—"}) doesn't include this feature.`,
      upgrade_url: "/pricing",
    },
    { status: 403 }
  );
}

// Combined gate for LLM agent routes — enforces feature access AND usage
// quota in one call. On success, returns the UserAccess object the route can
// use (for artist_id, etc.). The route is responsible for calling
// incrementAgentRunCounter(access.artist_id) after a successful agent run.
export async function gateAgentRun(
  key: FeatureKey
): Promise<
  | { ok: true; access: UserAccess }
  | { ok: false; response: NextResponse }
> {
  const access = await getUserAccess();
  if (!access) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  // Super-admins bypass both feature + quota.
  if (access.is_super_admin) return { ok: true, access };

  // Feature check against effective plan (trialing users get Starter-tier).
  if (!planHasFeature(access.effective_plan_id, key)) {
    const currentPlan = getPlan(access.plan_id);
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: access.is_trialing ? "locked_during_trial" : "plan_lacks_feature",
          required_feature: key,
          message: access.is_trialing
            ? `This feature unlocks when your trial converts to paid ${currentPlan.name}.`
            : `Your current plan (${currentPlan.name}) doesn't include this feature.`,
          upgrade_url: "/pricing",
        },
        { status: 403 }
      ),
    };
  }

  // Quota check.
  if (access.agent_runs_limit !== null) {
    if (access.agent_runs_this_period >= access.agent_runs_limit) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            error: "quota_exceeded",
            message: access.is_trialing
              ? `You've used all ${access.agent_runs_limit} AI runs in your trial. Activate your plan to unlock more.`
              : `You've hit your monthly AI agent quota (${access.agent_runs_limit} runs). Upgrade for more.`,
            agent_runs_used: access.agent_runs_this_period,
            agent_runs_limit: access.agent_runs_limit,
            upgrade_url: "/pricing",
          },
          { status: 429 }
        ),
      };
    }
  }

  return { ok: true, access };
}

// Quota-only variant for LLM routes without a plan feature key. Enforces the
// usage cap + returns the UserAccess object. Used by routes that aren't tied
// to a specific feature (market-intel, assistant, etc.) but still cost
// tokens. Caller is responsible for calling incrementAgentRunCounter after a
// successful run.
export async function gateAgentQuota(): Promise<
  | { ok: true; access: UserAccess }
  | { ok: false; response: NextResponse }
> {
  const access = await getUserAccess();
  if (!access) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (access.is_super_admin) return { ok: true, access };

  if (access.agent_runs_limit !== null) {
    if (access.agent_runs_this_period >= access.agent_runs_limit) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            error: "quota_exceeded",
            message: access.is_trialing
              ? `You've used all ${access.agent_runs_limit} AI runs in your trial. Activate your plan to unlock more.`
              : `You've hit your monthly AI agent quota (${access.agent_runs_limit} runs). Upgrade for more.`,
            agent_runs_used: access.agent_runs_this_period,
            agent_runs_limit: access.agent_runs_limit,
            upgrade_url: "/pricing",
          },
          { status: 429 }
        ),
      };
    }
  }

  return { ok: true, access };
}
