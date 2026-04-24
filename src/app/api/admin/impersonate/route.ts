import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserAccess, IMPERSONATE_COOKIE } from "@/lib/features";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST   /api/admin/impersonate   body: { artist_id }
 * DELETE /api/admin/impersonate
 *
 * Super-admin only. POST sets a session cookie pointing getUserAccess at
 * the target artist (reads flow through, writes are blocked in feature-guard).
 * DELETE clears the cookie. Each action is logged to agent_logs.
 */

const COOKIE_MAX_AGE = 60 * 60 * 2; // 2h — explicit stop expected

export async function POST(request: Request) {
  const access = await getUserAccess();
  if (!access?.is_super_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (access.is_impersonating) {
    // Refuse nested impersonation — stop first, then start a new one.
    return NextResponse.json(
      { error: "Already impersonating. Stop first." },
      { status: 409 },
    );
  }
  const body = await request.json().catch(() => ({}));
  const targetId = body?.artist_id as string | undefined;
  if (!targetId) {
    return NextResponse.json({ error: "artist_id required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: target } = await admin
    .from("artists")
    .select("id, artist_name")
    .eq("id", targetId)
    .maybeSingle();
  if (!target) {
    return NextResponse.json({ error: "Target artist not found" }, { status: 404 });
  }

  const jar = await cookies();
  jar.set({
    name: IMPERSONATE_COOKIE,
    value: target.id,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });

  await admin.from("agent_logs").insert({
    artist_id: target.id,
    agent_type: "admin_action",
    action: "impersonate_start",
    summary: `Admin began impersonating ${target.artist_name ?? target.id}`,
    details: {
      admin_profile_id: access.profile_id,
      target_artist_id: target.id,
    },
  });

  return NextResponse.json({
    ok: true,
    impersonated_artist_id: target.id,
    impersonated_artist_name: target.artist_name ?? null,
  });
}

export async function DELETE() {
  const access = await getUserAccess();
  if (!access?.is_super_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const jar = await cookies();
  const currentTarget = jar.get(IMPERSONATE_COOKIE)?.value ?? null;
  jar.set({
    name: IMPERSONATE_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  if (currentTarget) {
    const admin = createAdminClient();
    await admin.from("agent_logs").insert({
      artist_id: currentTarget,
      agent_type: "admin_action",
      action: "impersonate_stop",
      summary: "Admin stopped impersonating",
      details: {
        admin_profile_id: access.profile_id,
        target_artist_id: currentTarget,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
