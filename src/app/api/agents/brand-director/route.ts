import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { runBrandDirector } from "@/lib/agents/brand-director";
import type { BrandFocus } from "@/types/brand";

/**
 * POST /api/agents/brand-director
 * Body: { focus?: BrandFocus, generate?: "bio"|"pitch"|"origin_story" }
 *
 * Reads the current brand_wiki for the signed-in artist, runs the agent,
 * returns guidance + optional generated content. Updates last_guided_at on
 * the wiki row. Logs to agent_logs. Writes a warning alert when the wiki is
 * critically incomplete (feeds the Command Center v2 review queue).
 */

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: artist } = await supabase
    .from("artists")
    .select("id, artist_name")
    .eq("profile_id", user.id)
    .single();
  if (!artist)
    return NextResponse.json({ error: "No artist profile" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const focus = body?.focus as BrandFocus | undefined;
  const generate =
    (body?.generate as "bio" | "pitch" | "origin_story" | null) ?? null;

  // Auto-create wiki row if none exists.
  let { data: wiki } = await supabase
    .from("brand_wiki")
    .select("*")
    .eq("artist_id", artist.id)
    .maybeSingle();
  const admin = createAdminClient();
  if (!wiki) {
    const { data: created, error: createErr } = await admin
      .from("brand_wiki")
      .insert({ artist_id: artist.id })
      .select()
      .single();
    if (createErr)
      return NextResponse.json(
        { error: createErr.message },
        { status: 500 }
      );
    wiki = created;
  }

  try {
    const { guidance, tokensUsed, durationMs } = await runBrandDirector({
      wiki: wiki ?? {},
      focus,
      generate,
      artistName: artist.artist_name,
    });

    const now = new Date().toISOString();
    await admin
      .from("brand_wiki")
      .update({
        last_guided_at: now,
        completeness_pct: guidance.completeness_pct,
      })
      .eq("artist_id", artist.id);

    await admin.from("agent_logs").insert({
      artist_id: artist.id,
      agent_type: "brand_director",
      action: "guide",
      summary: `Brand wiki at ${guidance.completeness_pct}% — ${guidance.missing_critical.length} critical gap${guidance.missing_critical.length === 1 ? "" : "s"}`,
      details: {
        focus,
        generate,
        completeness_pct: guidance.completeness_pct,
        missing_critical_count: guidance.missing_critical.length,
        confidence: guidance.confidence,
      },
      tokens_used: tokensUsed,
      duration_ms: durationMs,
    });

    if (
      guidance.completeness_pct < 40 &&
      guidance.missing_critical.length >= 4
    ) {
      await admin.from("alerts").insert({
        artist_id: artist.id,
        agent_type: "brand_director",
        severity: "warning",
        title: "Brand Wiki needs attention",
        message: `Your Brand Wiki is at ${guidance.completeness_pct}%. Downstream agents (Content, Outreach) will emit generic output until core identity fields are filled.`,
        action_url: "/brand",
      });
    }

    return NextResponse.json({ guidance, tokensUsed, durationMs });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Brand Director failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
