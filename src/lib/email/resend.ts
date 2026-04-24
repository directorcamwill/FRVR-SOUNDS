/**
 * Resend email wrapper with graceful no-op fallback.
 *
 * When `RESEND_API_KEY` is unset (local dev, early setup), `sendEmail`
 * returns `{ sent: false, reason: 'no_key' }` instead of throwing — callers
 * can log the would-be email and keep going. Prod builds MUST set the key
 * (we don't want silent failures in production; see `isSendConfigured`).
 */

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export type SendEmailResult =
  | { sent: true; messageId: string }
  | { sent: false; reason: "no_key" | "send_failed"; detail?: string };

const DEFAULT_FROM =
  process.env.RESEND_FROM_ADDRESS || "FRVR Sounds <noreply@frvrsounds.com>";

export function isSendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // In dev / pre-setup, log the would-be email so we can still test the
    // builder shape without sending.
    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[email:no_key] would send → ${input.to} · subject: ${input.subject}`,
      );
    }
    return { sent: false, reason: "no_key" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: input.from ?? DEFAULT_FROM,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        reply_to: input.replyTo,
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return { sent: false, reason: "send_failed", detail: detail.slice(0, 500) };
    }
    const body = (await res.json().catch(() => ({}))) as { id?: string };
    return { sent: true, messageId: body.id ?? "" };
  } catch (err: unknown) {
    return {
      sent: false,
      reason: "send_failed",
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}
