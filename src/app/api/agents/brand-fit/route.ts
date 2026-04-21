import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { runBrandFit } from "@/lib/agents/brand-fit";
import { gateFeature } from "@/lib/feature-guard";

/**
 * POST /api/agents/brand-fit
 * Body: { song_id: string }
 * Hard-gates on brand_wiki < 60%. Caches to songs.brand_fit_status.
 */

export async function POST(request: Request) {
  const gate = await gateFeature("ai_brand_fit");
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
    const result = await runBrandFit({ artistId: artist.id, song });
    if (result.gated) return NextResponse.json(result, { status: 422 });

    const admin = createAdminClient();
    const now = new Date().toISOString();
    await admin
      .from("songs")
      .update({
        brand_fit_status: result.status,
        brand_fit_checked_at: now,
      })
      .eq("id", songId);

    await admin.from("agent_logs").insert({
      artist_id: artist.id,
      agent_type: "brand_fit",
      action: "grade_song",
      summary: `Brand fit ${result.status.overall_score}/100 for "${song.title}" (${result.status.alignment_tier})`,
      details: {
        song_id: songId,
        overall_score: result.status.overall_score,
        alignment_tier: result.status.alignment_tier,
        confidence: result.status.confidence,
      },
      tokens_used: result.tokensUsed,
      duration_ms: result.durationMs,
    });

    if (result.status.alignment_tier === "low") {
      await admin.from("alerts").insert({
        artist_id: artist.id,
        agent_type: "brand_fit",
        severity: "warning",
        title: `"${song.title}" is off-brand`,
        message: `Brand Fit is ${result.status.overall_score}/100 (low). Review deviations before pushing this track through the sync pipeline.`,
        action_url: `/vault/${songId}`,
      });
    }

    return NextResponse.json({
      gated: false,
      status: result.status,
      tokensUsed: result.tokensUsed,
      durationMs: result.durationMs,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Brand Fit failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
