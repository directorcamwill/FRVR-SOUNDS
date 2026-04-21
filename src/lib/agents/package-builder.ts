import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Package Builder Agent — deterministic sync-submission readiness checker.
 *
 * Unlike sync-engine / sync-brief / placement-dna, this agent does NOT call
 * an LLM. All checks are rule-based over existing data (song_metadata,
 * song_splits, split_participants, song_registrations, deliverables,
 * sync_scores). No tokens, no latency, reproducible.
 *
 * Returns a typed PackageStatus the UI can render as a checklist + blocker
 * list + one-sheet. The /api/agents/package-builder route caches the result
 * into songs.package_status (migration 00012) and writes an alert when a
 * high-severity blocker exists.
 */

export type BlockerSeverity = "high" | "medium" | "low";

export type BlockerType =
  | "metadata"
  | "sync_metadata"
  | "splits"
  | "registrations"
  | "artifacts"
  | "sync_score";

export interface Blocker {
  type: BlockerType;
  severity: BlockerSeverity;
  message: string;
  action_url: string;
}

export interface ChecklistItem {
  key: string;
  label: string;
  done: boolean;
}

export interface PackageStatus {
  ready: boolean;
  completeness_pct: number;
  blockers: Blocker[];
  checklist: ChecklistItem[];
  one_sheet_markdown: string;
  generated_at: string;
}

export async function runPackageBuilder(
  songId: string
): Promise<PackageStatus> {
  const supabase = createAdminClient();

  // Fetch the song first to learn its artist_id, then fan out the rest in
  // parallel. One extra round-trip vs. pure Promise.all; buys cleaner typing
  // and avoids fetching every artist row.
  const songRes = await supabase
    .from("songs")
    .select("*, song_metadata(*), stems(*), artist_id")
    .eq("id", songId)
    .single();
  const song = songRes.data;
  if (!song) {
    throw new Error(`Song not found: ${songId}`);
  }

  const [splitsRes, registrationsRes, deliverablesRes, scoresRes, artistRes] =
    await Promise.all([
      supabase
        .from("song_splits")
        .select("id, total_percentage, split_participants(*)")
        .eq("song_id", songId)
        .maybeSingle(),
      supabase
        .from("song_registrations")
        .select("id, registration_type, status")
        .eq("song_id", songId),
      supabase
        .from("deliverables")
        .select(
          "id, artifact_type, status, qc_passed, lufs_target, true_peak_target"
        )
        .eq("song_id", songId)
        .not("artifact_type", "is", null),
      supabase
        .from("sync_scores")
        .select("overall_score, confidence, created_at")
        .eq("song_id", songId)
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("artists")
        .select("id, artist_name, pro_affiliation, ipi_number, publisher_name")
        .eq("id", song.artist_id)
        .maybeSingle(),
    ]);

  const meta = Array.isArray(song.song_metadata)
    ? song.song_metadata[0]
    : song.song_metadata;

  const splits = splitsRes.data;
  const participants = splits?.split_participants ?? [];
  const registrations = registrationsRes.data ?? [];
  const artifacts = deliverablesRes.data ?? [];
  const latestScore = scoresRes.data?.[0];
  const artist = artistRes.data ?? undefined;

  const blockers: Blocker[] = [];
  const checklist: ChecklistItem[] = [];

  // 1. Core metadata
  const coreMetadataOk = !!(
    meta?.genre &&
    meta?.moods?.length &&
    meta?.bpm &&
    meta?.key
  );
  checklist.push({
    key: "core_metadata",
    label: "Core metadata (genre, moods, BPM, key)",
    done: coreMetadataOk,
  });
  if (!coreMetadataOk) {
    blockers.push({
      type: "metadata",
      severity: "high",
      message: "Fill core metadata: genre, moods, BPM, and key.",
      action_url: `/vault/${songId}`,
    });
  }

  // 2. Sync-specific metadata (from migration 00010)
  const sceneTagsOk = (meta?.scene_tags?.length ?? 0) >= 3;
  checklist.push({
    key: "scene_tags",
    label: "At least 3 scene tags",
    done: sceneTagsOk,
  });
  if (!sceneTagsOk) {
    blockers.push({
      type: "sync_metadata",
      severity: "medium",
      message: "Add at least 3 scene tags so music supervisors can match quickly.",
      action_url: `/vault/${songId}`,
    });
  }

  const dialogueSafeOk = meta?.dialogue_safe_score != null;
  checklist.push({
    key: "dialogue_safe",
    label: "Dialogue-safe scored",
    done: dialogueSafeOk,
  });
  if (!dialogueSafeOk) {
    blockers.push({
      type: "sync_metadata",
      severity: "low",
      message: "Score dialogue-safe passages (instrumental sections under dialogue).",
      action_url: `/vault/${songId}`,
    });
  }

  const cutdownsOk = Array.isArray(meta?.cutdown_points)
    ? meta.cutdown_points.length >= 1
    : false;
  checklist.push({
    key: "cutdowns",
    label: "Cutdown points marked",
    done: cutdownsOk,
  });
  if (!cutdownsOk) {
    blockers.push({
      type: "sync_metadata",
      severity: "low",
      message: "Mark at least one cutdown point for :60/:30/:15 edits.",
      action_url: `/vault/${songId}`,
    });
  }

  const instrumentalOk = !!meta?.instrumental_available;
  checklist.push({
    key: "instrumental_flag",
    label: "Instrumental marked available",
    done: instrumentalOk,
  });
  if (!instrumentalOk) {
    blockers.push({
      type: "sync_metadata",
      severity: "medium",
      message: "Mark an instrumental version as available (or upload one).",
      action_url: `/vault/${songId}`,
    });
  }

  // 3. Splits — at least one participant, total_percentage = 100
  const splitsComplete = !!(
    splits &&
    participants.length >= 1 &&
    Number(splits.total_percentage) === 100 &&
    participants.every(
      (p: { writer_share: number; publisher_share: number }) =>
        Number(p.writer_share) > 0 || Number(p.publisher_share) > 0
    )
  );
  checklist.push({
    key: "splits",
    label: "Split sheet signed + totals 100%",
    done: splitsComplete,
  });
  if (!splitsComplete) {
    blockers.push({
      type: "splits",
      severity: "high",
      message: "Complete the split sheet. Every participant must have a writer or publisher share, summing to 100%.",
      action_url: `/money/splits`,
    });
  }

  // 4. Registrations — need PRO + ISRC at minimum
  const proOk = registrations.some(
    (r) => r.registration_type === "pro" && r.status === "complete"
  );
  const isrcOk = registrations.some(
    (r) => r.registration_type === "isrc" && r.status === "complete"
  );
  checklist.push({ key: "pro_registered", label: "Registered with PRO", done: proOk });
  checklist.push({ key: "isrc_assigned", label: "ISRC assigned", done: isrcOk });
  if (!proOk) {
    blockers.push({
      type: "registrations",
      severity: "high",
      message: "Register the song with your PRO (BMI/ASCAP/SESAC).",
      action_url: `/money/registrations`,
    });
  }
  if (!isrcOk) {
    blockers.push({
      type: "registrations",
      severity: "medium",
      message: "Assign an ISRC code for the recording.",
      action_url: `/money/registrations`,
    });
  }

  // 5. Artifacts
  const hasSyncMaster = artifacts.some(
    (a) =>
      a.artifact_type === "sync_dynamic_master" &&
      a.status === "completed"
  );
  const hasStreamingMaster = artifacts.some(
    (a) =>
      a.artifact_type === "streaming_master" && a.status === "completed"
  );
  const hasInstrumentalArtifact = artifacts.some(
    (a) => a.artifact_type === "instrumental" && a.status === "completed"
  );
  const hasStemsArtifact = artifacts.some(
    (a) => a.artifact_type === "stems_zip" && a.status === "completed"
  );

  checklist.push({
    key: "streaming_master",
    label: "Streaming master uploaded",
    done: hasStreamingMaster,
  });
  checklist.push({
    key: "sync_master",
    label: "Sync dynamic master uploaded",
    done: hasSyncMaster,
  });
  checklist.push({
    key: "instrumental_artifact",
    label: "Instrumental artifact uploaded",
    done: hasInstrumentalArtifact,
  });
  checklist.push({
    key: "stems_zip",
    label: "Stems ZIP uploaded",
    done: hasStemsArtifact,
  });
  if (!hasStreamingMaster) {
    blockers.push({
      type: "artifacts",
      severity: "high",
      message: "Upload a streaming master (-14 LUFS target).",
      action_url: `/vault/${songId}`,
    });
  }
  if (!hasSyncMaster) {
    blockers.push({
      type: "artifacts",
      severity: "high",
      message: "Upload a sync dynamic master (-18 LUFS target).",
      action_url: `/vault/${songId}`,
    });
  }
  if (!hasInstrumentalArtifact) {
    blockers.push({
      type: "artifacts",
      severity: "medium",
      message: "Upload an instrumental artifact — most syncs require one.",
      action_url: `/vault/${songId}`,
    });
  }
  if (!hasStemsArtifact) {
    blockers.push({
      type: "artifacts",
      severity: "low",
      message: "Bundle and upload a stems ZIP for TV-mix / cutdown flexibility.",
      action_url: `/vault/${songId}`,
    });
  }

  // 6. Sync score
  const scoreOk = !!(latestScore && latestScore.overall_score >= 70);
  checklist.push({
    key: "sync_score",
    label: "Sync score ≥ 70",
    done: scoreOk,
  });
  if (!scoreOk) {
    blockers.push({
      type: "sync_score",
      severity: "medium",
      message: latestScore
        ? `Sync score is ${latestScore.overall_score}. Raise to 70+ before submission.`
        : "No sync score yet — run the sync engine.",
      action_url: `/vault/${songId}`,
    });
  }

  // Compute readiness
  const done = checklist.filter((c) => c.done).length;
  const completeness_pct = Math.round((done / checklist.length) * 100);
  const highBlockers = blockers.filter((b) => b.severity === "high");
  const ready = highBlockers.length === 0 && completeness_pct >= 90;

  const one_sheet_markdown = buildOneSheet({
    song,
    meta,
    artist,
    participants,
    registrations,
    latestScore,
    hasInstrumentalArtifact,
    hasStemsArtifact,
  });

  return {
    ready,
    completeness_pct,
    blockers,
    checklist,
    one_sheet_markdown,
    generated_at: new Date().toISOString(),
  };
}

// ────────────────────────── One-sheet template ──────────────────────────

interface OneSheetInput {
  song: {
    title: string;
    duration_seconds: number | null;
  };
  meta: {
    genre?: string | null;
    sub_genre?: string | null;
    bpm?: number | null;
    key?: string | null;
    moods?: string[];
    tags?: string[];
    has_vocals?: boolean;
    language?: string;
    explicit_content?: boolean;
    one_stop?: boolean;
    scene_tags?: string[];
    similar_artists?: string[];
    description?: string | null;
    tv_mix_available?: boolean;
    instrumental_available?: boolean;
  } | null;
  artist?: {
    artist_name?: string | null;
    pro_affiliation?: string | null;
    ipi_number?: string | null;
    publisher_name?: string | null;
  };
  participants: Array<{
    name: string;
    role: string;
    writer_share: number;
    publisher_share: number;
    pro_affiliation: string | null;
  }>;
  registrations: Array<{
    registration_type: string;
    status: string;
  }>;
  latestScore?: {
    overall_score: number;
    confidence: number | null;
    created_at: string;
  };
  hasInstrumentalArtifact: boolean;
  hasStemsArtifact: boolean;
}

function buildOneSheet(i: OneSheetInput): string {
  const duration = i.song.duration_seconds
    ? `${Math.floor(i.song.duration_seconds / 60)}:${String(
        Math.floor(i.song.duration_seconds % 60)
      ).padStart(2, "0")}`
    : "—";

  const moods = i.meta?.moods?.join(", ") || "—";
  const sceneTags = i.meta?.scene_tags?.join(", ") || "—";
  const similar = i.meta?.similar_artists?.join(", ") || "—";
  const oneStop = i.meta?.one_stop ? "yes" : "no";
  const explicit = i.meta?.explicit_content ? "yes" : "no";
  const instrumental = i.meta?.instrumental_available || i.hasInstrumentalArtifact ? "yes" : "no";
  const tvMix = i.meta?.tv_mix_available ? "yes" : "no";
  const stemsLine = i.hasStemsArtifact ? "included" : "not included";

  const splitLines = i.participants
    .map(
      (p) =>
        `- **${p.name}** (${p.role}) — writer ${p.writer_share}% / publisher ${p.publisher_share}%${
          p.pro_affiliation ? ` · ${p.pro_affiliation}` : ""
        }`
    )
    .join("\n") || "_(splits pending)_";

  const regLines = i.registrations
    .map(
      (r) =>
        `- ${r.registration_type.toUpperCase()}: ${r.status}`
    )
    .join("\n") || "_(registrations pending)_";

  const scoreLine = i.latestScore
    ? `Sync score **${i.latestScore.overall_score}/100**${
        i.latestScore.confidence != null
          ? ` · confidence ${Math.round(i.latestScore.confidence * 100)}%`
          : ""
      }`
    : "_(not yet scored)_";

  return `# ${i.song.title}

**Artist:** ${i.artist?.artist_name ?? "—"}
**Duration:** ${duration}
**Genre:** ${i.meta?.genre ?? "—"}${i.meta?.sub_genre ? ` / ${i.meta.sub_genre}` : ""}
**BPM / Key:** ${i.meta?.bpm ?? "—"} / ${i.meta?.key ?? "—"}
**Moods:** ${moods}
**Language:** ${i.meta?.language ?? "—"}
**Explicit:** ${explicit}
**One-stop:** ${oneStop}

## Sync profile
${scoreLine}

**Scene tags:** ${sceneTags}
**Similar artists:** ${similar}

${i.meta?.description ? `\n${i.meta.description.trim()}\n` : ""}

## Versions available
- Streaming master
- Sync dynamic master
- Instrumental: ${instrumental}
- TV mix: ${tvMix}
- Stems: ${stemsLine}

## Splits
${splitLines}

## Registrations
${regLines}

## Contact
${i.artist?.publisher_name ? `Publisher: ${i.artist.publisher_name}\n` : ""}${i.artist?.pro_affiliation ? `PRO: ${i.artist.pro_affiliation}${i.artist.ipi_number ? ` · IPI ${i.artist.ipi_number}` : ""}\n` : ""}
`.replace(/\n{3,}/g, "\n\n");
}
