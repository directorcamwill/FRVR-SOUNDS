import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * /api/review-queue — agent-sourced alerts that need human review.
 * Per EVOLUTION_PLAN §1.4 #7: reuse the `alerts` table (no new schema).
 *
 * Filter criteria:
 *   - not yet dismissed or read
 *   - severity is 'urgent' or 'warning'
 *   - agent_type is populated (so we know it came from an AI agent)
 *
 * This is the first consumer of the low-confidence alerts emitted by the
 * sync-brief agent (P2). As more agents adopt the confidence contract,
 * they'll feed the same queue without schema changes.
 */

export interface ReviewQueueItem {
  id: string;
  title: string;
  message: string | null;
  severity: "urgent" | "warning";
  agent_type: string | null;
  action_url: string | null;
  created_at: string;
}

export interface ReviewQueueResponse {
  items: ReviewQueueItem[];
  count: number;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: artist } = await supabase
    .from("artists")
    .select("id")
    .eq("profile_id", user.id)
    .single();
  if (!artist)
    return NextResponse.json({ error: "No artist profile" }, { status: 404 });

  const { data, error } = await supabase
    .from("alerts")
    .select(
      "id, title, message, severity, agent_type, action_url, created_at"
    )
    .eq("artist_id", artist.id)
    .eq("dismissed", false)
    .eq("read", false)
    .in("severity", ["urgent", "warning"])
    .not("agent_type", "is", null)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  const items = (data ?? []) as ReviewQueueItem[];
  const body: ReviewQueueResponse = {
    items,
    count: items.length,
  };
  return NextResponse.json(body);
}
