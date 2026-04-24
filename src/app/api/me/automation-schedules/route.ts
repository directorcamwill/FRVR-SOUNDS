import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET  /api/me/automation-schedules → list the caller's schedules (one row
 *                                    per configured schedule_type)
 * PUT  /api/me/automation-schedules → upsert { schedule_type, enabled }
 *
 * No feature gating — toggling a scheduled job is a utility, not a paywall.
 * Only weekly_digest is functional today; the others are accepted so the UI
 * can offer them as "coming soon" without a schema bump later.
 */

const ALLOWED_TYPES = new Set([
  "weekly_digest",
  "daily_outreach_nudge",
  "release_content_burst",
]);

async function resolveArtistId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: artist } = await supabase
    .from("artists")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();
  return artist?.id ?? null;
}

export async function GET() {
  const artistId = await resolveArtistId();
  if (!artistId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = createAdminClient();
  const { data } = await admin
    .from("automation_schedules")
    .select("id, schedule_type, enabled, last_run_at, next_run_at")
    .eq("artist_id", artistId);
  return NextResponse.json({ schedules: data ?? [] });
}

export async function PUT(request: Request) {
  const artistId = await resolveArtistId();
  if (!artistId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const scheduleType = body?.schedule_type as string;
  const enabled = Boolean(body?.enabled);
  if (!ALLOWED_TYPES.has(scheduleType)) {
    return NextResponse.json(
      { error: "Unknown schedule_type" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("automation_schedules")
    .select("id, next_run_at")
    .eq("artist_id", artistId)
    .eq("schedule_type", scheduleType)
    .maybeSingle();

  if (existing) {
    await admin
      .from("automation_schedules")
      .update({ enabled })
      .eq("id", existing.id);
  } else {
    await admin.from("automation_schedules").insert({
      artist_id: artistId,
      schedule_type: scheduleType,
      enabled,
    });
  }

  const { data: row } = await admin
    .from("automation_schedules")
    .select("id, schedule_type, enabled, last_run_at, next_run_at")
    .eq("artist_id", artistId)
    .eq("schedule_type", scheduleType)
    .single();
  return NextResponse.json({ schedule: row });
}
