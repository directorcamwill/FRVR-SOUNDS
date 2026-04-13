import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { runMarketIntel } from "@/lib/agents/market-intel";

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
    const result = await runMarketIntel(artist.id);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Market intel failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
