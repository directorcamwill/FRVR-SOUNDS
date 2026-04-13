import { createAdminClient } from "@/lib/supabase/admin";

export async function runHealthMonitor(artistId: string) {
  const supabase = createAdminClient();

  const [
    { data: artist },
    { data: songs },
    { data: opportunities },
    { data: submissions },
  ] = await Promise.all([
    supabase.from("artists").select("*").eq("id", artistId).single(),
    supabase
      .from("songs")
      .select("*, song_metadata(*), sync_scores(overall_score), stems(id)")
      .eq("artist_id", artistId),
    supabase.from("opportunities").select("*").eq("artist_id", artistId),
    supabase.from("submissions").select("*").eq("artist_id", artistId),
  ]);

  const activeSongs = songs?.filter((s) => s.status === "active") || [];
  const totalActive = activeSongs.length;

  // 1. Catalog Completeness (do you have songs?)
  const catalog_completeness = Math.min(100, totalActive * 20); // 5 songs = 100

  // 2. Metadata Quality (are songs properly tagged?)
  const songsWithGenre = activeSongs.filter((s) => {
    const meta = Array.isArray(s.song_metadata)
      ? s.song_metadata[0]
      : s.song_metadata;
    return meta?.genre;
  });
  const songsWithMoods = activeSongs.filter((s) => {
    const meta = Array.isArray(s.song_metadata)
      ? s.song_metadata[0]
      : s.song_metadata;
    return meta?.moods?.length > 0;
  });
  const metadata_quality =
    totalActive > 0
      ? Math.round(
          ((songsWithGenre.length + songsWithMoods.length) /
            (totalActive * 2)) *
            100
        )
      : 0;

  // 3. Deliverables Readiness (stems, scores)
  const songsWithStems = activeSongs.filter((s) => s.stems?.length > 0);
  const songsWithScores = activeSongs.filter(
    (s) => s.sync_scores?.length > 0
  );
  const deliverables_readiness =
    totalActive > 0
      ? Math.round(
          ((songsWithStems.length + songsWithScores.length) /
            (totalActive * 2)) *
            100
        )
      : 0;

  // 4. Submission Activity (are you submitting?)
  const recentSubs =
    submissions?.filter((s) => {
      const d = new Date(s.created_at);
      return d > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }) || [];
  const submission_activity = Math.min(100, recentSubs.length * 20); // 5 subs in 30 days = 100

  // 5. Pipeline Health (active opportunities?)
  const activeOpps =
    opportunities?.filter((o) => !["won", "lost"].includes(o.stage)) || [];
  const pipeline_health = Math.min(100, activeOpps.length * 25); // 4 active = 100

  // Overall
  const overall_score = Math.round(
    catalog_completeness * 0.25 +
      metadata_quality * 0.25 +
      deliverables_readiness * 0.2 +
      submission_activity * 0.15 +
      pipeline_health * 0.15
  );

  // Missing items
  const missing_items: { type: string; message: string; action_url: string }[] =
    [];
  if (totalActive === 0)
    missing_items.push({
      type: "catalog",
      message: "No songs in vault. Upload your first track.",
      action_url: "/vault",
    });
  if (metadata_quality < 50)
    missing_items.push({
      type: "metadata",
      message: `${totalActive - songsWithGenre.length} songs missing genre/mood tags.`,
      action_url: "/vault",
    });
  if (deliverables_readiness < 50 && totalActive > 0)
    missing_items.push({
      type: "deliverables",
      message: `${totalActive - songsWithStems.length} songs missing stems.`,
      action_url: "/vault",
    });
  if (songsWithScores.length < totalActive && totalActive > 0)
    missing_items.push({
      type: "scores",
      message: `${totalActive - songsWithScores.length} songs not scored for sync readiness.`,
      action_url: "/vault",
    });
  if (submission_activity < 30)
    missing_items.push({
      type: "submissions",
      message:
        "Low submission activity. Look for opportunities to submit to.",
      action_url: "/pipeline",
    });
  if (pipeline_health < 30)
    missing_items.push({
      type: "pipeline",
      message: "No active opportunities. Add some to your pipeline.",
      action_url: "/pipeline",
    });

  // Recommendations
  const recommendations: string[] = [];
  if (catalog_completeness < 100)
    recommendations.push(
      "Upload more songs — aim for at least 5 sync-ready tracks."
    );
  if (metadata_quality < 70)
    recommendations.push(
      "Complete metadata on all songs — genre, moods, and tags are critical for matching."
    );
  if (deliverables_readiness < 50)
    recommendations.push(
      "Upload stems for your tracks — music supervisors need them for editing."
    );
  if (submission_activity < 50)
    recommendations.push(
      "Submit to more opportunities — aim for 5+ submissions per month."
    );

  // Save to DB
  const { data: score } = await supabase
    .from("health_scores")
    .insert({
      artist_id: artistId,
      overall_score,
      catalog_completeness,
      metadata_quality,
      deliverables_readiness,
      submission_activity,
      pipeline_health,
      missing_items,
      recommendations,
    })
    .select()
    .single();

  return {
    ...score,
    overall_score,
    catalog_completeness,
    metadata_quality,
    deliverables_readiness,
    submission_activity,
    pipeline_health,
    missing_items,
    recommendations,
  };
}
