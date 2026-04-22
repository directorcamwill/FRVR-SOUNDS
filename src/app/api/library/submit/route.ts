import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse, after } from "next/server";
import { runAudioAnalysis } from "@/lib/audio/run-analysis";

// Public endpoint — no auth. Creates a library submission row after the
// artist has uploaded their file to the signed URL path.

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  const required = [
    "submitter_name",
    "submitter_email",
    "artist_name",
    "song_title",
    "proposed_deal_type",
    "attestation_owns_rights",
  ];
  for (const k of required) {
    if (!body?.[k])
      return NextResponse.json(
        { error: `${k} is required` },
        { status: 400 }
      );
  }

  if (body.attestation_owns_rights !== true) {
    return NextResponse.json(
      { error: "You must confirm you own or control the rights to this song." },
      { status: 400 }
    );
  }
  if (
    body.proposed_deal_type !== "rev_share" &&
    body.proposed_deal_type !== "upfront_fee"
  ) {
    return NextResponse.json(
      { error: "proposed_deal_type must be rev_share or upfront_fee" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  const submission = {
    submitter_name: String(body.submitter_name).trim(),
    submitter_email: String(body.submitter_email).trim().toLowerCase(),
    submitter_phone: body.submitter_phone || null,
    artist_name: String(body.artist_name).trim(),
    song_title: String(body.song_title).trim(),
    song_file_path: body.song_file_path || null,
    proposed_deal_type: body.proposed_deal_type,
    genre: body.genre || null,
    sub_genre: body.sub_genre || null,
    moods: Array.isArray(body.moods) ? body.moods : null,
    bpm: body.bpm ? parseInt(body.bpm, 10) : null,
    key: body.key || null,
    vocal_type: body.vocal_type || null,
    lyrics: body.lyrics || null,
    sync_history: body.sync_history || null,
    is_one_stop: !!body.is_one_stop,
    instrumental_available: !!body.instrumental_available,
    attestation_owns_rights: true,
    notes_from_artist: body.notes_from_artist || null,
    status: "pending" as const,
  };

  const { data, error } = await admin
    .from("library_submissions")
    .insert(submission)
    .select("id")
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  if (submission.song_file_path) {
    after(async () => {
      try {
        await runAudioAnalysis({
          admin,
          filePath: submission.song_file_path!,
          submissionId: data.id,
        });
      } catch (e) {
        console.error("[audio-analysis] submission", data.id, e);
      }
    });
  }

  return NextResponse.json({ id: data.id });
}
