import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { runSongwriter } from "@/lib/agents/songwriter";
import { gateFeature } from "@/lib/feature-guard";

// LLM call runs past Vercel's default 10–15s timeout. See producer/route.ts.
export const maxDuration = 60;

export async function POST(request: Request) {
  const gate = await gateFeature("ai_songwriter");
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
    const result = await runSongwriter({ artistId: artist.id, project });
    if (result.gated) return NextResponse.json(result, { status: 422 });

    const admin = createAdminClient();
    const now = new Date().toISOString();
    await admin
      .from("song_lab_projects")
      .update({
        songwriter_guidance: result.guidance,
        songwriter_guidance_at: now,
      })
      .eq("id", projectId);

    await admin.from("agent_logs").insert({
      artist_id: artist.id,
      agent_type: "songwriter",
      action: "guide_project",
      summary: `Songwriter guidance for "${project.title ?? "(untitled)"}"`,
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
    const message = err instanceof Error ? err.message : "Songwriter failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
