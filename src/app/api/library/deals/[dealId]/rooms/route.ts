import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Operator endpoint — read/replace the set of Northwoods catalog rooms a deal
// is assigned to. Authenticated users only (operator side).

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ dealId: string }> }
) {
  const { dealId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("library_room_songs")
    .select("room_id, library_rooms(slug, name, accent_color)")
    .eq("deal_id", dealId);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ room_ids: (data ?? []).map((r) => r.room_id), rooms: data ?? [] });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ dealId: string }> }
) {
  const { dealId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const roomIds: unknown = body?.room_ids;
  if (!Array.isArray(roomIds))
    return NextResponse.json({ error: "room_ids array required" }, { status: 400 });

  // Replace strategy: wipe existing assignments, insert new ones.
  const { error: delError } = await supabase
    .from("library_room_songs")
    .delete()
    .eq("deal_id", dealId);
  if (delError)
    return NextResponse.json({ error: delError.message }, { status: 500 });

  if (roomIds.length > 0) {
    const rows = roomIds.map((room_id, i) => ({
      room_id: String(room_id),
      deal_id: dealId,
      sort_order: i * 10,
    }));
    const { error: insError } = await supabase
      .from("library_room_songs")
      .insert(rows);
    if (insError)
      return NextResponse.json({ error: insError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, count: roomIds.length });
}
