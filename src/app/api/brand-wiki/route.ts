import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { computeBrandCompleteness } from "@/lib/agents/brand-director";
import type { BrandWiki } from "@/types/brand";

/**
 * /api/brand-wiki — CRUD for the signed-in artist's brand wiki row.
 * GET returns the wiki (auto-creates an empty row if missing).
 * PUT patches fields; recomputes completeness_pct on every write.
 */

export async function GET() {
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

  const { data: wiki, error } = await supabase
    .from("brand_wiki")
    .select("*")
    .eq("artist_id", artist.id)
    .maybeSingle();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  if (wiki) {
    return NextResponse.json({ wiki, artist_name: artist.artist_name });
  }

  // Bootstrap empty wiki row so later PUTs just UPDATE.
  const admin = createAdminClient();
  const { data: created, error: insertErr } = await admin
    .from("brand_wiki")
    .insert({ artist_id: artist.id })
    .select()
    .single();
  if (insertErr)
    return NextResponse.json(
      { error: insertErr.message },
      { status: 500 }
    );
  return NextResponse.json({ wiki: created, artist_name: artist.artist_name });
}

// Fields we accept via PUT. Everything else silently dropped — keeps schema clean.
const WRITABLE_FIELDS: Array<keyof BrandWiki> = [
  // Identity
  "niche",
  "elevator_pitch",
  "origin_story",
  "bio_short",
  "bio_medium",
  "bio_long",
  "core_pain",
  "transformation_before",
  "transformation_after",
  "core_beliefs",
  "key_themes",
  // Audience
  "primary_audience",
  "secondary_audience",
  "audience_pain_points",
  "audience_desires",
  "audience_lifestyle_context",
  "audience_identity_goals",
  // Tone
  "tone_descriptors",
  "voice_dos",
  "voice_donts",
  "core_messaging",
  // Emotional Signature
  "desired_emotions",
  "natural_emotions",
  "emotional_tags",
  "energy_marker",
  "intensity_marker",
  "intensity_notes",
  // Positioning
  "positioning_statement",
  "differentiators",
  "category_lane",
  "what_not",
  "competitive_contrast",
  // Visual
  "color_primary",
  "color_secondary",
  "color_accent",
  "font_heading",
  "font_body",
  "texture_keywords",
  "logo_url",
  "icon_url",
  "press_photo_urls",
  // Sonic
  "sonic_genre_primary",
  "sonic_genre_secondary",
  "sonic_moods",
  "sonic_bpm_min",
  "sonic_bpm_max",
  "sonic_key_preferences",
  "sonic_texture_keywords",
  "reference_tracks",
  // Mix
  "mix_preferences",
  // Sync
  "sync_format_targets",
  "sync_library_targets",
  "avoid_sync_formats",
  // Journey state
  "current_module_id",
  "current_step_id",
  "module_locked_at",
  "module_completeness",
  "journey_notes",
  // V2 — Identity
  "public_truth",
  // V2 — Niche Domination Layer
  "niche_micro_statement",
  "niche_competitors",
  "niche_gap",
  "niche_ownable_territory",
  // V2 — Routes → Revenue
  "revenue_primary_path",
  "revenue_secondary_paths",
  "revenue_offer_100",
  "revenue_offer_1k",
  "revenue_offer_10k",
  // V2 — Module 8: Content Engine
  "content_pillars",
  "content_formats",
  "platform_strategy",
  "weekly_cadence",
  "weekly_cadence_primary_count",
  "weekly_cadence_batch_day",
  "weekly_cadence_ship_days",
  "hook_library",
  "conversion_path",
  // V2 — Cross-module artifacts
  "offer_ladder",
  "content_revenue_map",
  "consistency_plan",
  "module_outputs",
  "audience_models",
];

export async function PUT(request: Request) {
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
  const update: Record<string, unknown> = {};
  for (const f of WRITABLE_FIELDS) {
    if (f in body) update[f] = body[f];
  }

  // Merge in the current wiki to compute completeness from the full post-write
  // state (not just the patch).
  const { data: current } = await supabase
    .from("brand_wiki")
    .select("*")
    .eq("artist_id", artist.id)
    .maybeSingle();

  const merged = { ...(current ?? {}), ...update } as Partial<BrandWiki>;
  const { pct } = computeBrandCompleteness(merged);
  update.completeness_pct = pct;

  const admin = createAdminClient();
  const { data: saved, error } = await admin
    .from("brand_wiki")
    .upsert({ artist_id: artist.id, ...update }, { onConflict: "artist_id" })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ wiki: saved });
}
