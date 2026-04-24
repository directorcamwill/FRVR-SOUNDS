import { NextResponse } from "next/server";
import { getUserAccess } from "@/lib/features";
import { runAutomationTick } from "@/lib/agents/automation";

/**
 * POST /api/admin/automation/tick
 *
 * Super-admin-only manual trigger for the automation tick. Same worker the
 * daily Vercel Cron hits, just fired on-demand so operators can verify new
 * schedules without waiting for 09:00 UTC.
 */

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST() {
  const access = await getUserAccess();
  if (!access?.is_super_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const result = await runAutomationTick();
    return NextResponse.json({ ok: true, ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Tick failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
