import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserAccess } from "@/lib/features";
import { PLANS, type PlanId } from "@/lib/plans";

export async function GET() {
  const access = await getUserAccess();
  if (!access?.is_super_admin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);

  const [
    { count: totalAccounts },
    { data: subscriptions },
    { count: recentSignups7d },
    { count: recentSignups30d },
    { count: totalSongs },
    { count: totalAgentCalls },
    { count: recentAgentCalls30d },
    { count: lowConfAlerts },
    { count: librarySubs },
  ] = await Promise.all([
    admin.from("artists").select("*", { count: "exact", head: true }),
    admin.from("subscriptions").select("plan_id, status, artist_id"),
    admin
      .from("artists")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo.toISOString()),
    admin
      .from("artists")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo.toISOString()),
    admin.from("songs").select("*", { count: "exact", head: true }),
    admin.from("agent_logs").select("*", { count: "exact", head: true }),
    admin
      .from("agent_logs")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo.toISOString()),
    admin
      .from("alerts")
      .select("*", { count: "exact", head: true })
      .eq("severity", "warning"),
    admin
      .from("library_submissions")
      .select("*", { count: "exact", head: true }),
  ]);

  // MRR = sum of (plan price × paying subs per plan)
  const byPlan: Record<string, number> = {};
  let mrrCents = 0;
  let payingAccounts = 0;
  for (const s of subscriptions ?? []) {
    const key = s.plan_id ?? "unknown";
    byPlan[key] = (byPlan[key] ?? 0) + 1;
    if (s.status === "active" || s.status === "trialing") {
      const price = PLANS[s.plan_id as PlanId]?.priceMonthly;
      if (price) {
        mrrCents += price * 100;
        payingAccounts += 1;
      }
    }
  }

  return NextResponse.json({
    totals: {
      accounts: totalAccounts ?? 0,
      paying_accounts: payingAccounts,
      mrr_cents: mrrCents,
      songs: totalSongs ?? 0,
      agent_calls_all_time: totalAgentCalls ?? 0,
      agent_calls_30d: recentAgentCalls30d ?? 0,
      low_confidence_alerts: lowConfAlerts ?? 0,
      library_submissions: librarySubs ?? 0,
    },
    signups: {
      last_7d: recentSignups7d ?? 0,
      last_30d: recentSignups30d ?? 0,
    },
    accounts_by_plan: byPlan,
  });
}
