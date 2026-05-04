import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { computeStreak } from "@/lib/streak/compute";

/**
 * /api/streak
 *
 * GET  → reads the artist's last 30 days of streak_log + computes:
 *        { current_streak, longest_30d, today_logged, yesterday_logged,
 *          last_30_days[], current_streak_started }
 * POST → manually logs today as met. Body: { notes?: string }
 *        Idempotent — re-posting the same day just updates `notes`.
 *
 * The streak_log table is also written automatically when a content piece
 * flips to fit_status=shipped (see /api/content-pieces PUT).
 */

function dateOnlyUTC(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: artist } = await supabase
    .from("artists")
    .select("id")
    .eq("profile_id", user.id)
    .single();
  if (!artist)
    return NextResponse.json({ error: "No artist profile" }, { status: 404 });

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 30);

  const { data, error } = await supabase
    .from("streak_log")
    .select("log_date, mvp_met, pieces_shipped, notes")
    .eq("artist_id", artist.id)
    .gte("log_date", dateOnlyUTC(since))
    .order("log_date", { ascending: true });

  // Fail soft when migration 00030 (streak_log) hasn't been applied — the
  // dashboard top strip should still render with a zero streak.
  if (error) {
    if (/relation .* does not exist|schema cache/i.test(error.message)) {
      return NextResponse.json({
        streak: computeStreak([]),
        warning: "streak_log table missing — apply migration 00030.",
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const streak = computeStreak(
    (data ?? []).map((r) => ({
      log_date: r.log_date,
      mvp_met: r.mvp_met,
      pieces_shipped: r.pieces_shipped ?? 0,
      notes: r.notes ?? null,
    })),
  );
  return NextResponse.json({ streak });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: artist } = await supabase
    .from("artists")
    .select("id")
    .eq("profile_id", user.id)
    .single();
  if (!artist)
    return NextResponse.json({ error: "No artist profile" }, { status: 404 });

  const body = (await request.json().catch(() => ({}))) as { notes?: string };
  const today = dateOnlyUTC(new Date());

  const admin = createAdminClient();
  const { error } = await admin.from("streak_log").upsert(
    {
      artist_id: artist.id,
      log_date: today,
      mvp_met: true,
      notes: typeof body.notes === "string" ? body.notes : null,
    },
    { onConflict: "artist_id,log_date" },
  );
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // Re-compute and return the fresh streak.
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 30);
  const { data } = await supabase
    .from("streak_log")
    .select("log_date, mvp_met, pieces_shipped, notes")
    .eq("artist_id", artist.id)
    .gte("log_date", dateOnlyUTC(since))
    .order("log_date", { ascending: true });
  const streak = computeStreak(
    (data ?? []).map((r) => ({
      log_date: r.log_date,
      mvp_met: r.mvp_met,
      pieces_shipped: r.pieces_shipped ?? 0,
      notes: r.notes ?? null,
    })),
  );
  return NextResponse.json({ streak });
}
