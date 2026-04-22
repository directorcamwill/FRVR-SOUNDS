import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runAudioAnalysis } from "@/lib/audio/run-analysis";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

interface Body {
  deal_id?: string;
  submission_id?: string;
  file_path?: string;
  force?: boolean;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Body;
  if (!body.deal_id && !body.submission_id) {
    return NextResponse.json(
      { error: "deal_id or submission_id required" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  let filePath = body.file_path ?? null;
  if (!filePath) {
    if (body.deal_id) {
      const { data } = await admin
        .from("library_deals")
        .select("song_file_path")
        .eq("id", body.deal_id)
        .single();
      filePath = data?.song_file_path ?? null;
    } else if (body.submission_id) {
      const { data } = await admin
        .from("library_submissions")
        .select("song_file_path")
        .eq("id", body.submission_id)
        .single();
      filePath = data?.song_file_path ?? null;
    }
  }

  if (!filePath) {
    return NextResponse.json({ error: "No file to analyze" }, { status: 404 });
  }

  try {
    const result = await runAudioAnalysis({
      admin,
      filePath,
      dealId: body.deal_id ?? null,
      submissionId: body.submission_id ?? null,
      force: !!body.force,
    });
    if (!result.ok) {
      return NextResponse.json(result, { status: 502 });
    }
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
