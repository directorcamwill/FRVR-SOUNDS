import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// Public endpoint — serves the brief data for a pitch. Also increments the
// view counter and sets opened_at on first view.

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const admin = createAdminClient();

  const { data: pitch, error } = await admin
    .from("library_pitches")
    .select("*")
    .eq("pitch_slug", slug)
    .single();
  if (error || !pitch)
    return NextResponse.json({ error: "Pitch not found" }, { status: 404 });

  const { data: deal } = await admin
    .from("library_deals")
    .select("*")
    .eq("id", pitch.deal_id)
    .single();
  if (!deal)
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });

  // Fresh short-lived signed URL for audio playback
  let signed_audio_url: string | null = null;
  if (deal.song_file_path) {
    const { data: signed } = await admin.storage
      .from("audio-files")
      .createSignedUrl(deal.song_file_path, 60 * 60 * 6);
    signed_audio_url = signed?.signedUrl ?? null;
  }

  // Track the open
  const patch: Record<string, unknown> = {
    view_count: (pitch.view_count ?? 0) + 1,
    last_activity_at: new Date().toISOString(),
  };
  if (!pitch.opened_at) {
    patch.opened_at = new Date().toISOString();
    patch.status = "opened";
  }
  await admin.from("library_pitches").update(patch).eq("id", pitch.id);

  return NextResponse.json({
    pitch: { ...pitch, ...patch },
    deal: { ...deal, signed_audio_url },
  });
}
