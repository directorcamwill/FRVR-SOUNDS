import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // Auth check with user client
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

  const { songId, fileName } = await request.json();
  const filePath = `${artist.id}/${songId}/${fileName}`;

  // Use admin client for storage operations (bypasses RLS)
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from("audio-files")
    .createSignedUploadUrl(filePath);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    signedUrl: data.signedUrl,
    path: filePath,
    token: data.token,
  });
}
