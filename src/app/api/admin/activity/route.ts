import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserAccess } from "@/lib/features";

// Unified activity stream across all accounts — recent signups, song adds,
// agent completions, alerts, library submissions, announcement broadcasts,
// subscription changes. Merged, sorted by time.

const WINDOW_HOURS = 72;

interface ActivityRow {
  id: string;
  kind:
    | "signup"
    | "song_added"
    | "agent_run"
    | "alert"
    | "library_submission"
    | "announcement"
    | "subscription_change";
  at: string;
  artist_id?: string | null;
  artist_name?: string | null;
  title: string;
  detail?: string | null;
  href?: string | null;
  severity?: "info" | "warning" | "error";
}

export async function GET(request: Request) {
  const access = await getUserAccess();
  if (!access?.is_super_admin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(request.url);
  const limit = Math.min(
    Math.max(parseInt(url.searchParams.get("limit") ?? "", 10) || 50, 10),
    200
  );
  const hours = Math.min(
    Math.max(parseInt(url.searchParams.get("hours") ?? "", 10) || WINDOW_HOURS, 1),
    720
  );

  const since = new Date();
  since.setHours(since.getHours() - hours);
  const sinceIso = since.toISOString();

  const admin = createAdminClient();
  const [
    { data: signups },
    { data: songs },
    { data: agentLogs },
    { data: alerts },
    { data: submissions },
    { data: announcements },
    { data: subs },
  ] = await Promise.all([
    admin
      .from("artists")
      .select("id, artist_name, created_at")
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false })
      .limit(limit),
    admin
      .from("songs")
      .select("id, title, artist_id, created_at")
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false })
      .limit(limit),
    admin
      .from("agent_logs")
      .select("id, artist_id, agent_type, summary, created_at")
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false })
      .limit(limit),
    admin
      .from("alerts")
      .select("id, artist_id, severity, title, message, created_at")
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false })
      .limit(limit),
    admin
      .from("library_submissions")
      .select("id, song_title, artist_name, submitted_at")
      .gte("submitted_at", sinceIso)
      .order("submitted_at", { ascending: false })
      .limit(limit),
    admin
      .from("announcements")
      .select("id, title, severity, created_at")
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false })
      .limit(limit),
    admin
      .from("subscriptions")
      .select("id, plan_id, status, updated_at, artist_id")
      .gte("updated_at", sinceIso)
      .order("updated_at", { ascending: false })
      .limit(limit),
  ]);

  // Map artist_id → artist_name for enrichment
  const artistIds = new Set<string>();
  for (const rows of [songs, agentLogs, alerts, subs]) {
    for (const r of rows ?? []) {
      if (r.artist_id) artistIds.add(r.artist_id);
    }
  }
  const { data: artistRows } = await admin
    .from("artists")
    .select("id, artist_name")
    .in("id", Array.from(artistIds));
  const nameById = new Map<string, string>();
  for (const a of artistRows ?? []) nameById.set(a.id, a.artist_name);

  const rows: ActivityRow[] = [];

  for (const a of signups ?? []) {
    rows.push({
      id: `signup:${a.id}`,
      kind: "signup",
      at: a.created_at,
      artist_id: a.id,
      artist_name: a.artist_name,
      title: `New signup — ${a.artist_name}`,
      severity: "info",
    });
  }
  for (const s of songs ?? []) {
    rows.push({
      id: `song:${s.id}`,
      kind: "song_added",
      at: s.created_at,
      artist_id: s.artist_id,
      artist_name: nameById.get(s.artist_id) ?? null,
      title: `Song added — ${s.title}`,
      detail: nameById.get(s.artist_id),
      href: `/vault/${s.id}`,
    });
  }
  for (const l of agentLogs ?? []) {
    rows.push({
      id: `agent:${l.id}`,
      kind: "agent_run",
      at: l.created_at,
      artist_id: l.artist_id,
      artist_name: nameById.get(l.artist_id) ?? null,
      title: `${l.agent_type} — ${l.summary ?? "agent run"}`,
      detail: nameById.get(l.artist_id),
    });
  }
  for (const a of alerts ?? []) {
    rows.push({
      id: `alert:${a.id}`,
      kind: "alert",
      at: a.created_at,
      artist_id: a.artist_id,
      artist_name: nameById.get(a.artist_id) ?? null,
      title: a.title,
      detail: a.message,
      severity:
        a.severity === "warning" || a.severity === "error"
          ? (a.severity as "warning" | "error")
          : "info",
    });
  }
  for (const s of submissions ?? []) {
    rows.push({
      id: `submit:${s.id}`,
      kind: "library_submission",
      at: s.submitted_at,
      title: `Library submission — ${s.song_title}`,
      detail: s.artist_name,
      href: `/library`,
    });
  }
  for (const a of announcements ?? []) {
    rows.push({
      id: `announce:${a.id}`,
      kind: "announcement",
      at: a.created_at,
      title: `Broadcast sent — ${a.title}`,
      detail: `Severity: ${a.severity}`,
      href: `/admin`,
    });
  }
  for (const s of subs ?? []) {
    rows.push({
      id: `sub:${s.id}:${s.updated_at}`,
      kind: "subscription_change",
      at: s.updated_at,
      artist_id: s.artist_id,
      artist_name: nameById.get(s.artist_id) ?? null,
      title: `Subscription ${s.status} — ${s.plan_id}`,
      detail: nameById.get(s.artist_id),
    });
  }

  rows.sort((a, b) => (a.at < b.at ? 1 : -1));
  return NextResponse.json({ activity: rows.slice(0, limit), window_hours: hours });
}
