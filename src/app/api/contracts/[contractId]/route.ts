import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ contractId: string }> }
) {
  const { contractId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: contract, error } = await supabase
    .from("contracts")
    .select(`*, contract_participants(*), songs(title)`)
    .eq("id", contractId)
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(contract);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ contractId: string }> }
) {
  const { contractId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const allowed = ["title", "description", "status", "contract_type", "start_date", "end_date", "terms", "file_url", "song_id"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  const { data: contract, error } = await supabase
    .from("contracts")
    .update(updates)
    .eq("id", contractId)
    .select(`*, contract_participants(*)`)
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(contract);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ contractId: string }> }
) {
  const { contractId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("contracts")
    .delete()
    .eq("id", contractId);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
