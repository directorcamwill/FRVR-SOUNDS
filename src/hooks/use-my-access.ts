"use client";

import { useEffect, useState } from "react";
import type { FeatureKey, PlanId } from "@/lib/plans";
import { PLANS, planHasFeature } from "@/lib/plans";

interface MyAccess {
  authenticated: boolean;
  plan_id: PlanId | null;
  plan_name: string | null;
  subscription_status: string | null;
  is_super_admin: boolean;
  artist_id: string | null;
  hasFeature: (key: FeatureKey) => boolean;
}

const defaultAccess: MyAccess = {
  authenticated: false,
  plan_id: null,
  plan_name: null,
  subscription_status: null,
  is_super_admin: false,
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
        setAccess({
          authenticated: !!data.authenticated,
          plan_id: planId,
          plan_name: data.plan_name ?? null,
          subscription_status: data.subscription_status ?? null,
          is_super_admin: !!data.is_super_admin,
          artist_id: data.artist_id ?? null,
          hasFeature: (key: FeatureKey) => {
            if (data.is_super_admin) return true;
            if (!planId) return false;
            return planHasFeature(planId, key);
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
// Used to tell users "upgrade to Pro to unlock X".
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
