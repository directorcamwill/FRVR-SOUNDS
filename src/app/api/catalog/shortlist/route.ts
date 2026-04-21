import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// Public — create a new shortlist. Slug is the auth (unguessable).
// Supervisors land on /catalog/shortlist/{slug} and can add/remove songs.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const name: string = (body?.name ?? "Untitled Shortlist").slice(0, 120);
  const supervisor_name: string | null = body?.supervisor_name ?? null;
  const supervisor_email: string | null = body?.supervisor_email ?? null;
  const supervisor_company: string | null = body?.supervisor_company ?? null;
  const notes: string | null = body?.notes ?? null;

  const slug =
    "s-" +
    (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2))
      .replace(/-/g, "")
      .slice(0, 22);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("library_shortlists")
    .insert({
      slug,
      name,
      supervisor_name,
      supervisor_email,
      supervisor_company,
      notes,
    })
    .select("*")
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // Best-effort: record the visitor email
  if (supervisor_email) {
    await admin
      .from("library_visitors")
      .upsert(
        {
          email: supervisor_email,
          name: supervisor_name,
          company: supervisor_company,
          role: "supervisor",
        },
        { onConflict: "email" },
      )
      .select();
  }

  return NextResponse.json({ shortlist: data });
}
