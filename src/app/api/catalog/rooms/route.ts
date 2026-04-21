import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// Public — list all published rooms with a count of songs in each.
export async function GET() {
  const admin = createAdminClient();

  const { data: rooms, error } = await admin
    .from("library_rooms")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: counts } = await admin
    .from("library_room_songs")
    .select("room_id");

  const countByRoom = new Map<string, number>();
  for (const row of counts ?? []) {
    countByRoom.set(row.room_id, (countByRoom.get(row.room_id) ?? 0) + 1);
  }

  const withCounts = (rooms ?? []).map((r) => ({
    ...r,
    song_count: countByRoom.get(r.id) ?? 0,
  }));

  return NextResponse.json({ rooms: withCounts });
}
