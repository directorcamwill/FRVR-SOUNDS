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
    .select("*")
    .eq("profile_id", user.id)
    .single();
  if (!artist)
    return NextResponse.json({ error: "No artist profile" }, { status: 404 });

  return NextResponse.json({
    email: user.email,
    full_name: user.user_metadata?.full_name || "",
    artist_name: artist.artist_name,
    genres: artist.genres || [],
    moods: artist.moods || [],
    pro_affiliation: artist.pro_affiliation || "",
    ipi_number: artist.ipi_number || "",
    goals: artist.goals || [],
    has_stems: artist.has_stems || false,
    has_entity: artist.has_entity || false,
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

  // Separate profile fields from artist fields
  const artistFields: Record<string, unknown> = {};
  const artistKeys = [
    "artist_name", "genres", "moods", "pro_affiliation",
    "ipi_number", "goals", "has_stems", "has_entity",
  ];

  for (const key of artistKeys) {
    if (key in body) {
      artistFields[key] = body[key];
    }
  }

  if (Object.keys(artistFields).length > 0) {
    const { error } = await supabase
      .from("artists")
      .update(artistFields)
      .eq("id", artist.id);

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update user metadata if full_name changed
  if ("full_name" in body) {
    await supabase.auth.updateUser({
      data: { full_name: body.full_name },
    });
  }

  return NextResponse.json({ success: true });
}
