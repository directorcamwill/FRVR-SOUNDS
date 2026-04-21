import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * /api/spine — 5-node status for the Command Center v2 Spine visual.
 * INTELLIGENCE → CREATION → FINISHING → DELIVERY → ECOSYSTEM
 *
 * Each node returns a count + a status enum. Status logic is intentionally
 * simple (ok if >0, warn if 0) — this is a glanceable strip, not a dashboard.
 */

export type SpineStatus = "ok" | "warn" | "alert";

export interface SpineNode {
  count: number;
  status: SpineStatus;
  cta: string;
  route: string;
}

export interface SpineResponse {
  intelligence: SpineNode;
  creation: SpineNode;
  finishing: SpineNode;
  delivery: SpineNode;
  ecosystem: SpineNode;
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

  const [
    intelligenceRes,
    creationRes,
    finishingRes,
    deliveryRes,
    ecosystemRes,
  ] = await Promise.all([
    supabase
      .from("opportunities")
      .select("id", { count: "exact", head: true })
      .eq("artist_id", artist.id)
      .not("brief_details", "is", null),
    supabase
      .from("song_lab_projects")
      .select("id", { count: "exact", head: true })
      .eq("artist_id", artist.id)
      .neq("status", "complete"),
    supabase
      .from("deliverables")
      .select("id", { count: "exact", head: true })
      .eq("artist_id", artist.id)
      .not("artifact_type", "is", null)
      .eq("status", "in_progress"),
    supabase
      .from("deliverables")
      .select("song_id")
      .eq("artist_id", artist.id)
      .not("artifact_type", "is", null)
      .eq("status", "completed"),
    supabase
      .from("opportunities")
      .select("id", { count: "exact", head: true })
      .eq("artist_id", artist.id)
      .not("stage", "in", "(won,lost)"),
  ]);

  const intelligenceCount = intelligenceRes.count ?? 0;
  const creationCount = creationRes.count ?? 0;
  const finishingCount = finishingRes.count ?? 0;
  const deliverySongIds = new Set(
    (deliveryRes.data ?? []).map((d) => d.song_id).filter(Boolean)
  );
  const deliveryCount = deliverySongIds.size;
  const ecosystemCount = ecosystemRes.count ?? 0;

  const statusFor = (count: number): SpineStatus =>
    count > 0 ? "ok" : "warn";

  const body: SpineResponse = {
    intelligence: {
      count: intelligenceCount,
      status: statusFor(intelligenceCount),
      cta: intelligenceCount > 0 ? "Review briefs" : "Structure a brief",
      route: "/intelligence",
    },
    creation: {
      count: creationCount,
      status: statusFor(creationCount),
      cta: creationCount > 0 ? "Open Song Lab" : "Start a project",
      route: "/song-lab",
    },
    finishing: {
      count: finishingCount,
      status: finishingCount > 0 ? "ok" : "warn",
      cta: finishingCount > 0 ? "View renders" : "Nothing finishing",
      route: "/deliverables",
    },
    delivery: {
      count: deliveryCount,
      status: statusFor(deliveryCount),
      cta: deliveryCount > 0 ? "Ship package" : "No packages ready",
      route: "/submissions",
    },
    ecosystem: {
      count: ecosystemCount,
      status: statusFor(ecosystemCount),
      cta: ecosystemCount > 0 ? "See pipeline" : "Find opportunities",
      route: "/pipeline",
    },
  };

  return NextResponse.json(body);
}
