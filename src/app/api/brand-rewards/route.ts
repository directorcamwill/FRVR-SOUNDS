import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { gateAgentRun } from "@/lib/feature-guard";
import { incrementAgentRunCounter } from "@/lib/features";
import {
  runSocialProfileBuilder,
  runPhotoArtDirection,
  runOffersArchitect,
  type RewardTool,
} from "@/lib/agents/reward-tools";

/**
 * POST /api/brand-rewards
 *
 * Body: { tool: "social" | "photos" | "offers" }
 *
 * Gated by `brand_wiki_activated` (Studio-tier). Consumes one agent run.
 */

const TOOLS: ReadonlySet<RewardTool> = new Set(["social", "photos", "offers"]);

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const tool = body?.tool as RewardTool;
  if (!TOOLS.has(tool)) {
    return NextResponse.json(
      { error: "Unknown tool. Expected: social | photos | offers" },
      { status: 400 },
    );
  }

  const gate = await gateAgentRun("brand_wiki_activated");
  if (!gate.ok) return gate.response;
  const artistId = gate.access.artist_id;
  if (!artistId) {
    return NextResponse.json({ error: "No artist profile" }, { status: 404 });
  }

  const supabase = await createClient();
  const { data: artist } = await supabase
    .from("artists")
    .select("id, artist_name")
    .eq("id", artistId)
    .single();
  if (!artist) {
    return NextResponse.json({ error: "No artist profile" }, { status: 404 });
  }

  const { data: wiki } = await supabase
    .from("brand_wiki")
    .select("*")
    .eq("artist_id", artist.id)
    .maybeSingle();
  if (!wiki) {
    return NextResponse.json(
      { error: "Brand Wiki not found. Complete the Brand Journey first." },
      { status: 404 },
    );
  }

  const admin = createAdminClient();

  try {
    const res =
      tool === "social"
        ? await runSocialProfileBuilder({ wiki, artistName: artist.artist_name })
        : tool === "photos"
          ? await runPhotoArtDirection({ wiki, artistName: artist.artist_name })
          : await runOffersArchitect({ wiki, artistName: artist.artist_name });

    await admin.from("agent_logs").insert({
      artist_id: artist.id,
      agent_type: "brand_rewards",
      action: tool,
      summary: `Generated ${tool} reward · conf ${res.confidence?.toFixed(2) ?? "n/a"}`,
      details: {
        tool,
        confidence: res.confidence,
      },
      tokens_used: res.tokensUsed,
      duration_ms: res.durationMs,
    });
    await incrementAgentRunCounter(artist.id);

    return NextResponse.json({
      tool,
      output: res.output,
      reasoning: res.reasoning,
      confidence: res.confidence,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Reward tool failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
