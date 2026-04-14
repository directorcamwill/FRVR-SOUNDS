import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ phaseId: string }> }
) {
  const { phaseId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const updateFields: Record<string, unknown> = {};
  const allowed = ["title", "description", "status", "goals", "start_month", "end_month"];
  for (const [k, v] of Object.entries(body)) {
    if (allowed.includes(k)) updateFields[k] = v;
  }

  const { data: phase, error } = await supabase
    .from("timeline_phases")
    .update(updateFields)
    .eq("id", phaseId)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(phase);
}
