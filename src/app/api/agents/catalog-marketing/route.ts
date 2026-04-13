import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { runCatalogMarketing } from "@/lib/agents/catalog-marketing";

export async function POST() {
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

  try {
    const result = await runCatalogMarketing(artist.id);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Catalog marketing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
