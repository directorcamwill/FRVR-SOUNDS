import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { computeStreak } from "@/lib/streak/compute";

/**
 * POST /api/streak/check-in
 *
 * Acknowledges a recent streak break and captures qualitative notes
 * ("what changed?"). Writes a streak_log row for today with mvp_met=false
 * and notes. Idempotent — re-posting updates the notes for today.
 *
 * The acknowledgment is detected by computeStreak: any streak_log row in the
 * last 7 days with non-empty notes hides the break_check_in prompt.
 *
 * Body: { notes: string } — optional, but encouraged. An empty body still
 * acknowledges (so the prompt goes away) but stores no qualitative data.
 */

function dateOnlyUTC(d: Date): string {
  return d.toISOString().slice(0, 10);
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
  const notes =
    typeof body.notes === "string" && body.notes.trim().length > 0
      ? body.notes.trim()
      : "(acknowledged)"; // ensures `notes` is non-empty so it counts as ack

  const today = dateOnlyUTC(new Date());

  const admin = createAdminClient();
  const { error } = await admin.from("streak_log").upsert(
    {
      artist_id: artist.id,
      log_date: today,
      mvp_met: false,
      pieces_shipped: 0,
      notes,
    },
    { onConflict: "artist_id,log_date" },
  );
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // Recompute and return the post-ack streak so the UI hides the callout.
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
