import { NextResponse } from "next/server";
import { getUserAccess } from "@/lib/features";
import { getPlan } from "@/lib/plans";

export async function GET() {
  const access = await getUserAccess();
  if (!access) return NextResponse.json({ authenticated: false });
  const plan = getPlan(access.plan_id);
  const effectivePlan = getPlan(access.effective_plan_id);
  return NextResponse.json({
    authenticated: true,
    profile_id: access.profile_id,
    artist_id: access.artist_id,
    plan_id: access.plan_id,
    plan_name: plan.name,
    effective_plan_id: access.effective_plan_id,
    effective_plan_name: effectivePlan.name,
    subscription_status: access.subscription_status,
    is_super_admin: access.is_super_admin,
    is_trialing: access.is_trialing,
    trial_ends_at: access.trial_ends_at,
    agent_runs_this_period: access.agent_runs_this_period,
    agent_runs_limit: access.agent_runs_limit,
    agent_runs_remaining: access.agent_runs_remaining,
  });
}
