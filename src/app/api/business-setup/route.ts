import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { runBusinessManager } from "@/lib/agents/business-manager";

export async function GET() {
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

  // Get or create setup
  let { data: setup } = await supabase
    .from("business_setup")
    .select("*")
    .eq("artist_id", artist.id)
    .single();

  if (!setup) {
    const { data: newSetup } = await supabase
      .from("business_setup")
      .insert({ artist_id: artist.id })
      .select()
      .single();
    setup = newSetup;
  }

  // Auto-run agent if never run or older than 1 hour
  if (
    setup &&
    (!setup.last_agent_run ||
      Date.now() - new Date(setup.last_agent_run).getTime() > 3600000)
  ) {
    try {
      const result = await runBusinessManager(artist.id);
      return NextResponse.json(result);
    } catch {
      // Return setup even if agent fails
      return NextResponse.json({ setup, recommendations: [], current_focus: null, encouragement: null });
    }
  }

  return NextResponse.json({
    setup,
    recommendations: setup?.ai_recommendations || [],
    current_focus: null,
    encouragement: null,
  });
}

export async function PATCH(request: Request) {
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

  // Whitelist of allowed fields
  const allowedFields = [
    "artist_name_chosen",
    "genre_defined",
    "goals_defined",
    "email_professional",
    "social_handles_secured",
    "llc_status",
    "llc_state",
    "llc_service",
    "ein_obtained",
    "business_bank_account",
    "pro_registered",
    "pro_name",
    "publisher_setup",
    "publisher_name",
    "admin_deal",
    "admin_company",
    "daw_chosen",
    "home_studio_budget",
    "home_studio_setup",
    "file_organization_system",
    "naming_convention_set",
    "metadata_template_created",
    "backup_system",
    "sync_ready_tracks",
    "library_accounts",
    "distribution_setup",
    "distributor_name",
    "website_live",
    "epk_created",
    // LLC agent fields
    "career_stage",
    "monthly_music_income",
    "annual_music_income",
    "revenue_streams",
    "release_frequency",
    "sync_activity",
    "llc_name",
    "payment_routing_setup",
  ];

  const updates: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in body) {
      updates[key] = body[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  const { data: setup, error } = await supabase
    .from("business_setup")
    .update(updates)
    .eq("artist_id", artist.id)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(setup);
}
