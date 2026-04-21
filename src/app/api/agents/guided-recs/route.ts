import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { runGuidedRecs } from "@/lib/agents/guided-recs";
import { gateFeature } from "@/lib/feature-guard";

export const maxDuration = 60;

/**
 * POST /api/agents/guided-recs
 * Body: { song_id: string }
 * Reads the song (+ metadata) for the authenticated artist, runs the
 * Guided Recommendations agent against the placement reference DB + patterns,
 * caches to songs.guided_recs + songs.guided_recs_at.
 */

export async function POST(request: Request) {
  const gate = await gateFeature("guided_recommendations");
  if (gate) return gate;

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

  const body = await request.json().catch(() => ({}));
  const songId: string | undefined = body?.song_id;
  if (!songId)
    return NextResponse.json(
      { error: "song_id is required" },
      { status: 400 }
    );

  const { data: song } = await supabase
    .from("songs")
    .select("*, song_metadata(*)")
    .eq("id", songId)
    .eq("artist_id", artist.id)
    .single();
  if (!song)
    return NextResponse.json({ error: "Song not found" }, { status: 404 });

  try {
    const result = await runGuidedRecs({ song });

    const admin = createAdminClient();
    await admin
      .from("songs")
      .update({
        guided_recs: result.output,
        guided_recs_at: result.output.generated_at,
      })
      .eq("id", songId);

    await admin.from("agent_logs").insert({
      artist_id: artist.id,
      agent_type: "guided_recs",
      action: "recommend_song",
      summary: `${result.output.recommendations.length} recommendations for "${song.title}" (top match ${result.output.top_match_score})`,
      details: {
        song_id: songId,
        match_count: result.output.match_count,
        top_match_score: result.output.top_match_score,
        confidence: result.output.confidence,
      },
      tokens_used: result.tokensUsed,
      duration_ms: result.durationMs,
    });

    return NextResponse.json({
      output: result.output,
      matchesUsed: result.matchesUsed.map((p) => ({
        id: p.id,
        track_title: p.track_title,
        artist: p.artist,
        show_or_film: p.show_or_film,
      })),
      tokensUsed: result.tokensUsed,
      durationMs: result.durationMs,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Guided Recs failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
