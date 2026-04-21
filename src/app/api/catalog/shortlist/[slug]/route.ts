import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// Public GET — fetch the shortlist + all assigned songs (with signed audio URLs).
// Slug is the auth; anyone with the link can view, edit, or share.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const admin = createAdminClient();

  const { data: list, error } = await admin
    .from("library_shortlists")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error || !list)
    return NextResponse.json({ error: "Shortlist not found" }, { status: 404 });

  const { data: assignments } = await admin
    .from("library_shortlist_songs")
    .select("deal_id, sort_order, note")
    .eq("shortlist_id", list.id)
    .order("sort_order", { ascending: true });

  const dealIds = (assignments ?? []).map((a) => a.deal_id);
  let songs: unknown[] = [];
  if (dealIds.length > 0) {
    const { data: deals } = await admin
      .from("library_deals")
      .select(
        "id, song_title, artist_name, genre, moods, bpm, key, vocal_type, is_one_stop, song_file_path, deal_type",
      )
      .in("id", dealIds);

    const signedByPath = new Map<string, string>();
    for (const d of deals ?? []) {
      if (d.song_file_path && !signedByPath.has(d.song_file_path)) {
        const { data: signed } = await admin.storage
          .from("audio-files")
          .createSignedUrl(d.song_file_path, 60 * 60 * 2);
        if (signed?.signedUrl) signedByPath.set(d.song_file_path, signed.signedUrl);
      }
    }

    const notesByDeal = new Map<string, string | null>();
    const orderByDeal = new Map<string, number>();
    for (const a of assignments ?? []) {
      notesByDeal.set(a.deal_id, a.note ?? null);
      orderByDeal.set(a.deal_id, a.sort_order);
    }

    songs = (deals ?? [])
      .map((d) => ({
        ...d,
        signed_audio_url: d.song_file_path ? signedByPath.get(d.song_file_path) ?? null : null,
        shortlist_note: notesByDeal.get(d.id) ?? null,
        sort_order: orderByDeal.get(d.id) ?? 999,
      }))
      .sort((a, b) => (a.sort_order as number) - (b.sort_order as number));
  }

  // Track a view — best effort
  await admin
    .from("library_shortlists")
    .update({
      view_count: (list.view_count ?? 0) + 1,
      last_viewed_at: new Date().toISOString(),
    })
    .eq("id", list.id);

  return NextResponse.json({ shortlist: list, songs });
}

// Add or remove songs from the shortlist.
// Body: { deal_id, action: 'add' | 'remove', note?: string }
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await request.json().catch(() => ({}));
  const dealId: string | undefined = body?.deal_id;
  const action: string | undefined = body?.action;
  const note: string | null = body?.note ?? null;
  if (!dealId || (action !== "add" && action !== "remove"))
    return NextResponse.json({ error: "deal_id + action required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: list } = await admin
    .from("library_shortlists")
    .select("id")
    .eq("slug", slug)
    .single();
  if (!list)
    return NextResponse.json({ error: "Shortlist not found" }, { status: 404 });

  if (action === "remove") {
    await admin
      .from("library_shortlist_songs")
      .delete()
      .eq("shortlist_id", list.id)
      .eq("deal_id", dealId);
    return NextResponse.json({ ok: true });
  }

  // Add — compute next sort_order
  const { data: max } = await admin
    .from("library_shortlist_songs")
    .select("sort_order")
    .eq("shortlist_id", list.id)
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextOrder = ((max?.[0]?.sort_order as number | undefined) ?? -10) + 10;

  const { error } = await admin
    .from("library_shortlist_songs")
    .upsert(
      { shortlist_id: list.id, deal_id: dealId, sort_order: nextOrder, note },
      { onConflict: "shortlist_id,deal_id" },
    );
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// Update shortlist metadata (name, notes).
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await request.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};
  if (typeof body?.name === "string") patch.name = body.name.slice(0, 120);
  if (typeof body?.notes === "string") patch.notes = body.notes;
  if (Object.keys(patch).length === 0)
    return NextResponse.json({ error: "nothing to update" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin
    .from("library_shortlists")
    .update(patch)
    .eq("slug", slug);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
