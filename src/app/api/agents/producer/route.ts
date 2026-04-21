import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { runProducer } from "@/lib/agents/producer";
import { gateFeature } from "@/lib/feature-guard";

/**
 * POST /api/agents/producer
 * Body: { project_id: string }
 * Runs Producer agent for a specific song_lab_project, caches output to
 * song_lab_projects.producer_guidance + producer_guidance_at (migration 00015).
 */

// Claude Sonnet on the full producer schema runs ~20–30s. Vercel's default
// 10s hobby / 15s pro timeout kills the function before the LLM returns,
// which is what made the client spinner appear stuck in prod.
export const maxDuration = 60;

export async function POST(request: Request) {
  const gate = await gateFeature("ai_producer");
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
  const projectId: string | undefined = body?.project_id;
  if (!projectId)
    return NextResponse.json(
      { error: "project_id is required" },
      { status: 400 }
    );

  const { data: project } = await supabase
    .from("song_lab_projects")
    .select("*")
    .eq("id", projectId)
    .eq("artist_id", artist.id)
    .single();
  if (!project)
    return NextResponse.json({ error: "Project not found" }, { status: 404 });

  try {
    const result = await runProducer({ artistId: artist.id, project });
    if (result.gated) return NextResponse.json(result, { status: 422 });

    const admin = createAdminClient();
    const now = new Date().toISOString();
    await admin
      .from("song_lab_projects")
      .update({
        producer_guidance: result.guidance,
        producer_guidance_at: now,
      })
      .eq("id", projectId);

    await admin.from("agent_logs").insert({
      artist_id: artist.id,
      agent_type: "producer",
      action: "guide_project",
      summary: `Producer guidance for "${project.title ?? "(untitled)"}"`,
      details: { project_id: projectId, confidence: result.guidance.confidence },
      tokens_used: result.tokensUsed,
      duration_ms: result.durationMs,
    });

    return NextResponse.json({
      gated: false,
      guidance: result.guidance,
      tokensUsed: result.tokensUsed,
      durationMs: result.durationMs,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Producer failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
