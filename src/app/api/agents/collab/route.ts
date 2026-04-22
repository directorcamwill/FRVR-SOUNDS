import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { runCollab } from "@/lib/agents/collab";
import { gateAgentRun } from "@/lib/feature-guard";
import { incrementAgentRunCounter } from "@/lib/features";

/**
 * POST /api/agents/collab
 * Body: { project_id?: string }
 * Runs the Collab agent. project_id is optional — collab suggestions are
 * primarily brand-driven, project context is just a hint.
 * When project_id given, caches to song_lab_projects.collab_suggestions.
 */

// LLM call runs past Vercel's default 10–15s timeout. See producer/route.ts.
export const maxDuration = 60;

export async function POST(request: Request) {
  const gate = await gateAgentRun("ai_collab");
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
  const projectId: string | undefined = body?.project_id;

  let project: Record<string, unknown> | null = null;
  if (projectId) {
    const { data } = await supabase
      .from("song_lab_projects")
      .select("*")
      .eq("id", projectId)
      .eq("artist_id", artist.id)
      .single();
    project = data ?? null;
    if (!project)
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
  }

  try {
    const result = await runCollab({ artistId: artist.id, project });
    if (result.gated) return NextResponse.json(result, { status: 422 });

    const admin = createAdminClient();
    const now = new Date().toISOString();
    if (projectId) {
      await admin
        .from("song_lab_projects")
        .update({
          collab_suggestions: result.guidance,
          collab_suggestions_at: now,
        })
        .eq("id", projectId);
    }

    await admin.from("agent_logs").insert({
      artist_id: artist.id,
      agent_type: "collab",
      action: "suggest_collaborators",
      summary: projectId
        ? `Collab suggestions for project ${projectId}`
        : "Brand-level collab suggestions",
      details: {
        project_id: projectId ?? null,
        confidence: result.guidance.confidence,
      },
      tokens_used: result.tokensUsed,
      duration_ms: result.durationMs,
    });

    await incrementAgentRunCounter(artist.id);

    return NextResponse.json({
      gated: false,
      guidance: result.guidance,
      tokensUsed: result.tokensUsed,
      durationMs: result.durationMs,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Collab failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
