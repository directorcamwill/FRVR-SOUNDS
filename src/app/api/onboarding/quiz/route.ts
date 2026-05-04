import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import {
  QuizResponses,
  quizIsComplete,
  recommendTier,
  tierToPlanId,
} from "@/lib/onboarding/quiz";

/**
 * /api/onboarding/quiz
 *
 * GET  → returns the artist's saved quiz response, or null.
 * POST → saves responses, computes tier_signals + recommended_plan_id,
 *        upserts a single row per artist. Re-postable to retake the quiz.
 *
 * Recommendation is advisory and stored on `onboarding_responses` only.
 * It does NOT change the user's billing plan — that flow lives in
 * /settings (existing pricing UI).
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
    .from("onboarding_responses")
    .select("*")
    .eq("artist_id", artist.id)
    .maybeSingle();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ response: data ?? null });
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

  const body = (await request.json().catch(() => ({}))) as {
    responses?: QuizResponses;
  };
  const responses: QuizResponses = body.responses ?? {};

  if (!quizIsComplete(responses)) {
    return NextResponse.json(
      { error: "Quiz incomplete — required questions are missing." },
      { status: 400 },
    );
  }

  const tierSignals = recommendTier(responses);
  const recommendedPlanId = tierToPlanId(tierSignals.recommendation);

  const admin = createAdminClient();
  const { data: saved, error } = await admin
    .from("onboarding_responses")
    .upsert(
      {
        artist_id: artist.id,
        responses,
        tier_signals: tierSignals,
        recommended_plan_id: recommendedPlanId,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "artist_id" },
    )
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    response: saved,
    tier_signals: tierSignals,
    recommended_plan_id: recommendedPlanId,
  });
}
