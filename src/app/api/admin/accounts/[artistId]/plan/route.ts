import { NextResponse } from "next/server";
import { getUserAccess } from "@/lib/features";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLANS, type PlanId } from "@/lib/plans";

/**
 * PATCH /api/admin/accounts/[artistId]/plan
 * Body: { plan_id: PlanId }
 *
 * Super-admin-only. Changes the target artist's subscription plan directly
 * (no Stripe checkout). Used for comps, corrections, manual upgrades /
 * downgrades. Logs the change to agent_logs for audit.
 */

const VALID_PLANS: ReadonlySet<string> = new Set(Object.keys(PLANS));

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ artistId: string }> },
) {
  const access = await getUserAccess();
  if (!access?.is_super_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { artistId } = await params;
  const body = await request.json().catch(() => ({}));
  const planId = body?.plan_id as PlanId | undefined;
  if (!planId || !VALID_PLANS.has(planId)) {
    return NextResponse.json(
      { error: `plan_id must be one of: ${Object.keys(PLANS).join(", ")}` },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("subscriptions")
    .select("id, plan_id")
    .eq("artist_id", artistId)
    .maybeSingle();

  const previousPlan = existing?.plan_id ?? null;
  if (existing) {
    const { error } = await admin
      .from("subscriptions")
      .update({ plan_id: planId, status: "active" })
      .eq("id", existing.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    const { error } = await admin.from("subscriptions").insert({
      artist_id: artistId,
      plan_id: planId,
      status: "active",
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  await admin.from("agent_logs").insert({
    artist_id: artistId,
    agent_type: "admin_action",
    action: "plan_change",
    summary: `Plan changed ${previousPlan ?? "(none)"} → ${planId} by admin`,
    details: {
      previous_plan: previousPlan,
      new_plan: planId,
      admin_profile_id: access.profile_id,
    },
  });

  return NextResponse.json({ ok: true, plan_id: planId });
}
