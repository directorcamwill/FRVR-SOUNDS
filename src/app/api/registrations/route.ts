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

  // Get all songs
  const { data: songs } = await supabase
    .from("songs")
    .select("id, title, status")
    .eq("artist_id", artist.id)
    .order("title");

  // Get all registrations for those songs
  const songIds = songs?.map((s) => s.id) || [];
  const { data: registrations, error } = await supabase
    .from("song_registrations")
    .select(`*, songs(title, status)`)
    .in("song_id", songIds.length > 0 ? songIds : ["00000000-0000-0000-0000-000000000000"])
    .order("created_at", { ascending: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // Build a map of registrations per song and detect missing ones
  const requiredTypes = ["pro", "mlc", "soundexchange", "publishing_admin", "isrc"];
  const songRegistrationMap = (songs || []).map((song) => {
    const songRegs = registrations?.filter((r) => r.song_id === song.id) || [];
    const missing = requiredTypes.filter(
      (type) => !songRegs.some((r) => r.registration_type === type)
    );
    return {
      song,
      registrations: songRegs,
      missing_types: missing,
      is_complete: missing.length === 0,
    };
  });

  const missingCount = songRegistrationMap.filter((s) => !s.is_complete).length;

  return NextResponse.json({
    songs: songRegistrationMap,
    registrations: registrations || [],
    missing_count: missingCount,
    total_songs: songs?.length || 0,
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { data: registration, error } = await supabase
    .from("song_registrations")
    .insert({
      song_id: body.song_id,
      registration_type: body.registration_type,
      platform: body.platform || null,
      status: body.status || "missing",
      external_id: body.external_id || null,
      notes: body.notes || null,
    })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(registration);
}
