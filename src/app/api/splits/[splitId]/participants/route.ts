import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ splitId: string }> }
) {
  const { splitId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { data: participant, error } = await supabase
    .from("split_participants")
    .insert({
      split_id: splitId,
      name: body.name,
      role: body.role,
      writer_share: body.writer_share || 0,
      publisher_share: body.publisher_share || 0,
      pro_affiliation: body.pro_affiliation || null,
      ipi_number: body.ipi_number || null,
      email: body.email || null,
    })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(participant);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ splitId: string }> }
) {
  await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const participantId = searchParams.get("participantId");
  if (!participantId)
    return NextResponse.json({ error: "participantId required" }, { status: 400 });

  const { error } = await supabase
    .from("split_participants")
    .delete()
    .eq("id", participantId);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
