import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse, after } from "next/server";
import { runAudioAnalysis } from "@/lib/audio/run-analysis";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  const { submissionId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("library_submissions")
    .select("*")
    .eq("id", submissionId)
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // Generate a fresh signed URL for the audio file (24h)
  let signed_audio_url: string | null = null;
  if (data?.song_file_path) {
    const admin = createAdminClient();
    const { data: signed } = await admin.storage
      .from("audio-files")
      .createSignedUrl(data.song_file_path, 60 * 60 * 24);
    signed_audio_url = signed?.signedUrl ?? null;
  }
  return NextResponse.json({ ...data, signed_audio_url });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  const { submissionId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const allowedStatus = ["pending", "reviewing", "accepted", "rejected"];
  const patch: Record<string, unknown> = {
    reviewed_at: new Date().toISOString(),
  };
  if (body.status && allowedStatus.includes(body.status))
    patch.status = body.status;
  if (typeof body.review_notes === "string")
    patch.review_notes = body.review_notes;
  if (typeof body.rejection_reason === "string")
    patch.rejection_reason = body.rejection_reason;

  const { data: submission, error } = await supabase
    .from("library_submissions")
    .update(patch)
    .eq("id", submissionId)
    .select()
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // If accepted with deal terms, create the library_deal row.
  if (
    body.status === "accepted" &&
    (body.deal?.deal_type === "rev_share" ||
      body.deal?.deal_type === "upfront_fee")
  ) {
    const admin = createAdminClient();
    const deal = body.deal;
    const isRev = deal.deal_type === "rev_share";
    const now = new Date();
    const term = Number(deal.term_months ?? (isRev ? 24 : 12));
    const ends = new Date(now);
    ends.setMonth(ends.getMonth() + term);

    const dealRow = {
      submission_id: submission.id,
      song_title: submission.song_title,
      artist_name: submission.artist_name,
      deal_type: deal.deal_type,
      artist_split_pct: Number(deal.artist_split_pct ?? (isRev ? 60 : 80)),
      frvr_split_pct: Number(deal.frvr_split_pct ?? (isRev ? 40 : 20)),
      upfront_fee_cents: isRev ? null : Number(deal.upfront_fee_cents ?? 9900),
      upfront_fee_status: isRev ? "not_applicable" : "pending",
      term_months: term,
      starts_at: now.toISOString().split("T")[0],
      ends_at: ends.toISOString().split("T")[0],
      exclusive_sync: isRev,
      exclusive_master: false,
      exclusive_publishing: false,
      status: "pending_signature",
      song_file_path: submission.song_file_path,
      genre: submission.genre,
      sub_genre: submission.sub_genre,
      moods: submission.moods,
      bpm: submission.bpm,
      key: submission.key,
      vocal_type: submission.vocal_type,
      is_one_stop: submission.is_one_stop,
    };
    const { data: createdDeal } = await admin
      .from("library_deals")
      .insert(dealRow)
      .select("id")
      .single();

    if (createdDeal?.id && submission.song_file_path) {
      after(async () => {
        try {
          await runAudioAnalysis({
            admin,
            filePath: submission.song_file_path,
            dealId: createdDeal.id,
          });
        } catch (e) {
          console.error("[audio-analysis] deal", createdDeal.id, e);
        }
      });
    }
  }

  return NextResponse.json({ submission });
}
