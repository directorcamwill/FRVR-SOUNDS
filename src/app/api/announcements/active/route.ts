import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Returns announcements currently active for the authenticated user,
// filtered by their plan and excluding any they've already dismissed.

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ announcements: [] });

  const admin = createAdminClient();

  const { data: artist } = await admin
    .from("artists")
    .select("id")
    .eq("profile_id", user.id)
    .single();
  let planId = "internal";
  if (artist?.id) {
    const { data: sub } = await admin
      .from("subscriptions")
      .select("plan_id")
      .eq("artist_id", artist.id)
      .maybeSingle();
    if (sub?.plan_id) planId = sub.plan_id;
  }

  const now = new Date().toISOString();
  const { data: all } = await admin
    .from("announcements")
    .select("*")
    .lte("starts_at", now)
    .order("created_at", { ascending: false });

  const { data: dismissed } = await admin
    .from("announcement_dismissals")
    .select("announcement_id")
    .eq("profile_id", user.id);
  const dismissedIds = new Set(
    (dismissed ?? []).map((r) => r.announcement_id)
  );

  const active = (all ?? []).filter((a) => {
    if (a.ends_at && new Date(a.ends_at).toISOString() < now) return false;
    if (dismissedIds.has(a.id)) return false;
    const targets = (a.target_plan_ids ?? []) as string[];
    if (targets.length === 0) return true;
    return targets.includes(planId);
  });

  return NextResponse.json({ announcements: active });
}
