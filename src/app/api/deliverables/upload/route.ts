import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// Signed-URL issuer for artifact file uploads attached to a deliverable.
// Stores under artifacts/{artist_id}/{song_id}/{deliverable_id}/{fileName} in the
// existing audio-files bucket (no new bucket provisioning required).
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

  const { deliverableId, fileName } = await request.json();
  if (!deliverableId || !fileName)
    return NextResponse.json(
      { error: "deliverableId and fileName are required" },
      { status: 400 }
    );

  // Verify caller owns this deliverable and fetch its song_id to build the path
  const { data: deliverable } = await supabase
    .from("deliverables")
    .select("id, song_id, artist_id")
    .eq("id", deliverableId)
    .single();
  if (!deliverable || deliverable.artist_id !== artist.id)
    return NextResponse.json({ error: "Deliverable not found" }, { status: 404 });

  const filePath = `artifacts/${artist.id}/${deliverable.song_id ?? "no-song"}/${deliverableId}/${fileName}`;

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
