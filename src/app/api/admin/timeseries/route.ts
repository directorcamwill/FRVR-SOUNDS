import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserAccess } from "@/lib/features";

// Daily buckets for the last N days across signups, songs, agent runs,
// alerts. Used by the Trends tab. Deterministic and cheap — no LLM.

const DEFAULT_DAYS = 30;

function dayBucket(iso: string): string {
  return iso.slice(0, 10); // YYYY-MM-DD
}

function fillSeries(
  days: number,
  counts: Map<string, number>
): Array<{ date: string; count: number }> {
  const out: Array<{ date: string; count: number }> = [];
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    out.push({ date: key, count: counts.get(key) ?? 0 });
  }
  return out;
}

export async function GET(request: Request) {
  const access = await getUserAccess();
  if (!access?.is_super_admin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(request.url);
  const days = Math.min(
    Math.max(parseInt(url.searchParams.get("days") ?? "", 10) || DEFAULT_DAYS, 7),
    180
  );
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));
  const sinceIso = since.toISOString();

  const admin = createAdminClient();
  const [signups, songs, agentLogs, alerts, submissions] = await Promise.all([
    admin
      .from("artists")
      .select("created_at")
      .gte("created_at", sinceIso),
    admin
      .from("songs")
      .select("created_at")
      .gte("created_at", sinceIso),
    admin
      .from("agent_logs")
      .select("created_at")
      .gte("created_at", sinceIso),
    admin
      .from("alerts")
      .select("created_at")
      .gte("created_at", sinceIso),
    admin
      .from("library_submissions")
      .select("submitted_at")
      .gte("submitted_at", sinceIso),
  ]);

  const toSeries = (
    rows: Array<{ created_at?: string | null; submitted_at?: string | null }> | null
  ) => {
    const m = new Map<string, number>();
    for (const r of rows ?? []) {
      const ts = r.created_at ?? r.submitted_at;
      if (!ts) continue;
      const k = dayBucket(ts);
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return fillSeries(days, m);
  };

  return NextResponse.json({
    days,
    signups: toSeries(signups.data),
    songs: toSeries(songs.data),
    agent_calls: toSeries(agentLogs.data),
    alerts: toSeries(alerts.data),
    library_submissions: toSeries(submissions.data),
  });
}
