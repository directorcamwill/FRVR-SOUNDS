import { getPlan, planHasFeature, type FeatureKey, type PlanId } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Server-side: look up the current user's plan + super-admin state and
// decide whether they can access a feature. Super-admins always return true
// (Cameron can use everything). Internal plan = Studio-equivalent.

export interface UserAccess {
  profile_id: string;
  artist_id: string | null;
  plan_id: PlanId;
  is_super_admin: boolean;
  subscription_status: string;
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

  let planId: PlanId = "internal";
  let status = "internal";
  if (artist?.id) {
    const { data: sub } = await admin
      .from("subscriptions")
      .select("plan_id, status")
      .eq("artist_id", artist.id)
      .maybeSingle();
    if (sub?.plan_id) planId = sub.plan_id as PlanId;
    if (sub?.status) status = sub.status;
  }

  return {
    profile_id: user.id,
    artist_id: artist?.id ?? null,
    plan_id: planId,
    is_super_admin: !!superAdmin,
    subscription_status: status,
  };
}

export async function hasFeature(key: FeatureKey): Promise<boolean> {
  const access = await getUserAccess();
  if (!access) return false;
  if (access.is_super_admin) return true;
  return planHasFeature(access.plan_id, key);
}

export async function requireFeature(key: FeatureKey) {
  const access = await getUserAccess();
  if (!access)
    return { access: null, ok: false as const, reason: "unauthenticated" };
  if (access.is_super_admin) return { access, ok: true as const };
  if (planHasFeature(access.plan_id, key)) return { access, ok: true as const };
  return {
    access,
    ok: false as const,
    reason: "plan_lacks_feature" as const,
    required_feature: key,
    current_plan: getPlan(access.plan_id),
  };
}
