import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import {
  runContentDirector,
  type ContentMomentType,
  type ContentPlatform,
} from "@/lib/agents/content-director";
import { gateAgentRun } from "@/lib/feature-guard";
import { incrementAgentRunCounter } from "@/lib/features";

/**
 * POST /api/agents/content-director
 * Body: {
 *   moment_type: ContentMomentType,
 *   source_song_id?: string,
 *   source_opportunity_id?: string,
 *   platforms?: ContentPlatform[],
 *   custom_note?: string
 * }
 *
 * Hard-gates on brand_wiki < 60%. When gated, returns 422 with actionable body.
 * When ungated, persists each variant as a content_moments row (tagged with
 * source_agent='content_director' + a shared batch_id) and returns them.
 */

export async function POST(request: Request) {
  const gate = await gateAgentRun("ai_content_director");
  if (!gate.ok) return gate.response;
  const artistId = gate.access.artist_id;
  if (!artistId)
    return NextResponse.json({ error: "No artist profile" }, { status: 404 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const artist = { id: artistId };

  const body = await request.json().catch(() => ({}));
  const momentType = body?.moment_type as ContentMomentType | undefined;
  if (!momentType)
    return NextResponse.json(
      { error: "moment_type is required" },
      { status: 400 }
    );

  const songId = (body?.source_song_id as string | undefined) ?? null;
  const opportunityId = (body?.source_opportunity_id as string | undefined) ?? null;
  const platforms = Array.isArray(body?.platforms)
    ? (body.platforms as ContentPlatform[])
    : undefined;
  const customNote = (body?.custom_note as string | undefined) ?? null;

  try {
    const result = await runContentDirector({
      artistId: artist.id,
      momentType,
      songId,
      opportunityId,
      platforms,
      customNote,
    });

    if (result.gated) {
      return NextResponse.json(result, { status: 422 });
    }

    const admin = createAdminClient();
    const rows = result.variants.map((v) => ({
      artist_id: artist.id,
      trigger_event: momentType,
      content_type: v.content_type,
      title: v.title,
      content: v.content,
      platform_suggestions: v.platforms,
      hashtags: v.hashtags,
      hook_ideas: v.hook_ideas,
      confidence: v.confidence,
      reasoning: v.reasoning,
      source_agent: "content_director",
      source_moment_type: momentType,
      source_song_id: songId,
      source_opportunity_id: opportunityId,
      batch_id: result.batch_id,
      status: "suggested",
    }));

    const { data: inserted, error: insertErr } = rows.length
      ? await admin.from("content_moments").insert(rows).select()
      : { data: [], error: null };

    if (insertErr)
      return NextResponse.json(
        { error: insertErr.message },
        { status: 500 }
      );

    await admin.from("agent_logs").insert({
      artist_id: artist.id,
      agent_type: "content_director",
      action: "generate_variants",
      summary: `Generated ${rows.length} content moment${rows.length === 1 ? "" : "s"} for ${momentType.replace(/_/g, " ")}`,
      details: {
        moment_type: momentType,
        batch_id: result.batch_id,
        variant_count: rows.length,
        song_id: songId,
        opportunity_id: opportunityId,
      },
      tokens_used: result.tokensUsed,
      duration_ms: result.durationMs,
    });

    const lowConfidence = result.variants.filter(
      (v) => v.confidence != null && v.confidence < 0.7
    );
    if (lowConfidence.length > 0) {
      await admin.from("alerts").insert({
        artist_id: artist.id,
        agent_type: "content_director",
        severity: "warning",
        title: `${lowConfidence.length} content variant${lowConfidence.length === 1 ? "" : "s"} needs review`,
        message: `Brand Wiki gaps made Content Director uncertain about ${lowConfidence.length} draft${lowConfidence.length === 1 ? "" : "s"}. Review before using.`,
        action_url: "/content",
      });
    }

    await incrementAgentRunCounter(artist.id);

    return NextResponse.json({
      gated: false,
      batch_id: result.batch_id,
      variants: inserted ?? [],
      tokensUsed: result.tokensUsed,
      durationMs: result.durationMs,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Content Director failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
