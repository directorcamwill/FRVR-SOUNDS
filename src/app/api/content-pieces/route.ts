import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/**
 * /api/content-pieces — CRUD for an artist's drafts/posts.
 *
 * GET    → list pieces for the signed-in artist (ordered newest first).
 *          Query: ?limit=N (default 20), ?status=draft|revise|ship_ready|anchor|shipped|archived
 * POST   → create a new piece. Body: { platform, hook, body, cta, pillar_id?, format_id? }
 * PUT    → update an existing piece. Body: { id, ...patch }
 *
 * Backed by migration 00030 (content_pieces table).
 */

const VALID_STATUSES = [
  "draft",
  "revise",
  "ship_ready",
  "anchor",
  "shipped",
  "archived",
] as const;

export async function GET(request: Request) {
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
  if (!artist)
    return NextResponse.json({ error: "No artist profile" }, { status: 404 });

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 20) || 20, 100);
  const status = url.searchParams.get("status");

  let q = supabase
    .from("content_pieces")
    .select("*")
    .eq("artist_id", artist.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status && VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    q = q.eq("fit_status", status);
  }

  const { data, error } = await q;
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ pieces: data ?? [] });
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
  if (!artist)
    return NextResponse.json({ error: "No artist profile" }, { status: 404 });

  const body = await request.json();
  const insert = {
    artist_id: artist.id,
    platform: typeof body.platform === "string" ? body.platform : null,
    hook: typeof body.hook === "string" ? body.hook : null,
    body: typeof body.body === "string" ? body.body : null,
    cta: typeof body.cta === "string" ? body.cta : null,
    pillar_id: typeof body.pillar_id === "string" ? body.pillar_id : null,
    format_id: typeof body.format_id === "string" ? body.format_id : null,
    fit_status: "draft" as const,
  };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("content_pieces")
    .insert(insert)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ piece: data });
}

export async function PUT(request: Request) {
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
  if (!artist)
    return NextResponse.json({ error: "No artist profile" }, { status: 404 });

  const body = await request.json();
  const id = typeof body.id === "string" ? body.id : null;
  if (!id)
    return NextResponse.json({ error: "id is required" }, { status: 400 });

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of [
    "platform",
    "hook",
    "body",
    "cta",
    "pillar_id",
    "format_id",
    "fit_status",
    "scheduled_for",
    "shipped_at",
    "external_url",
    "performance",
  ]) {
    if (key in body) patch[key] = body[key];
  }

  if (
    typeof patch.fit_status === "string" &&
    !VALID_STATUSES.includes(patch.fit_status as (typeof VALID_STATUSES)[number])
  ) {
    return NextResponse.json(
      { error: `Invalid fit_status. Must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("content_pieces")
    .update(patch)
    .eq("id", id)
    .eq("artist_id", artist.id)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // When the piece transitions to "shipped", auto-log a streak_log entry for
  // today. Idempotent on (artist_id, log_date). If streak_log isn't migrated
  // yet, fail soft — the ship still succeeds.
  if (patch.fit_status === "shipped") {
    const today = new Date().toISOString().slice(0, 10);
    await admin
      .from("streak_log")
      .upsert(
        {
          artist_id: artist.id,
          log_date: today,
          mvp_met: true,
          pieces_shipped: 1,
        },
        { onConflict: "artist_id,log_date" },
      )
      .then((r) => {
        if (r.error && !/relation .* does not exist|schema cache/i.test(r.error.message)) {
          // Real error — log but don't fail the ship
          console.error("streak_log auto-write failed:", r.error.message);
        }
      });
  }

  return NextResponse.json({ piece: data });
}
