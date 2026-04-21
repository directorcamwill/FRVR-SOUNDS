import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { runSyncBrief } from "@/lib/agents/sync-brief";

export async function POST(request: Request) {
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

  const body = await request.json();
  const { opportunityId } = body;
  if (!opportunityId)
    return NextResponse.json(
      { error: "opportunityId is required" },
      { status: 400 }
    );

  const { data: opportunity, error: oppError } = await supabase
    .from("opportunities")
    .select("*")
    .eq("id", opportunityId)
    .eq("artist_id", artist.id)
    .single();
  if (oppError || !opportunity)
    return NextResponse.json(
      { error: "Opportunity not found" },
      { status: 404 }
    );

  try {
    const { brief, tokensUsed, durationMs } = await runSyncBrief({
      title: opportunity.title,
      description: opportunity.description,
      opportunity_type: opportunity.opportunity_type,
      genres_needed: opportunity.genres_needed ?? [],
      moods_needed: opportunity.moods_needed ?? [],
      budget_range: opportunity.budget_range,
      deadline: opportunity.deadline,
      company: opportunity.company,
      exclusive: !!opportunity.exclusive,
    });

    const admin = createAdminClient();
    const now = new Date().toISOString();
    await admin
      .from("opportunities")
      .update({
        brief_details: brief,
        brief_structured_at: now,
      })
      .eq("id", opportunityId);

    await admin.from("agent_logs").insert({
      artist_id: artist.id,
      agent_type: "sync_brief",
      action: "structure_brief",
      summary: `Structured brief for "${opportunity.title}"`,
      details: {
        opportunity_id: opportunityId,
        format_family: brief.format_family,
        confidence: brief.confidence,
      },
      tokens_used: tokensUsed,
      duration_ms: durationMs,
    });

    if (brief.confidence != null && brief.confidence < 0.7) {
      await admin.from("alerts").insert({
        artist_id: artist.id,
        agent_type: "sync_brief",
        severity: "warning",
        title: "Low-confidence sync brief",
        message: `The brief for "${opportunity.title}" was structured at ${Math.round(
          brief.confidence * 100
        )}% confidence. Review the extracted fields before matching.`,
        action_url: `/pipeline/${opportunityId}`,
      });
    }

    return NextResponse.json({ brief, tokensUsed, durationMs });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Sync brief agent failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
