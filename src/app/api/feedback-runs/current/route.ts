import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { aggregateWeek, type ShippedPiece } from "@/lib/feedback/aggregate";

/**
 * GET /api/feedback-runs/current
 *
 * Computes the artist's this-week-vs-last-week Feedback Loop digest from
 * `content_pieces` directly. Pure deterministic — no LLM call. Returns
 * baseline lift, top signal, top anti-signal, per-pillar / per-emotion
 * breakdown, and WoW deltas for the Growth Tracker.
 *
 * Future: also persist to `feedback_runs` on a Monday cron + return the
 * persisted row when present. For now, computed live every call.
 */

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

  // Pull the last 30 days of shipped + scored pieces (covers this + last week).
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 30);

  const { data: pieces, error } = await supabase
    .from("content_pieces")
    .select(
      "id, pillar_id, format_id, hook, shipped_at, fit_score, performance",
    )
    .eq("artist_id", artist.id)
    .not("shipped_at", "is", null)
    .gte("shipped_at", since.toISOString());

  // If the table doesn't exist yet (migration 00030 unapplied) fail soft —
  // return a zeroed digest rather than 500-ing the dashboard.
  if (error) {
    if (/relation .* does not exist|schema cache/i.test(error.message)) {
      return NextResponse.json({
        digest: aggregateWeek([]),
        warning: "content_pieces table missing — apply migration 00030.",
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const shipped: ShippedPiece[] = (pieces ?? []).map((p) => ({
    id: p.id,
    pillar_id: p.pillar_id,
    format_id: p.format_id,
    shipped_at: p.shipped_at,
    hook: p.hook,
    fit_score: p.fit_score,
    performance: p.performance,
    // No emotion column on content_pieces yet — leave null until we wire it up
    // through the hook_library tag at scoring time.
    emotion: null,
  }));

  const digest = aggregateWeek(shipped);
  return NextResponse.json({ digest });
}
