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
  const type = searchParams.get("type");
  const status = searchParams.get("status");

  let query = supabase
    .from("ideas")
    .select("*")
    .eq("artist_id", artist.id)
    .order("created_at", { ascending: false });

  if (type && type !== "all") query = query.eq("type", type);
  if (status && status !== "all") query = query.eq("status", status);

  const { data: ideas, error } = await query;

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(ideas);
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
  const { data: idea, error } = await supabase
    .from("ideas")
    .insert({
      artist_id: artist.id,
      type: body.type,
      title: body.title,
      description: body.description || null,
      inspiration: body.inspiration || null,
      ai_generated: body.ai_generated || false,
      tags: body.tags || [],
    })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(idea);
}
