import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { runSyncEngine } from "@/lib/agents/sync-engine";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ songId: string }> }
) {
  const { songId } = await params;
  const supabase = await createClient();

  const { data: scores } = await supabase
    .from("sync_scores")
    .select("*")
    .eq("song_id", songId)
    .order("created_at", { ascending: false })
    .limit(1);

  return NextResponse.json(scores?.[0] || null);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ songId: string }> }
) {
  const { songId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get song with metadata and stems
  const { data: song } = await supabase
    .from("songs")
    .select(`*, song_metadata(*), stems(*)`)
    .eq("id", songId)
    .single();

  if (!song)
    return NextResponse.json({ error: "Song not found" }, { status: 404 });

  try {
    const result = await runSyncEngine({
      title: song.title,
      metadata: song.song_metadata,
      stemsCount: song.stems?.length || 0,
      stemTypes:
        song.stems?.map((s: { stem_type: string }) => s.stem_type) || [],
      hasDuration: !!song.duration_seconds,
      durationSeconds: song.duration_seconds,
    });

    // Insert score
    const { data: score, error } = await supabase
      .from("sync_scores")
      .insert({
        song_id: songId,
        overall_score: result.overall_score,
        arrangement_score: result.arrangement_score,
        production_score: result.production_score,
        mix_score: result.mix_score,
        usability_score: result.usability_score,
        market_fit_score: result.market_fit_score,
        brand_safety_score: result.brand_safety_score,
        deliverables_score: result.deliverables_score,
        confidence: result.confidence,
        ai_analysis: result.ai_analysis,
        ai_recommendations: result.ai_recommendations,
      })
      .select()
      .single();

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    // Log agent activity
    const { data: artist } = await supabase
      .from("artists")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    if (artist) {
      await supabase.from("agent_logs").insert({
        artist_id: artist.id,
        agent_type: "sync_engine",
        action: "score_song",
        summary: `Scored "${song.title}" - ${result.overall_score}/100`,
        details: {
          songId,
          overall_score: result.overall_score,
          placement_likelihood: result.placement_likelihood,
        },
        tokens_used: result.tokensUsed,
        duration_ms: result.durationMs,
      });
    }

    return NextResponse.json(score);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "AI scoring failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
