import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserAccess } from "@/lib/features";

export async function GET() {
  const access = await getUserAccess();
  if (!access?.is_super_admin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();
  const { data: artists, error } = await admin
    .from("artists")
    .select(
      "id, artist_name, profile_id, created_at, subscriptions(plan_id, status, current_period_ends_at, stripe_customer_id)",
    )
    .order("created_at", { ascending: false });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // Last-active per artist = max(agent_logs.created_at, songs.created_at).
  // Single round-trip each, then merge in JS — fast even at 1000 accounts.
  const ids = (artists ?? []).map((a) => a.id);
  const lastActiveById = new Map<string, string>();
  if (ids.length > 0) {
    const [{ data: logs }, { data: songs }] = await Promise.all([
      admin
        .from("agent_logs")
        .select("artist_id, created_at")
        .in("artist_id", ids)
        .order("created_at", { ascending: false })
        .limit(2000),
      admin
        .from("songs")
        .select("artist_id, created_at")
        .in("artist_id", ids)
        .order("created_at", { ascending: false })
        .limit(2000),
    ]);
    for (const row of [...(logs ?? []), ...(songs ?? [])]) {
      const cur = lastActiveById.get(row.artist_id);
      if (!cur || row.created_at > cur) {
        lastActiveById.set(row.artist_id, row.created_at);
      }
    }
  }

  const accounts = (artists ?? []).map((a) => ({
    ...a,
    last_active_at: lastActiveById.get(a.id) ?? null,
  }));

  return NextResponse.json({ accounts });
}
