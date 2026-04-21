import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { PLANS, type PlanId } from "@/lib/plans";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Pick plan from signup metadata; default to starter. Never let anon users
  // self-assign "internal" — that's operator-only.
  const metadataPlan = (user.user_metadata?.plan_id ?? "starter") as PlanId;
  const planId: PlanId =
    metadataPlan in PLANS && metadataPlan !== "internal"
      ? metadataPlan
      : "starter";

  const { data: artist, error } = await supabase
    .from("artists")
    .insert({
      profile_id: user.id,
      artist_name: body.artist_name,
      genres: body.genres,
      pro_affiliation: body.pro_affiliation,
      has_stems: body.has_stems,
      has_business_entity: body.has_entity,
      goals: body.goals,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Seed subscription + empty brand wiki via admin client so we don't get
  // tripped up by RLS during first-run setup.
  const admin = createAdminClient();
  await admin.from("subscriptions").upsert(
    {
      artist_id: artist.id,
      plan_id: planId,
      status: "trialing",
      current_period_ends_at: new Date(
        Date.now() + 14 * 24 * 60 * 60 * 1000
      ).toISOString(),
    },
    { onConflict: "artist_id" }
  );
  await admin.from("brand_wiki").upsert(
    { artist_id: artist.id },
    { onConflict: "artist_id" }
  );

  return NextResponse.json({ success: true, plan_id: planId });
}
