import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
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

  const { data: accounts, error } = await supabase
    .from("external_accounts")
    .select("*")
    .eq("artist_id", artist.id)
    .order("category")
    .order("platform");

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(accounts);
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
  const { data: account, error } = await supabase
    .from("external_accounts")
    .insert({
      artist_id: artist.id,
      platform: body.platform,
      category: body.category,
      account_email: body.account_email || null,
      account_id: body.account_id || null,
      account_url: body.account_url || null,
      status: body.status || "active",
      notes: body.notes || null,
    })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(account);
}
