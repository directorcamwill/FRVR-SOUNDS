import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ songId: string }> }
) {
  const { songId } = await params;
  const supabase = await createClient();

  const { data: stems } = await supabase
    .from("stems")
    .select("*")
    .eq("song_id", songId)
    .order("created_at");

  return NextResponse.json(stems || []);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ songId: string }> }
) {
  const { songId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { data: stem, error } = await supabase
    .from("stems")
    .insert({
      song_id: songId,
      stem_type: body.stem_type,
      file_url: body.file_url,
      file_name: body.file_name,
      file_size_bytes: body.file_size_bytes,
    })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(stem);
}
