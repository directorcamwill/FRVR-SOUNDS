import { NextResponse } from "next/server";
import { requireFeature } from "@/lib/features";
import type { FeatureKey } from "@/lib/plans";

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
