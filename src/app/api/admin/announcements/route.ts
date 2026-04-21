import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserAccess } from "@/lib/features";

export async function GET() {
  const access = await getUserAccess();
  if (!access?.is_super_admin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ announcements: data ?? [] });
}

export async function POST(request: Request) {
  const access = await getUserAccess();
  if (!access?.is_super_admin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  if (!body?.title || !body?.body)
    return NextResponse.json(
      { error: "title and body required" },
      { status: 400 }
    );

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("announcements")
    .insert({
      title: body.title,
      body: body.body,
      severity: body.severity || "info",
      target_plan_ids: Array.isArray(body.target_plan_ids)
        ? body.target_plan_ids
        : [],
      cta_label: body.cta_label || null,
      cta_url: body.cta_url || null,
      starts_at: body.starts_at || new Date().toISOString(),
      ends_at: body.ends_at || null,
      dismissible: body.dismissible !== false,
      created_by: access.profile_id,
    })
    .select()
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ announcement: data });
}
