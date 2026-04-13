import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  const { submissionId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { data: submission, error } = await supabase
    .from("submissions")
    .update(body)
    .eq("id", submissionId)
    .select(
      `
      *,
      opportunity:opportunities(id, title, company, stage),
      song:songs(id, title)
    `
    )
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(submission);
}
