import { createAdminClient } from "@/lib/supabase/admin";
import {
  enqueueJob,
  claimNextJobs,
  completeJob,
  failJob,
  type Job,
  type JobType,
} from "@/lib/jobs/queue";
import { runWeeklyDigest } from "./weekly-digest";

/**
 * Automation dispatcher — two-phase tick:
 *   1. SCHEDULE: walk `automation_schedules` where enabled + due, enqueue
 *      jobs into `jobs_queue`, stamp last_run_at + next_run_at.
 *   2. RUN: claim up to N pending jobs and execute them.
 *
 * The cron endpoint calls `runAutomationTick()` once per invocation. Retries
 * are handled by the queue (failJob requeues with backoff up to max_attempts).
 */

export interface TickResult {
  scheduled: number;       // new jobs enqueued this tick
  attempted: number;       // jobs the worker picked up
  completed: number;
  failed: number;
  details: TickJobDetail[];
}

export interface TickJobDetail {
  job_id: string;
  job_type: JobType;
  artist_id: string | null;
  status: "completed" | "failed";
  error?: string;
}

const SCHEDULE_INTERVALS: Record<JobType, number> = {
  weekly_digest: 7 * 24 * 60 * 60 * 1000,
  daily_outreach_nudge: 24 * 60 * 60 * 1000,
  release_content_burst: 30 * 24 * 60 * 60 * 1000, // effectively per-release, guarded below
};

export async function runAutomationTick(maxJobs = 10): Promise<TickResult> {
  const scheduled = await scheduleDueJobs();
  const { attempted, completed, failed, details } = await runPendingJobs(maxJobs);
  return { scheduled, attempted, completed, failed, details };
}

async function scheduleDueJobs(): Promise<number> {
  const admin = createAdminClient();
  const now = new Date();

  const { data: schedules } = await admin
    .from("automation_schedules")
    .select("id, artist_id, schedule_type, last_run_at, next_run_at, config")
    .eq("enabled", true);

  const rows = (schedules ?? []) as Array<{
    id: string;
    artist_id: string;
    schedule_type: JobType;
    last_run_at: string | null;
    next_run_at: string | null;
    config: Record<string, unknown>;
  }>;
  if (rows.length === 0) return 0;

  let enqueued = 0;
  for (const s of rows) {
    const interval = SCHEDULE_INTERVALS[s.schedule_type];
    const dueAt = s.next_run_at
      ? new Date(s.next_run_at)
      : s.last_run_at
        ? new Date(new Date(s.last_run_at).getTime() + interval)
        : now;

    if (dueAt.getTime() > now.getTime()) continue;

    // Skip if a pending/running job of the same type already exists for this artist.
    const { data: existing } = await admin
      .from("jobs_queue")
      .select("id")
      .eq("artist_id", s.artist_id)
      .eq("job_type", s.schedule_type)
      .in("status", ["pending", "running"])
      .limit(1);
    if (existing && existing.length > 0) continue;

    await enqueueJob({
      jobType: s.schedule_type,
      artistId: s.artist_id,
      payload: { schedule_id: s.id, config: s.config },
    });
    await admin
      .from("automation_schedules")
      .update({
        last_run_at: now.toISOString(),
        next_run_at: new Date(now.getTime() + interval).toISOString(),
      })
      .eq("id", s.id);
    enqueued++;
  }
  return enqueued;
}

async function runPendingJobs(max: number): Promise<{
  attempted: number;
  completed: number;
  failed: number;
  details: TickJobDetail[];
}> {
  const jobs = await claimNextJobs(max);
  const details: TickJobDetail[] = [];
  let completed = 0;
  let failed = 0;

  for (const job of jobs) {
    try {
      await executeJob(job);
      await completeJob(job.id);
      completed++;
      details.push({
        job_id: job.id,
        job_type: job.job_type,
        artist_id: job.artist_id,
        status: "completed",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      await failJob(job.id, message);
      failed++;
      details.push({
        job_id: job.id,
        job_type: job.job_type,
        artist_id: job.artist_id,
        status: "failed",
        error: message,
      });
    }
  }

  return { attempted: jobs.length, completed, failed, details };
}

async function executeJob(job: Job): Promise<void> {
  switch (job.job_type) {
    case "weekly_digest": {
      if (!job.artist_id) throw new Error("weekly_digest job missing artist_id");
      await runWeeklyDigest(job.artist_id);
      return;
    }
    case "daily_outreach_nudge":
    case "release_content_burst":
      // Placeholders — ship the worker now, wire these handlers when the
      // outreach / release-burst features land. Completing as no-op prevents
      // the queue from retrying forever.
      return;
    default: {
      const exhaustive: never = job.job_type;
      throw new Error(`Unknown job type: ${exhaustive as string}`);
    }
  }
}
