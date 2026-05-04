import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { runScoreContent } from "@/lib/agents/brand-director";
import { gateAgentRun } from "@/lib/feature-guard";
import { incrementAgentRunCounter } from "@/lib/features";

/**
 * POST /api/content-pieces/[id]/score
 *
 * Loads the piece + the artist's wiki, runs the 4-dim Content Fit scorer,
 * persists the result on `content_pieces.fit_score` + updates `fit_status`
 * based on the threshold rules from the V2 spec:
 *   < 0.75 → "revise"
 *   ≥ 0.75 → "ship_ready"
 *   ≥ 0.90 → "anchor"
 */

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const gate = await gateAgentRun("ai_brand_director");
  if (!gate.ok) return gate.response;
  const artistId = gate.access.artist_id;
  if (!artistId)
    return NextResponse.json({ error: "No artist profile" }, { status: 404 });

  const supabase = await createClient();
  const { data: artist } = await supabase
    .from("artists")
    .select("id, artist_name")
    .eq("id", artistId)
    .single();
  if (!artist)
    return NextResponse.json({ error: "No artist profile" }, { status: 404 });

  const { data: piece, error: pieceErr } = await supabase
    .from("content_pieces")
    .select("*")
    .eq("id", id)
    .eq("artist_id", artist.id)
    .single();
  if (pieceErr || !piece)
    return NextResponse.json({ error: "Piece not found" }, { status: 404 });

  const { data: wiki } = await supabase
    .from("brand_wiki")
    .select("*")
    .eq("artist_id", artist.id)
    .maybeSingle();

  const score = await runScoreContent({
    wiki: wiki ?? {},
    artistName: artist.artist_name,
    piece: {
      platform: String(piece.platform ?? ""),
      hook: String(piece.hook ?? ""),
      body: String(piece.body ?? ""),
      cta: String(piece.cta ?? ""),
      pillar_id: piece.pillar_id ?? null,
      format_id: piece.format_id ?? null,
    },
  });

  // Threshold logic from V2 spec.
  let fit_status: "revise" | "ship_ready" | "anchor" = "revise";
  if (score.total >= 0.9) fit_status = "anchor";
  else if (score.total >= 0.75) fit_status = "ship_ready";

  const fit_score = {
    identity_match: score.identity_match,
    emotional_accuracy: score.emotional_accuracy,
    audience_relevance: score.audience_relevance,
    platform_fit: score.platform_fit,
    total: score.total,
    flags: score.flags,
    suggestions: score.suggestions,
    reasoning: score.reasoning,
    confidence: score.confidence,
    scored_at: new Date().toISOString(),
  };

  const admin = createAdminClient();
  const { data: saved, error: saveErr } = await admin
    .from("content_pieces")
    .update({
      fit_score,
      fit_status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("artist_id", artist.id)
    .select()
    .single();

  if (saveErr)
    return NextResponse.json({ error: saveErr.message }, { status: 500 });

  await admin.from("agent_logs").insert({
    artist_id: artist.id,
    agent_type: "brand_director",
    action: "score_content",
    summary: `Scored piece ${id.slice(0, 8)}: ${score.total.toFixed(2)} (${fit_status})`,
    details: {
      piece_id: id,
      total: score.total,
      fit_status,
      flags: score.flags,
    },
    tokens_used: score.tokensUsed,
    duration_ms: score.durationMs,
  });
  await incrementAgentRunCounter(artist.id);

  return NextResponse.json({ piece: saved, fit_score, fit_status });
}
