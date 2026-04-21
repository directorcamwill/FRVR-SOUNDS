import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("pitch_targets")
    .select("*")
    .order("created_at", { ascending: false });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ targets: data ?? [] });
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

  const body = await request.json().catch(() => ({}));
  if (!body?.name || !body?.target_type)
    return NextResponse.json(
      { error: "name and target_type required" },
      { status: 400 }
    );

  const { data, error } = await supabase
    .from("pitch_targets")
    .insert({
      name: String(body.name).trim(),
      target_type: body.target_type,
      company: body.company || null,
      contact_path: body.contact_path || null,
      notes: body.notes || null,
      added_by: artist?.id ?? null,
    })
    .select()
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ target: data });
}
