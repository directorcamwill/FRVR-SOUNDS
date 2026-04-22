"use client";

import { useEffect, useState } from "react";
import type { FeatureKey, PlanId } from "@/lib/plans";
import { PLANS, planHasFeature } from "@/lib/plans";

interface MyAccess {
  authenticated: boolean;
  plan_id: PlanId | null;
  plan_name: string | null;
  effective_plan_id: PlanId | null;
  effective_plan_name: string | null;
  subscription_status: string | null;
  is_super_admin: boolean;
  is_trialing: boolean;
  trial_ends_at: string | null;
  agent_runs_this_period: number;
  agent_runs_limit: number | null;
  agent_runs_remaining: number | null;
  artist_id: string | null;
  hasFeature: (key: FeatureKey) => boolean;
}

const defaultAccess: MyAccess = {
  authenticated: false,
  plan_id: null,
  plan_name: null,
  effective_plan_id: null,
  effective_plan_name: null,
  subscription_status: null,
  is_super_admin: false,
  is_trialing: false,
  trial_ends_at: null,
  agent_runs_this_period: 0,
  agent_runs_limit: null,
  agent_runs_remaining: null,
  artist_id: null,
  hasFeature: () => false,
};

export function useMyAccess(): { access: MyAccess; loading: boolean } {
  const [access, setAccess] = useState<MyAccess>(defaultAccess);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/me");
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        const planId = (data.plan_id ?? null) as PlanId | null;
        const effectivePlanId = (data.effective_plan_id ?? null) as PlanId | null;
        setAccess({
          authenticated: !!data.authenticated,
          plan_id: planId,
          plan_name: data.plan_name ?? null,
          effective_plan_id: effectivePlanId,
          effective_plan_name: data.effective_plan_name ?? null,
          subscription_status: data.subscription_status ?? null,
          is_super_admin: !!data.is_super_admin,
          is_trialing: !!data.is_trialing,
          trial_ends_at: data.trial_ends_at ?? null,
          agent_runs_this_period: Number(data.agent_runs_this_period ?? 0),
          agent_runs_limit:
            typeof data.agent_runs_limit === "number" ? data.agent_runs_limit : null,
          agent_runs_remaining:
            typeof data.agent_runs_remaining === "number"
              ? data.agent_runs_remaining
              : null,
          artist_id: data.artist_id ?? null,
          hasFeature: (key: FeatureKey) => {
            if (data.is_super_admin) return true;
            const gate = effectivePlanId ?? planId;
            if (!gate) return false;
            return planHasFeature(gate, key);
          },
        });
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { access, loading };
}

// Given a feature key, return the minimum plan tier that includes it.
// Used to tell users "upgrade to Pro Catalog to unlock X".
export function minPlanForFeature(
  key: FeatureKey
): { id: PlanId; name: string; priceMonthly: number | null } | null {
  const order: PlanId[] = ["starter", "pro", "studio"];
  for (const id of order) {
    if (PLANS[id].features.includes(key)) {
      return {
        id,
        name: PLANS[id].name,
        priceMonthly: PLANS[id].priceMonthly,
      };
    }
  }
  return null;
}
