import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ dealId: string }> }
) {
  const { dealId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: deal, error } = await supabase
    .from("deals")
    .select(`*, songs(title)`)
    .eq("id", dealId)
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(deal);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ dealId: string }> }
) {
  const { dealId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const allowed = ["deal_type", "partner", "description", "fee_amount", "terms", "start_date", "end_date", "status", "song_id"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  const { data: deal, error } = await supabase
    .from("deals")
    .update(updates)
    .eq("id", dealId)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(deal);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ dealId: string }> }
) {
  const { dealId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("deals")
    .delete()
    .eq("id", dealId);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
