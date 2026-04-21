import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/opportunities/match-project
 * Body: { project_id: string }
 *
 * Deterministic ranker: scores every active opportunity by
 *   - genre match between project.genre and opportunity.genres_needed
 *   - mood overlap between project.mood and opportunity.moods_needed
 *   - brand format alignment (brand_wiki.sync_format_targets vs opportunity.opportunity_type)
 *   - brief_details.format_family match (from sync-brief agent output, if structured)
 *   - deadline proximity (boost for imminent)
 *
 * Returns top matches with a 0–100 score + reason strings. No LLM call —
 * fast + free + reproducible. Separate from:
 *   - /api/opportunities/[id]/matches (LLM-scored song-to-opp matching)
 *   - sync-brief (structures one brief at a time)
 */

interface MatchResult {
  opportunity_id: string;
  title: string;
  company: string | null;
  opportunity_type: string | null;
  deadline: string | null;
  stage: string;
  score: number;
  reasons: string[];
}

const ACTIVE_STAGES = new Set([
  "discovery",
  "qualified",
  "matched",
  "ready",
  "submitted",
  "pending",
]);

export async function POST(request: Request) {
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

  const body = await request.json().catch(() => ({}));
  const projectId: string | undefined = body?.project_id;
  if (!projectId)
    return NextResponse.json(
      { error: "project_id is required" },
      { status: 400 }
    );

  const { data: project } = await supabase
    .from("song_lab_projects")
    .select("id, title, genre, mood, notes, song_id")
    .eq("id", projectId)
    .eq("artist_id", artist.id)
    .single();
  if (!project)
    return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const { data: wiki } = await supabase
    .from("brand_wiki")
    .select("sync_format_targets, avoid_sync_formats, sonic_moods")
    .eq("artist_id", artist.id)
    .maybeSingle();

  const { data: opportunities } = await supabase
    .from("opportunities")
    .select(
      "id, title, company, opportunity_type, genres_needed, moods_needed, deadline, stage, brief_details"
    )
    .eq("artist_id", artist.id);

  const projectGenre = project.genre?.toLowerCase() ?? null;
  const projectMood = project.mood?.toLowerCase() ?? null;
  const brandFormats = new Set(
    (wiki?.sync_format_targets ?? []).map((f: string) => f.toLowerCase())
  );
  const avoidFormats = new Set(
    (wiki?.avoid_sync_formats ?? []).map((f: string) => f.toLowerCase())
  );
  const brandMoods = new Set(
    (wiki?.sonic_moods ?? []).map((m: string) => m.toLowerCase())
  );

  const now = Date.now();
  const results: MatchResult[] = [];

  for (const opp of opportunities ?? []) {
    if (!ACTIVE_STAGES.has(opp.stage)) continue;

    let score = 0;
    const reasons: string[] = [];

    // Genre match
    const genresNeeded = (opp.genres_needed ?? []).map((g: string) =>
      g.toLowerCase()
    );
    if (projectGenre && genresNeeded.length > 0) {
      if (genresNeeded.includes(projectGenre)) {
        score += 30;
        reasons.push(`Genre "${project.genre}" requested`);
      } else {
        const sameFamily = genresNeeded.some(
          (g: string) => g.split(/\s|\//)[0] === projectGenre.split(/\s|\//)[0]
        );
        if (sameFamily) {
          score += 15;
          reasons.push(`Adjacent genre family match`);
        }
      }
    } else if (genresNeeded.length === 0) {
      score += 10;
      reasons.push(`Open on genre`);
    }

    // Mood overlap
    const moodsNeeded = (opp.moods_needed ?? []).map((m: string) =>
      m.toLowerCase()
    );
    if (projectMood && moodsNeeded.includes(projectMood)) {
      score += 15;
      reasons.push(`Mood "${project.mood}" requested`);
    }
    // Brand mood presence in the opp
    const brandMoodOverlap = moodsNeeded.filter((m: string) =>
      brandMoods.has(m)
    ).length;
    if (brandMoodOverlap > 0) {
      score += Math.min(15, brandMoodOverlap * 5);
      reasons.push(
        `${brandMoodOverlap} brand mood${brandMoodOverlap === 1 ? "" : "s"} align`
      );
    }

    // Format target match (against brand's declared sync targets)
    const oppType = opp.opportunity_type?.toLowerCase();
    if (oppType) {
      if (avoidFormats.has(oppType)) {
        score -= 40;
        reasons.push(`Brand avoids ${oppType}`);
      } else if (brandFormats.has(oppType)) {
        score += 30;
        reasons.push(`Brand targets ${oppType} placements`);
      } else {
        score += 10;
      }
    }

    // Brief format_family match (more specific than opportunity_type)
    const briefFormat = (opp.brief_details as { format_family?: string } | null)
      ?.format_family?.toLowerCase();
    if (briefFormat && brandFormats.has(briefFormat)) {
      score += 15;
      reasons.push(`Structured brief says ${briefFormat}`);
    }

    // Deadline proximity (only boost if known + not overdue)
    if (opp.deadline) {
      const diffDays = Math.round(
        (Date.parse(opp.deadline) - now) / (24 * 60 * 60 * 1000)
      );
      if (diffDays >= 0 && diffDays <= 7) {
        score += 10;
        reasons.push(`Deadline in ${diffDays}d`);
      } else if (diffDays > 7 && diffDays <= 21) {
        score += 5;
      } else if (diffDays < 0) {
        score -= 20;
        reasons.push(`Overdue`);
      }
    }

    // Clamp
    score = Math.max(0, Math.min(100, score));

    results.push({
      opportunity_id: opp.id,
      title: opp.title,
      company: opp.company ?? null,
      opportunity_type: opp.opportunity_type ?? null,
      deadline: opp.deadline ?? null,
      stage: opp.stage,
      score,
      reasons,
    });
  }

  results.sort((a, b) => b.score - a.score);

  return NextResponse.json({
    project_id: projectId,
    matches: results.slice(0, 10),
    total_active: results.length,
  });
}
