import { NextResponse } from "next/server";
import { runAutomationTick } from "@/lib/agents/automation";

/**
 * Cron entry point — runs one automation tick.
 *
 * Auth: requires `Authorization: Bearer <CRON_SECRET>` header. Vercel Cron
 * sends the same secret automatically (from `vercel.json`). Manual calls
 * from the admin console pass it explicitly.
 *
 * Runtime: nodejs (scheduled cron can't use edge); maxDuration 60s.
 */

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runAutomationTick();
    return NextResponse.json({ ok: true, ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Tick failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

// Vercel Cron triggers via GET; accept it too.
export async function GET(request: Request) {
  return POST(request);
}
