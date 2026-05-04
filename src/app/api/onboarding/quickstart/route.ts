import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { runQuickstartArtifact } from "@/lib/agents/brand-director";
import { gateAgentRun } from "@/lib/feature-guard";
import { incrementAgentRunCounter } from "@/lib/features";

/**
 * POST /api/onboarding/quickstart
 *
 * Signal-tier 5-minute first experience. The page collects 3 micro-answers
 * (core_pain, desired_emotions, primary_audience), POSTs them here.
 *
 * This endpoint:
 *   1. Saves the 3 answers to brand_wiki (skipping any already populated)
 *   2. Calls the Director's quickstart_artifact mode → 1 hook + 1 caption + 1 post format
 *   3. Logs streak day 1 for today (auto)
 *
 * Gated by `ai_brand_director` (Pro+) — Signal users get this through their
 * subscription. If a starter-tier user hits this, the gate returns 402 and
 * the page can fall back to a non-LLM template.
 *
 * Body: { core_pain?: string, desired_emotions?: string[], primary_audience?: string }
 */

interface QuickstartBody {
  core_pain?: string;
  desired_emotions?: string[];
  primary_audience?: string;
}

function dateOnlyUTC(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function POST(request: Request) {
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

  const body = (await request.json().catch(() => ({}))) as QuickstartBody;

  // ── 1. Save the 3 answers (only fill blank fields — never overwrite richer answers) ──
  const admin = createAdminClient();
  const { data: currentWiki } = await admin
    .from("brand_wiki")
    .select("*")
    .eq("artist_id", artist.id)
    .maybeSingle();

  const patch: Record<string, unknown> = {};
  if (
    typeof body.core_pain === "string" &&
    body.core_pain.trim().length > 0 &&
    !(currentWiki?.core_pain && String(currentWiki.core_pain).trim())
  ) {
    patch.core_pain = body.core_pain.trim();
  }
  if (
    Array.isArray(body.desired_emotions) &&
    body.desired_emotions.length > 0 &&
    !(currentWiki?.desired_emotions && currentWiki.desired_emotions.length > 0)
  ) {
    patch.desired_emotions = body.desired_emotions
      .map((s) => String(s).trim().toLowerCase())
      .filter(Boolean);
  }
  if (
    typeof body.primary_audience === "string" &&
    body.primary_audience.trim().length > 0 &&
    !(currentWiki?.primary_audience && String(currentWiki.primary_audience).trim())
  ) {
    patch.primary_audience = body.primary_audience.trim();
  }

  if (Object.keys(patch).length > 0) {
    if (currentWiki) {
      await admin.from("brand_wiki").update(patch).eq("artist_id", artist.id);
    } else {
      await admin
        .from("brand_wiki")
        .insert({ artist_id: artist.id, ...patch });
    }
  }

  // Re-read so the Director sees freshly persisted fields.
  const { data: wiki } = await admin
    .from("brand_wiki")
    .select("*")
    .eq("artist_id", artist.id)
    .maybeSingle();

  // ── 2. Run the quickstart artifact mode ──
  const res = await runQuickstartArtifact({
    wiki: wiki ?? patch,
    artistName: artist.artist_name,
  });

  await admin.from("agent_logs").insert({
    artist_id: artist.id,
    agent_type: "brand_director",
    action: "quickstart_artifact",
    summary: `Quickstart: 1 hook + 1 caption + 1 post format`,
    details: { confidence: res.confidence },
    tokens_used: res.tokensUsed,
    duration_ms: res.durationMs,
  });
  await incrementAgentRunCounter(artist.id);

  // ── 3. Log streak day 1 for today (idempotent) ──
  await admin
    .from("streak_log")
    .upsert(
      {
        artist_id: artist.id,
        log_date: dateOnlyUTC(new Date()),
        mvp_met: true,
        pieces_shipped: 0,
        notes: "quickstart-day-1",
      },
      { onConflict: "artist_id,log_date" },
    )
    .then((r) => {
      if (r.error && !/relation .* does not exist|schema cache/i.test(r.error.message)) {
        console.error("streak_log quickstart write failed:", r.error.message);
      }
    });

  return NextResponse.json({
    artifact: {
      hook: res.hook,
      caption: res.caption,
      post_format: res.post_format,
      reasoning: res.reasoning,
      confidence: res.confidence,
    },
  });
}
