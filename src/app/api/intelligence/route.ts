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

  const { data: briefs, error } = await supabase
    .from("intelligence_briefs")
    .select("*")
    .eq("artist_id", artist.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(briefs);
}
