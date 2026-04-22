import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/**
 * /api/brand-wiki/responses — raw Brand Journey answers.
 *
 * brand_wiki holds the refined / canonical state that agents read.
 * brand_module_responses holds the source-of-truth text the artist typed
 * per (artist, module, question) — plus any Director's-Notes refinement
 * history. Kept indefinitely as audit trail.
 *
 * POST upserts one response. The corresponding brand_wiki field should be
 * updated via /api/brand-wiki (client calls both in parallel on blur).
 * GET returns all responses for the signed-in artist.
 */

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

  const { data, error } = await supabase
    .from("brand_module_responses")
    .select("*")
    .eq("artist_id", artist.id)
    .order("updated_at", { ascending: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ responses: data ?? [] });
}

interface PostBody {
  module_id: string;
  question_id: string;
  field_key: string;
  raw_answer?: string | null;
  refined_answer?: string | null;
  critique?: unknown;
  confidence?: number | null;
  accepted_refine?: boolean;
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

  const body = (await request.json()) as PostBody;
  if (!body.module_id || !body.question_id || !body.field_key) {
    return NextResponse.json(
      { error: "module_id, question_id, field_key required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const payload: Record<string, unknown> = {
    artist_id: artist.id,
    module_id: body.module_id,
    question_id: body.question_id,
    field_key: body.field_key,
  };
  if (body.raw_answer !== undefined) payload.raw_answer = body.raw_answer;
  if (body.refined_answer !== undefined)
    payload.refined_answer = body.refined_answer;
  if (body.critique !== undefined) payload.critique = body.critique;
  if (body.confidence !== undefined) payload.confidence = body.confidence;
  if (body.accepted_refine !== undefined)
    payload.accepted_refine = body.accepted_refine;

  const { data, error } = await admin
    .from("brand_module_responses")
    .upsert(payload, { onConflict: "artist_id,module_id,question_id" })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ response: data });
}
