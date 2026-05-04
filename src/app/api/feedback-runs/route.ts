import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/feedback-runs
 *
 * Returns the artist's persisted weekly Feedback Loop runs (newest first).
 * Each row was written by `persistFeedbackRun` during the Monday digest
 * job — see src/lib/agents/automation/weekly-digest.ts.
 *
 * Query: ?limit=N (default 26, capped at 100). Default covers ~6 months.
 *
 * Fails soft when `feedback_runs` table is missing (migration 00030
 * unapplied) — returns an empty list so the history page renders an
 * actionable empty state.
 */

export async function GET(request: Request) {
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

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 26) || 26, 100);

  const { data, error } = await supabase
    .from("feedback_runs")
    .select("id, period_start, period_end, signals, model_diff, applied, reverted_at, created_at")
    .eq("artist_id", artist.id)
    .order("period_start", { ascending: false })
    .limit(limit);

  if (error) {
    if (/relation .* does not exist|schema cache/i.test(error.message)) {
      return NextResponse.json({
        runs: [],
        warning: "feedback_runs table missing — apply migration 00030.",
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ runs: data ?? [] });
}
