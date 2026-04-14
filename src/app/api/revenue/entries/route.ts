import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("start");
  const endDate = searchParams.get("end");
  const type = searchParams.get("type");

  // Get artist's streams
  let streamsQuery = supabase
    .from("revenue_streams")
    .select("id")
    .eq("artist_id", artist.id);
  if (type) streamsQuery = streamsQuery.eq("type", type);
  const { data: streams } = await streamsQuery;
  const streamIds = streams?.map((s) => s.id) || [];

  let query = supabase
    .from("revenue_entries")
    .select(`*, revenue_streams(type, platform), songs(title)`)
    .in("stream_id", streamIds.length > 0 ? streamIds : ["00000000-0000-0000-0000-000000000000"])
    .order("received_date", { ascending: false });

  if (startDate) query = query.gte("received_date", startDate);
  if (endDate) query = query.lte("received_date", endDate);

  const { data: entries, error } = await query;
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(entries);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { data: entry, error } = await supabase
    .from("revenue_entries")
    .insert({
      stream_id: body.stream_id,
      song_id: body.song_id || null,
      amount: body.amount,
      currency: body.currency || "USD",
      source: body.source || null,
      period_start: body.period_start || null,
      period_end: body.period_end || null,
      received_date: body.received_date,
      notes: body.notes || null,
    })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(entry);
}
