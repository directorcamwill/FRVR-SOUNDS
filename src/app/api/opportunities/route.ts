import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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

  const { data: opportunities, error } = await supabase
    .from("opportunities")
    .select(
      `
      *,
      opportunity_matches(id, fit_score, status)
    `
    )
    .eq("artist_id", artist.id)
    .order("created_at", { ascending: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(opportunities);
}

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
  const { data: opportunity, error } = await supabase
    .from("opportunities")
    .insert({
      artist_id: artist.id,
      title: body.title,
      description: body.description || null,
      source: body.source || null,
      source_url: body.source_url || null,
      opportunity_type: body.opportunity_type || null,
      genres_needed: body.genres_needed || [],
      moods_needed: body.moods_needed || [],
      budget_range: body.budget_range || null,
      deadline: body.deadline || null,
      contact_name: body.contact_name || null,
      contact_email: body.contact_email || null,
      company: body.company || null,
      exclusive: body.exclusive ?? false,
      stage: body.stage || "discovery",
    })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(opportunity);
}
