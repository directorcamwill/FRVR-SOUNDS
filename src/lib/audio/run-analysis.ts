import type { SupabaseClient } from "@supabase/supabase-js";
import { analyzeAudio, ANALYZER_VERSION } from "./analyzer";

interface RunOptions {
  admin: SupabaseClient;
  filePath: string;
  dealId?: string | null;
  submissionId?: string | null;
  force?: boolean;
}

export interface RunResult {
  ok: boolean;
  skipped?: "already_analyzed" | "no_file";
  error?: string;
  analyzer_version?: string;
  duration_sec?: number | null;
  lufs_integrated?: number | null;
  true_peak_db?: number | null;
}

export async function runAudioAnalysis({
  admin,
  filePath,
  dealId = null,
  submissionId = null,
  force = false,
}: RunOptions): Promise<RunResult> {
  if (!filePath) return { ok: false, skipped: "no_file" };

  if (!force && (dealId || submissionId)) {
    const q = admin.from("audio_analysis").select("id").limit(1);
    const { data } = dealId
      ? await q.eq("deal_id", dealId)
      : await q.eq("submission_id", submissionId!);
    if (data && data.length > 0) return { ok: true, skipped: "already_analyzed" };
  }

  const { data: dl, error: dlErr } = await admin.storage
    .from("audio-files")
    .download(filePath);
  if (dlErr || !dl) return { ok: false, error: dlErr?.message ?? "download_failed" };

  const buf = Buffer.from(await dl.arrayBuffer());
  const ext = filePath.split(".").pop() ?? "mp3";

  const result = await analyzeAudio(buf, ext);

  const { error: insertErr } = await admin.from("audio_analysis").insert({
    deal_id: dealId,
    submission_id: submissionId,
    file_path: filePath,
    duration_sec: result.duration_sec,
    lufs_integrated: result.lufs_integrated,
    lufs_short_term_max: result.lufs_short_term_max,
    true_peak_db: result.true_peak_db,
    dynamic_range: result.dynamic_range,
    waveform_peaks: result.waveform_peaks,
    detected_bpm: result.detected_bpm,
    detected_bpm_confidence: result.detected_bpm_confidence,
    detected_key: result.detected_key,
    detected_key_confidence: result.detected_key_confidence,
    analyzer_version: ANALYZER_VERSION,
  });
  if (insertErr) return { ok: false, error: insertErr.message };

  return {
    ok: true,
    analyzer_version: ANALYZER_VERSION,
    duration_sec: result.duration_sec,
    lufs_integrated: result.lufs_integrated,
    true_peak_db: result.true_peak_db,
  };
}
