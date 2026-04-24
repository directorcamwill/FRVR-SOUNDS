import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { gateAgentRun } from "@/lib/feature-guard";
import { incrementAgentRunCounter } from "@/lib/features";
import { runContentSyncLoop } from "@/lib/agents/content-sync-loop";

/**
 * POST /api/agents/content-sync-loop
 * Body: { song_id: string }
 *
 * Fans a ready song into a release plan + content_moments batch.
 * Gated on `ai_content_director` (Pro+) since the orchestrator invokes
 * the Content Director under the hood. One quota increment per run.
 */

export const maxDuration = 60;

export async function POST(request: Request) {
  const gate = await gateAgentRun("ai_content_director");
  if (!gate.ok) return gate.response;
  const artistId = gate.access.artist_id;
  if (!artistId) {
    return NextResponse.json({ error: "No artist profile" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const songId = body?.song_id as string | undefined;
  if (!songId) {
    return NextResponse.json({ error: "song_id is required" }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    const result = await runContentSyncLoop({ artistId, songId });
    if (!result.ok) {
      const status = result.reason === "song_not_found" ? 404 : 422;
      return NextResponse.json(result, { status });
    }

    await admin.from("agent_logs").insert({
      artist_id: artistId,
      agent_type: "content_sync_loop",
      action: "orchestrate",
      summary: `Drafted ${result.content_moments_planned} release moment${result.content_moments_planned === 1 ? "" : "s"} for song ${songId}`,
      details: {
        song_id: songId,
        batch_id: result.batch_id,
        release_plan_id: result.release_plan_id,
        content_moments_planned: result.content_moments_planned,
      },
      tokens_used: result.tokensUsed,
      duration_ms: result.durationMs,
    });
    await incrementAgentRunCounter(artistId);

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Content + Sync Loop failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
