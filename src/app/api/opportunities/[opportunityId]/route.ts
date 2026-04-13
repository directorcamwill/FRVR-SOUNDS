import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ opportunityId: string }> }
) {
  const { opportunityId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: opportunity, error } = await supabase
    .from("opportunities")
    .select(
      `
      *,
      opportunity_matches(
        *,
        song:songs(id, title, sync_scores(overall_score))
      )
    `
    )
    .eq("id", opportunityId)
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(opportunity);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ opportunityId: string }> }
) {
  const { opportunityId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { data: opportunity, error } = await supabase
    .from("opportunities")
    .update(body)
    .eq("id", opportunityId)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(opportunity);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ opportunityId: string }> }
) {
  const { opportunityId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("opportunities")
    .delete()
    .eq("id", opportunityId);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
