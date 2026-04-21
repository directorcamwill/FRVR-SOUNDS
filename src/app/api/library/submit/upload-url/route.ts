import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// Public endpoint — no auth. Generates a signed upload URL scoped to the
// library-submissions folder so external artists can upload audio without
// an account. The admin client bypasses RLS for storage ops.

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const fileName: string | undefined = body?.fileName;
  const submissionId: string | undefined = body?.submissionId;
  if (!fileName || !submissionId)
    return NextResponse.json(
      { error: "fileName and submissionId required" },
      { status: 400 }
    );

  // Basic sanitization — prevent path traversal
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  const safeId = submissionId.replace(/[^a-fA-F0-9-]/g, "").slice(0, 36);
  if (!safeId)
    return NextResponse.json({ error: "Invalid submissionId" }, { status: 400 });

  const filePath = `submissions/${safeId}/${safeName}`;

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
