import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
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
    "priority",
    "status",
    "due_date",
    "notes",
    "recurring",
    "recurrence_pattern",
    "time_block",
  ];
  for (const [k, v] of Object.entries(body)) {
    if (allowed.includes(k)) updateFields[k] = v;
  }

  // Auto-set completed_at
  if (body.status === "done") {
    updateFields.completed_at = new Date().toISOString();
  } else if (body.status && body.status !== "done") {
    updateFields.completed_at = null;
  }

  const { data: task, error } = await supabase
    .from("daily_tasks")
    .update(updateFields)
    .eq("id", taskId)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(task);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("daily_tasks")
    .delete()
    .eq("id", taskId);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
