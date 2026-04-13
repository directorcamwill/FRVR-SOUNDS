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

  const { data: submissions, error } = await supabase
    .from("submissions")
    .select(
      `
      *,
      opportunity:opportunities(id, title, company, stage),
      song:songs(id, title)
    `
    )
    .eq("artist_id", artist.id)
    .order("submission_date", { ascending: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(submissions);
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
  const { data: submission, error } = await supabase
    .from("submissions")
    .insert({
      artist_id: artist.id,
      opportunity_id: body.opportunity_id || null,
      song_id: body.song_id || null,
      submitted_to: body.submitted_to,
      submitted_via: body.submitted_via || null,
      submission_date: body.submission_date || new Date().toISOString(),
      deadline: body.deadline || null,
      status: body.status || "submitted",
      fee_amount: body.fee_amount || null,
      notes: body.notes || null,
      follow_up_date: body.follow_up_date || null,
    })
    .select(
      `
      *,
      opportunity:opportunities(id, title, company, stage),
      song:songs(id, title)
    `
    )
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // Update opportunity stage to "submitted" if linked
  if (body.opportunity_id) {
    await supabase
      .from("opportunities")
      .update({ stage: "submitted" })
      .eq("id", body.opportunity_id);
  }

  return NextResponse.json(submission);
}
