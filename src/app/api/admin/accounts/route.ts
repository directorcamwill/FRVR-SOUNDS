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
    .select("id, artist_name, profile_id, created_at, subscriptions(plan_id, status, current_period_ends_at, stripe_customer_id)")
    .order("created_at", { ascending: false });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ accounts: artists ?? [] });
}
