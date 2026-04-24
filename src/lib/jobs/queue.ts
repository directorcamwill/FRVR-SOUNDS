import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Jobs queue helpers — the shared surface for the cron worker and any
 * in-app code that wants to enqueue work.
 *
 * All reads and writes use the admin client; RLS is intentionally locked
 * down to service-role for the queue (artists only SELECT their own rows).
 */

export type JobType =
  | "weekly_digest"
  | "daily_outreach_nudge"
  | "release_content_burst";

export type JobStatus = "pending" | "running" | "completed" | "failed";

export interface Job {
  id: string;
  artist_id: string | null;
  job_type: JobType;
  payload: Record<string, unknown>;
  status: JobStatus;
  attempts: number;
  max_attempts: number;
  error_message: string | null;
  run_at: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export async function enqueueJob(opts: {
  jobType: JobType;
  artistId?: string | null;
  payload?: Record<string, unknown>;
  runAt?: Date;
  client?: SupabaseClient;
}): Promise<Job> {
  const admin = opts.client ?? createAdminClient();
  const { data, error } = await admin
    .from("jobs_queue")
    .insert({
      artist_id: opts.artistId ?? null,
      job_type: opts.jobType,
      payload: opts.payload ?? {},
      run_at: (opts.runAt ?? new Date()).toISOString(),
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as Job;
}

export async function claimNextJobs(
  limit: number,
  client?: SupabaseClient,
): Promise<Job[]> {
  const admin = client ?? createAdminClient();
  const nowIso = new Date().toISOString();
  const { data: pending } = await admin
    .from("jobs_queue")
    .select("*")
    .eq("status", "pending")
    .lte("run_at", nowIso)
    .order("run_at", { ascending: true })
    .limit(limit);
  const rows = (pending as Job[] | null) ?? [];
  if (rows.length === 0) return [];

  // Best-effort claim: flip status to 'running' for each. If the same row is
  // already claimed elsewhere we'll see attempts increment without status
  // change and skip it. For MVP (single cron worker) this is sufficient.
  const claimed: Job[] = [];
  for (const job of rows) {
    const { data: updated } = await admin
      .from("jobs_queue")
      .update({
        status: "running",
        started_at: nowIso,
        attempts: (job.attempts ?? 0) + 1,
      })
      .eq("id", job.id)
      .eq("status", "pending")
      .select("*")
      .maybeSingle();
    if (updated) claimed.push(updated as Job);
  }
  return claimed;
}

export async function completeJob(
  jobId: string,
  client?: SupabaseClient,
): Promise<void> {
  const admin = client ?? createAdminClient();
  await admin
    .from("jobs_queue")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      error_message: null,
    })
    .eq("id", jobId);
}

export async function failJob(
  jobId: string,
  error: string,
  client?: SupabaseClient,
): Promise<void> {
  const admin = client ?? createAdminClient();
  const { data: job } = await admin
    .from("jobs_queue")
    .select("attempts, max_attempts")
    .eq("id", jobId)
    .single();

  const attempts = (job as { attempts?: number })?.attempts ?? 0;
  const max = (job as { max_attempts?: number })?.max_attempts ?? 3;
  const willRetry = attempts < max;

  await admin
    .from("jobs_queue")
    .update({
      status: willRetry ? "pending" : "failed",
      error_message: error,
      // Retry with exponential-ish backoff (1, 5, 15 minutes).
      run_at: willRetry
        ? new Date(Date.now() + (attempts * attempts + 1) * 60_000).toISOString()
        : undefined,
      completed_at: willRetry ? null : new Date().toISOString(),
    })
    .eq("id", jobId);
}
