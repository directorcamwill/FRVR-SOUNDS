import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Tiny, URL-safe slug generator — base36 timestamp + random suffix. Stored
// unique; used as the public /brief/[slug] path.
function makeSlug() {
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 8);
  return `${t}${r}`;
}

interface IncomingTarget {
  target_kind: "supervisor_directory" | "pitch_target";
  target_ref: string;
  target_name: string;
  target_company?: string;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const dealId = url.searchParams.get("deal_id");
  let query = supabase
    .from("library_pitches")
    .select("*")
    .order("sent_at", { ascending: false });
  if (dealId) query = query.eq("deal_id", dealId);
  const { data, error } = await query;
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pitches: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const dealId: string | undefined = body?.deal_id;
  const targets: IncomingTarget[] = Array.isArray(body?.targets)
    ? body.targets
    : [];
  if (!dealId || targets.length === 0)
    return NextResponse.json(
      { error: "deal_id and targets[] required" },
      { status: 400 }
    );

  const { data: artist } = await supabase
    .from("artists")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  const rows = targets.map((t) => ({
    deal_id: dealId,
    target_kind: t.target_kind,
    target_ref: t.target_ref,
    target_name: t.target_name,
    target_company: t.target_company ?? null,
    pitch_slug: makeSlug(),
    status: "sent" as const,
    sent_at: new Date().toISOString(),
    last_activity_at: new Date().toISOString(),
    sent_by: artist?.id ?? null,
  }));

  const { data, error } = await supabase
    .from("library_pitches")
    .insert(rows)
    .select();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ pitches: data });
}
