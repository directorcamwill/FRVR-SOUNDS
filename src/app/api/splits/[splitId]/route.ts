import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ splitId: string }> }
) {
  const { splitId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: split, error } = await supabase
    .from("song_splits")
    .select(`*, split_participants(*), songs(title, status)`)
    .eq("id", splitId)
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(split);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ splitId: string }> }
) {
  const { splitId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { data: split, error } = await supabase
    .from("song_splits")
    .update({ notes: body.notes })
    .eq("id", splitId)
    .select(`*, split_participants(*)`)
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(split);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ splitId: string }> }
) {
  const { splitId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("song_splits")
    .delete()
    .eq("id", splitId);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
