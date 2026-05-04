import { NextResponse } from "next/server";
import { getUserAccess } from "@/lib/features";

/**
 * GET /api/admin/anthropic-health
 *
 * Super-admin diagnostic. Calls Anthropic with the smallest possible message
 * using the env-var key the production deploy is actually loading. Returns
 * whether the call succeeded plus, on failure, the upstream error message
 * verbatim so we can see exactly what Anthropic rejects.
 *
 * Does not log or echo the API key value itself — only reports the prefix
 * (first 12 chars) so we can compare against the working local key without
 * exposing the secret.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const access = await getUserAccess();
  if (!access?.is_super_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const key = process.env.ANTHROPIC_API_KEY ?? "";
  if (!key) {
    return NextResponse.json({
      ok: false,
      reason: "env_missing",
      key_present: false,
    });
  }

  const start = Date.now();
  let resp: Response | null = null;
  let responseBody: string = "";
  let networkError: string | null = null;
  try {
    resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 5,
        messages: [{ role: "user", content: "hi" }],
      }),
    });
    responseBody = await resp.text();
  } catch (e) {
    networkError = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json({
    ok: resp?.ok ?? false,
    status: resp?.status ?? null,
    duration_ms: Date.now() - start,
    key_present: true,
    key_length: key.length,
    key_prefix: key.slice(0, 12),
    response_body_excerpt: responseBody.slice(0, 600),
    network_error: networkError,
  });
}
