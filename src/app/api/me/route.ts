import { NextResponse } from "next/server";
import { getUserAccess } from "@/lib/features";
import { getPlan } from "@/lib/plans";

export async function GET() {
  const access = await getUserAccess();
  if (!access) return NextResponse.json({ authenticated: false });
  const plan = getPlan(access.plan_id);
  return NextResponse.json({
    authenticated: true,
    profile_id: access.profile_id,
    artist_id: access.artist_id,
    plan_id: access.plan_id,
    plan_name: plan.name,
    subscription_status: access.subscription_status,
    is_super_admin: access.is_super_admin,
  });
}
