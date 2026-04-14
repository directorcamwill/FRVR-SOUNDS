import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ deliverableId: string }> }
) {
  const { deliverableId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const updateFields: Record<string, unknown> = {};
  const allowed = [
    "title",
    "description",
    "category",
    "target_count",
    "current_count",
    "target_date",
    "status",
    "priority",
  ];
  for (const [k, v] of Object.entries(body)) {
    if (allowed.includes(k)) updateFields[k] = v;
  }

  // Handle increment shorthand
  if (body.increment) {
    const { data: existing } = await supabase
      .from("deliverables")
      .select("current_count, target_count")
      .eq("id", deliverableId)
      .single();
    if (existing) {
      const newCount = existing.current_count + (body.increment as number);
      updateFields.current_count = newCount;
      if (newCount >= existing.target_count) {
        updateFields.status = "completed";
      } else if (newCount > 0) {
        updateFields.status = "in_progress";
      }
    }
  }

  const { data: deliverable, error } = await supabase
    .from("deliverables")
    .update(updateFields)
    .eq("id", deliverableId)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(deliverable);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ deliverableId: string }> }
) {
  const { deliverableId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("deliverables")
    .delete()
    .eq("id", deliverableId);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
