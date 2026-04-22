import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/**
 * POST /api/brand-wiki/activate
 * Called by the client when it detects all 7 Brand Journey modules at ≥80%.
 *
 * Sets `brand_wiki.journey_activated_at` once (idempotent) and inserts a
 * celebratory alert row on the first activation. Returns whether the
 * activation fired or was already set, plus the timestamp.
 *
 * No feature-gate: every paying tier gets the activation record. The actual
 * 3D Constellation + reward tools are Studio-gated at render time.
 */

export async function POST() {
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

  const admin = createAdminClient();

  // Read current activation state.
  const { data: wiki } = await admin
    .from("brand_wiki")
    .select("journey_activated_at")
    .eq("artist_id", artist.id)
    .maybeSingle();

  if (wiki?.journey_activated_at) {
    return NextResponse.json({
      activated: false,
      already_active: true,
      journey_activated_at: wiki.journey_activated_at,
    });
  }

  // First-time activation: stamp the timestamp + drop a celebration alert.
  const now = new Date().toISOString();
  const { error: updateErr } = await admin
    .from("brand_wiki")
    .update({ journey_activated_at: now })
    .eq("artist_id", artist.id);
  if (updateErr)
    return NextResponse.json({ error: updateErr.message }, { status: 500 });

  await admin.from("alerts").insert({
    artist_id: artist.id,
    agent_type: "brand_director",
    severity: "info",
    title: "Brand Wiki activated",
    message: `You finished the Brand Journey. Your Wiki is now open and every downstream agent reads from it. Tap "Open 3D Constellation" on the Brand page to explore.`,
    action_url: "/brand",
  });

  return NextResponse.json({
    activated: true,
    already_active: false,
    journey_activated_at: now,
  });
}
