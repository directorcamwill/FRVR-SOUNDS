import { NextResponse } from "next/server";
import { getUserAccess } from "@/lib/features";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderDigestForArtist } from "@/lib/agents/automation/weekly-digest";

/**
 * GET /api/admin/automation/weekly-digest/preview?artist_id=...
 *
 * Super-admin preview: renders the digest HTML for any artist and returns
 * it as text/html so the operator can drop it into the browser and inspect
 * exactly what the email will look like. Does NOT send anything.
 */

export const runtime = "nodejs";

export async function GET(request: Request) {
  const access = await getUserAccess();
  if (!access?.is_super_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  let artistId = url.searchParams.get("artist_id");
  if (!artistId) {
    // Fall back to the caller's own artist.
    artistId = access.artist_id;
  }
  if (!artistId) {
    return NextResponse.json(
      { error: "artist_id required (no artist on caller)" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data: artist } = await admin
    .from("artists")
    .select("id")
    .eq("id", artistId)
    .maybeSingle();
  if (!artist) {
    return NextResponse.json({ error: "artist_not_found" }, { status: 404 });
  }

  const { html, summary } = await renderDigestForArtist(artistId);
  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Digest-Summary": JSON.stringify(summary),
    },
  });
}
