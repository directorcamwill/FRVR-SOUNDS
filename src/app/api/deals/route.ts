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

  const { data: deals, error } = await supabase
    .from("deals")
    .select(`*, songs(title)`)
    .eq("artist_id", artist.id)
    .order("created_at", { ascending: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(deals);
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
  const { data: deal, error } = await supabase
    .from("deals")
    .insert({
      artist_id: artist.id,
      song_id: body.song_id || null,
      deal_type: body.deal_type,
      partner: body.partner,
      description: body.description || null,
      fee_amount: body.fee_amount || null,
      terms: body.terms || {},
      start_date: body.start_date || null,
      end_date: body.end_date || null,
      status: body.status || "active",
    })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(deal);
}
