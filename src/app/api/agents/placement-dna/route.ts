import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { runPlacementDna } from "@/lib/agents/placement-dna";

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
    .select("id, brief_details, opportunity_type")
    .eq("id", opportunityId)
    .eq("artist_id", artist.id)
    .single();
  if (oppError || !opportunity)
    return NextResponse.json(
      { error: "Opportunity not found" },
      { status: 404 }
    );

  const formatFamily =
    (opportunity.brief_details as { format_family?: string } | null)
      ?.format_family ?? opportunity.opportunity_type;

  try {
    const { dna, tokensUsed, durationMs, sampleSize } = await runPlacementDna(
      {
        artistId: artist.id,
        opportunityId,
        formatFamily,
      }
    );

    const admin = createAdminClient();
    const now = new Date().toISOString();
    await admin
      .from("opportunities")
      .update({
        placement_dna_cache: dna,
        placement_dna_cached_at: now,
      })
      .eq("id", opportunityId);

    await admin.from("agent_logs").insert({
      artist_id: artist.id,
      agent_type: "placement_dna",
      action: "generate_heuristics",
      summary: `Placement DNA for "${opportunityId}" (sample n=${sampleSize})`,
      details: {
        opportunity_id: opportunityId,
        format_family: dna.format_family,
        sample_size: sampleSize,
        confidence: dna.confidence,
      },
      tokens_used: tokensUsed,
      duration_ms: durationMs,
    });

    return NextResponse.json({ dna, tokensUsed, durationMs, sampleSize });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Placement DNA agent failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
