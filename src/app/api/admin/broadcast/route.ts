import { NextResponse } from "next/server";
import { getUserAccess } from "@/lib/features";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, isSendConfigured } from "@/lib/email/resend";
import { PLANS, type PlanId } from "@/lib/plans";

/**
 * POST /api/admin/broadcast
 *
 * Body: {
 *   subject: string
 *   body: string              -- plain text; rendered as <p> blocks in HTML
 *   target_plan_ids?: PlanId[] -- omit or empty = all paying plans (excludes "internal")
 *   dry_run?: boolean          -- return recipient count without sending
 * }
 *
 * Super-admin only. Throttled: max 1000 recipients per call. Logs the
 * broadcast to agent_logs (agent_type="admin_broadcast") with counts.
 */

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_RECIPIENTS = 1000;

export async function POST(request: Request) {
  const access = await getUserAccess();
  if (!access?.is_super_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    subject?: string;
    body?: string;
    target_plan_ids?: PlanId[];
    dry_run?: boolean;
  };
  const subject = String(body.subject ?? "").trim();
  const text = String(body.body ?? "").trim();
  if (!subject || !text) {
    return NextResponse.json(
      { error: "subject and body are required" },
      { status: 400 },
    );
  }

  const validPlans = new Set(Object.keys(PLANS));
  const targets = (body.target_plan_ids ?? []).filter((p) => validPlans.has(p));
  const dryRun = Boolean(body.dry_run);

  const admin = createAdminClient();

  // Join subscriptions → artists → profiles to get emails. Exclude internal
  // (Cameron's seeded comp plan) so test broadcasts don't bounce back.
  const subsQuery = admin
    .from("subscriptions")
    .select("artist_id, plan_id, status")
    .neq("plan_id", "internal")
    .neq("status", "canceled");
  const { data: subs } = targets.length > 0
    ? await subsQuery.in("plan_id", targets)
    : await subsQuery;

  const artistIds = (subs ?? []).map((s) => s.artist_id);
  if (artistIds.length === 0) {
    return NextResponse.json({ ok: true, recipients: 0, sent: 0, failed: 0 });
  }
  if (artistIds.length > MAX_RECIPIENTS) {
    return NextResponse.json(
      {
        error: `Recipient count ${artistIds.length} exceeds MAX_RECIPIENTS (${MAX_RECIPIENTS}). Narrow target_plan_ids.`,
      },
      { status: 400 },
    );
  }

  const { data: artistsRows } = await admin
    .from("artists")
    .select("id, profile_id")
    .in("id", artistIds);
  const profileIds = (artistsRows ?? [])
    .map((r) => r.profile_id)
    .filter((x): x is string => Boolean(x));

  const { data: profilesRows } = await admin
    .from("profiles")
    .select("id, email, artist_name, full_name")
    .in("id", profileIds);
  const recipients = (profilesRows ?? [])
    .map((p) => ({
      email: p.email as string | null,
      name: (p.artist_name as string | null) ?? (p.full_name as string | null) ?? "",
    }))
    .filter((r): r is { email: string; name: string } => !!r.email);

  if (dryRun || !isSendConfigured()) {
    return NextResponse.json({
      ok: true,
      recipients: recipients.length,
      dry_run: dryRun || !isSendConfigured(),
      reason: !isSendConfigured() ? "RESEND_API_KEY not set" : undefined,
    });
  }

  let sent = 0;
  let failed = 0;
  for (const r of recipients) {
    const result = await sendEmail({
      to: r.email,
      subject,
      html: renderBroadcastHtml(r.name || "there", text),
      text,
    });
    if (result.sent) sent++;
    else failed++;
  }

  await admin.from("agent_logs").insert({
    artist_id: null,
    agent_type: "admin_broadcast",
    action: "send",
    summary: `Broadcast "${subject.slice(0, 60)}" · ${sent}/${recipients.length} sent${failed ? ` · ${failed} failed` : ""}`,
    details: {
      subject,
      target_plan_ids: targets,
      recipients: recipients.length,
      sent,
      failed,
      admin_profile_id: access.profile_id,
    },
  });

  return NextResponse.json({
    ok: true,
    recipients: recipients.length,
    sent,
    failed,
  });
}

function renderBroadcastHtml(name: string, bodyText: string): string {
  const paragraphs = bodyText
    .split(/\n\s*\n+/)
    .map((p) => `<p style="margin:0 0 16px 0;color:#d4d4d8;font-size:14px;line-height:1.6;">${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`)
    .join("\n");
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#050505;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#050505;">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="560" style="max-width:560px;width:100%;">
            <tr><td style="padding-bottom:24px;">
              <span style="color:#dc2626;font-family:Georgia,serif;font-weight:700;font-size:18px;">FRVR</span>
              <span style="color:#fff;font-weight:700;font-size:18px;letter-spacing:0.1em;"> SOUNDS</span>
            </td></tr>
            <tr><td style="padding-bottom:16px;">
              <p style="margin:0;color:#fff;font-size:16px;">Hey ${escapeHtml(name)},</p>
            </td></tr>
            <tr><td>${paragraphs}</td></tr>
            <tr><td style="padding-top:40px;color:#52525b;font-size:11px;">
              FRVR Sounds · <a href="https://frvr-sounds.vercel.app/settings" style="color:#71717a;">Unsubscribe / settings</a>
            </td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
