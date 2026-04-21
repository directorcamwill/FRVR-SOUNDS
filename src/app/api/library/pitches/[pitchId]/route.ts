import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ pitchId: string }> }
) {
  const { pitchId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const allowed = ["sent", "opened", "interested", "passed", "placed"];
  const patch: Record<string, unknown> = {
    last_activity_at: new Date().toISOString(),
  };
  if (body.status && allowed.includes(body.status)) patch.status = body.status;
  if (typeof body.notes === "string") patch.notes = body.notes;
  if (body.follow_up_date) patch.follow_up_date = body.follow_up_date;

  const { data, error } = await supabase
    .from("library_pitches")
    .update(patch)
    .eq("id", pitchId)
    .select()
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pitch: data });
}
