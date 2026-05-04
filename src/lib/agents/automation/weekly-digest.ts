import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, type SendEmailResult } from "@/lib/email/resend";
import { persistFeedbackRun } from "@/lib/feedback/persist-run";

/**
 * Weekly digest — summarizes the last 7 days of activity for an artist and
 * emails it. Deterministic (no LLM). Reads:
 *   - new songs
 *   - new library submissions + accepted deals
 *   - agent runs
 *   - unresolved alerts
 *   - V2 Feedback Loop (shipped pieces, top signal / anti-signal)
 * Pulls the email off profiles.email.
 *
 * As a side effect this also persists a `feedback_runs` row for the artist's
 * current week so /api/feedback-runs/current and the Growth Tracker can
 * surface week-over-week history without recomputing on every read.
 */

export interface DigestResult {
  artistId: string;
  to: string | null;
  send: SendEmailResult | { sent: false; reason: "no_email" };
  summary: DigestSummary;
}

export interface DigestSummary {
  songs_added: number;
  library_submissions: number;
  deals_accepted: number;
  agent_runs: number;
  unresolved_alerts: number;
  window_start: string;
  window_end: string;
  // V2 Feedback Loop — present when content_pieces/feedback_runs are wired.
  pieces_shipped: number;
  top_signal: string | null;
  top_anti_signal: string | null;
}

export async function runWeeklyDigest(artistId: string): Promise<DigestResult> {
  const prepared = await prepareDigestForArtist(artistId);
  if (!prepared.artist) {
    return {
      artistId,
      to: null,
      send: { sent: false, reason: "no_email" },
      summary: prepared.summary,
    };
  }
  if (!prepared.to) {
    return {
      artistId,
      to: null,
      send: { sent: false, reason: "no_email" },
      summary: prepared.summary,
    };
  }

  const send = await sendEmail({
    to: prepared.to,
    subject: prepared.subject,
    html: prepared.html,
    text: prepared.text,
  });

  return { artistId, to: prepared.to, send, summary: prepared.summary };
}

/**
 * Pure renderer used by /api/admin/automation/weekly-digest/preview.
 * Builds the exact HTML + summary `runWeeklyDigest` would send, without
 * actually firing an email. Safe to call from any super-admin surface.
 */
export async function renderDigestForArtist(
  artistId: string,
): Promise<{ html: string; text: string; subject: string; summary: DigestSummary; to: string | null }> {
  const prepared = await prepareDigestForArtist(artistId);
  return {
    html: prepared.html,
    text: prepared.text,
    subject: prepared.subject,
    summary: prepared.summary,
    to: prepared.to,
  };
}

async function prepareDigestForArtist(artistId: string): Promise<{
  artist: { id: string; artist_name: string; profile_id: string } | null;
  to: string | null;
  subject: string;
  html: string;
  text: string;
  summary: DigestSummary;
}> {
  const admin = createAdminClient();
  const windowEnd = new Date();
  const windowStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const startIso = windowStart.toISOString();
  const endIso = windowEnd.toISOString();

  const { data: artist } = await admin
    .from("artists")
    .select("id, artist_name, profile_id")
    .eq("id", artistId)
    .single();
  if (!artist) {
    const empty = emptySummary(startIso, endIso);
    return {
      artist: null,
      to: null,
      subject: "",
      html: renderDigestHtml("there", empty),
      text: renderDigestText("there", empty),
      summary: empty,
    };
  }

  const [
    songsRes,
    submissionsRes,
    dealsRes,
    agentRunsRes,
    alertsRes,
    profileRes,
  ] = await Promise.all([
    admin
      .from("songs")
      .select("id", { count: "exact", head: true })
      .eq("artist_id", artist.id)
      .gte("created_at", startIso),
    admin
      .from("library_submissions")
      .select("id", { count: "exact", head: true })
      .eq("submitter_artist_id", artist.id)
      .gte("created_at", startIso),
    admin
      .from("library_deals")
      .select("id", { count: "exact", head: true })
      .eq("artist_id", artist.id)
      .gte("created_at", startIso),
    admin
      .from("agent_logs")
      .select("id", { count: "exact", head: true })
      .eq("artist_id", artist.id)
      .gte("created_at", startIso),
    admin
      .from("alerts")
      .select("id", { count: "exact", head: true })
      .eq("artist_id", artist.id)
      .eq("dismissed", false),
    admin
      .from("profiles")
      .select("email, artist_name, full_name")
      .eq("id", artist.profile_id)
      .maybeSingle(),
  ]);

  // V2 — persist a feedback_runs row + read the resulting digest aggregates.
  // Best-effort: if migration 00030 hasn't been applied or the artist has no
  // shipped pieces yet, we just skip the V2 fields below.
  let pieces_shipped = 0;
  let top_signal: string | null = null;
  let top_anti_signal: string | null = null;
  try {
    const persisted = await persistFeedbackRun(artist.id, windowEnd);
    if (persisted) {
      pieces_shipped = persisted.digest.pieces_shipped;
      top_signal = persisted.digest.top_signal?.message ?? null;
      top_anti_signal = persisted.digest.top_anti_signal?.message ?? null;
    }
  } catch (e) {
    // Don't fail the whole digest send because of a feedback-run persist error.
    console.error("persistFeedbackRun failed:", e);
  }

  const summary: DigestSummary = {
    songs_added: songsRes.count ?? 0,
    library_submissions: submissionsRes.count ?? 0,
    deals_accepted: dealsRes.count ?? 0,
    agent_runs: agentRunsRes.count ?? 0,
    unresolved_alerts: alertsRes.count ?? 0,
    window_start: startIso,
    window_end: endIso,
    pieces_shipped,
    top_signal,
    top_anti_signal,
  };

  const artistName =
    profileRes.data?.artist_name || artist.artist_name || "there";

  return {
    artist,
    to: profileRes.data?.email ?? null,
    subject: `Your FRVR Sounds week — ${fmtDate(windowEnd)}`,
    html: renderDigestHtml(artistName, summary),
    text: renderDigestText(artistName, summary),
    summary,
  };
}

function emptySummary(startIso: string, endIso: string): DigestSummary {
  return {
    songs_added: 0,
    library_submissions: 0,
    deals_accepted: 0,
    agent_runs: 0,
    unresolved_alerts: 0,
    window_start: startIso,
    window_end: endIso,
    pieces_shipped: 0,
    top_signal: null,
    top_anti_signal: null,
  };
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function renderDigestHtml(artistName: string, s: DigestSummary): string {
  const stat = (label: string, value: number, href?: string) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #222;">
        <span style="color:#a1a1aa;font-size:12px;text-transform:uppercase;letter-spacing:0.2em;">${label}</span>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #222;text-align:right;">
        ${
          href
            ? `<a href="${href}" style="color:#f5f5f5;font-family:ui-monospace,monospace;font-size:16px;text-decoration:none;">${value}</a>`
            : `<span style="color:#f5f5f5;font-family:ui-monospace,monospace;font-size:16px;">${value}</span>`
        }
      </td>
    </tr>`;

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#050505;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#050505;">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="560" style="max-width:560px;width:100%;">
            <tr>
              <td style="padding-bottom:24px;">
                <span style="color:#dc2626;font-family:Georgia,serif;font-weight:700;font-size:18px;">FRVR</span>
                <span style="color:#fff;font-weight:700;font-size:18px;letter-spacing:0.1em;"> SOUNDS</span>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:16px;">
                <h1 style="color:#fff;font-size:24px;font-weight:600;margin:0;line-height:1.3;">Your week in review, ${escapeHtml(artistName)}.</h1>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:24px;">
                <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0;">Here's what moved in your FRVR Sounds workspace.</p>
              </td>
            </tr>
            <tr><td>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid #222;">
                ${stat("Pieces shipped", s.pieces_shipped)}
                ${stat("Songs added", s.songs_added)}
                ${stat("Library submissions", s.library_submissions)}
                ${stat("Deals accepted", s.deals_accepted)}
                ${stat("Agent runs", s.agent_runs)}
                ${stat("Open alerts", s.unresolved_alerts)}
              </table>
            </td></tr>
            ${
              s.top_signal || s.top_anti_signal
                ? `<tr><td style="padding-top:24px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr><td style="padding-bottom:8px;"><span style="color:#a1a1aa;font-size:12px;text-transform:uppercase;letter-spacing:0.2em;">Feedback Loop</span></td></tr>
                      ${
                        s.top_signal
                          ? `<tr><td style="padding:10px 12px;background:#0a1410;border-left:3px solid #10b981;color:#d4d4d8;font-size:13px;line-height:1.5;">
                              <span style="color:#10b981;font-size:11px;text-transform:uppercase;letter-spacing:0.15em;">Top signal</span><br />
                              ${escapeHtml(s.top_signal)}
                            </td></tr>`
                          : ""
                      }
                      ${
                        s.top_anti_signal
                          ? `<tr><td style="padding:10px 12px;background:#140a0a;border-left:3px solid #dc2626;color:#d4d4d8;font-size:13px;line-height:1.5;margin-top:8px;">
                              <span style="color:#dc2626;font-size:11px;text-transform:uppercase;letter-spacing:0.15em;">Anti-signal</span><br />
                              ${escapeHtml(s.top_anti_signal)}
                            </td></tr>`
                          : ""
                      }
                    </table>
                  </td></tr>`
                : ""
            }
            <tr>
              <td style="padding-top:32px;">
                <a href="https://frvr-sounds.vercel.app/command-center" style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:600;">Open Command Center</a>
              </td>
            </tr>
            <tr>
              <td style="padding-top:40px;color:#52525b;font-size:11px;">
                You're getting this because weekly digest is enabled in your FRVR Sounds workspace.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function renderDigestText(artistName: string, s: DigestSummary): string {
  const lines = [
    `Your week in review, ${artistName}.`,
    "",
    `Pieces shipped: ${s.pieces_shipped}`,
    `Songs added: ${s.songs_added}`,
    `Library submissions: ${s.library_submissions}`,
    `Deals accepted: ${s.deals_accepted}`,
    `Agent runs: ${s.agent_runs}`,
    `Open alerts: ${s.unresolved_alerts}`,
  ];
  if (s.top_signal) {
    lines.push("", `Top signal: ${s.top_signal}`);
  }
  if (s.top_anti_signal) {
    lines.push(`Anti-signal: ${s.top_anti_signal}`);
  }
  lines.push("", "Open Command Center: https://frvr-sounds.vercel.app/command-center");
  return lines.join("\n");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
