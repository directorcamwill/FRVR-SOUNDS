import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// Public — capture a visitor's email when they unlock full-track playback
// on the catalog. Upserts into library_visitors so the operator can see
// who's browsing + follow up. Sets a cookie so the session doesn't re-prompt.

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email: string | undefined = (body?.email ?? "").trim().toLowerCase();
  const name: string | null = body?.name ?? null;
  const company: string | null = body?.company ?? null;
  const role: string | null = body?.role ?? "supervisor";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });

  const admin = createAdminClient();

  // Fetch existing (to bump session_count on repeat visits)
  const { data: existing } = await admin
    .from("library_visitors")
    .select("id, session_count")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    await admin
      .from("library_visitors")
      .update({
        last_seen_at: new Date().toISOString(),
        session_count: (existing.session_count ?? 0) + 1,
        name: name ?? undefined,
        company: company ?? undefined,
        role: role ?? undefined,
      })
      .eq("id", existing.id);
  } else {
    await admin.from("library_visitors").insert({
      email,
      name,
      company,
      role,
    });
  }

  const res = NextResponse.json({ ok: true });
  // 30-day visitor cookie — session-scoped unlock
  res.cookies.set("frvr.visitor", email, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
