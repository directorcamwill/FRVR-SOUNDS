import { SUPERVISORS, type Supervisor } from "@/lib/supervisors";
import type { SongFeatures } from "@/lib/placement-matcher";

// Supervisor Matcher — scores supervisors against a vault song's features +
// the artist's placement_intent. Deterministic, no LLM. Mirrors the shape
// of the placement-matcher so UI can consume both the same way.

export interface SupervisorMatchReason {
  axis: "genre" | "mood" | "format" | "era";
  weight: number;
  detail: string;
}

export interface SupervisorMatch {
  supervisor: Supervisor;
  score: number; // 0-100
  reasons: SupervisorMatchReason[];
}

export interface MatchSongContext {
  features: SongFeatures;
  placement_intent?: "sync" | "brand_release" | "both" | null;
  project_mode?: "single" | "album" | null;
}

const norm = (s: string | null | undefined) =>
  (s ?? "").trim().toLowerCase();

function genreOverlap(
  song: SongFeatures,
  sup: Supervisor
): SupervisorMatchReason | null {
  const sg = norm(song.genre);
  const sub = norm(song.sub_genre);
  if (!sg && !sub) return null;
  const supGenres = sup.genres.map(norm);

  // Exact match on genre or sub-genre
  if (supGenres.includes(sg) || (sub && supGenres.includes(sub))) {
    return {
      axis: "genre",
      weight: 35,
      detail: `Works in ${sg || sub} — a core genre`,
    };
  }
  // Partial (token overlap)
  const tokens = new Set<string>();
  if (sg) sg.split(/[\s/&-]+/).filter(Boolean).forEach((t) => tokens.add(t));
  if (sub) sub.split(/[\s/&-]+/).filter(Boolean).forEach((t) => tokens.add(t));
  const matchedGenres = supGenres.filter((g) =>
    Array.from(tokens).some((t) => g.includes(t))
  );
  if (matchedGenres.length > 0) {
    return {
      axis: "genre",
      weight: 20,
      detail: `Partial genre match: ${matchedGenres.slice(0, 2).join(", ")}`,
    };
  }
  return null;
}

function moodOverlap(
  song: SongFeatures,
  sup: Supervisor
): SupervisorMatchReason | null {
  const songMoods = (song.moods ?? []).map(norm).filter(Boolean);
  const supMoods = (sup.mood_preferences ?? []).map(norm);
  if (songMoods.length === 0 || supMoods.length === 0) return null;
  const shared = songMoods.filter((m) => supMoods.includes(m));
  if (shared.length === 0) return null;
  const weight = Math.min(5 * shared.length, 25);
  return {
    axis: "mood",
    weight,
    detail: `Mood alignment: ${shared.join(", ")}`,
  };
}

function formatOverlap(
  ctx: MatchSongContext,
  sup: Supervisor
): SupervisorMatchReason | null {
  // Artists with placement_intent = 'sync' want film/TV/trailer/commercial supervisors.
  // Artists with 'brand_release' or 'both' cast a wider net.
  const intent = ctx.placement_intent ?? "both";
  const formats = sup.formats;
  const syncFormats = new Set([
    "Prestige TV",
    "Network TV",
    "Indie Film",
    "Studio Film",
    "Trailer",
    "Commercial",
    "Video Game",
    "Streaming Documentary",
  ]);
  const intersects = formats.some((f) => syncFormats.has(f));
  if (!intersects) return null;

  if (intent === "sync") {
    return {
      axis: "format",
      weight: 20,
      detail: `Works ${formats.slice(0, 2).join(" + ")} — aligned with your sync intent`,
    };
  }
  if (intent === "both") {
    return {
      axis: "format",
      weight: 12,
      detail: `Works ${formats.slice(0, 2).join(" + ")}`,
    };
  }
  // brand_release
  return {
    axis: "format",
    weight: 6,
    detail: `Works ${formats.slice(0, 2).join(" + ")}`,
  };
}

const MAX_RAW = 35 + 25 + 20; // genre + mood + format; era is a tiebreaker only

export function matchSupervisors(
  ctx: MatchSongContext,
  limit = 8
): SupervisorMatch[] {
  const scored: SupervisorMatch[] = SUPERVISORS.map((sup) => {
    const reasons: SupervisorMatchReason[] = [];
    const g = genreOverlap(ctx.features, sup);
    if (g) reasons.push(g);
    const m = moodOverlap(ctx.features, sup);
    if (m) reasons.push(m);
    const f = formatOverlap(ctx, sup);
    if (f) reasons.push(f);

    const raw = reasons.reduce((acc, r) => acc + r.weight, 0);
    const score = Math.round((raw / MAX_RAW) * 100);
    return { supervisor: sup, score, reasons };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.filter((m) => m.score > 0).slice(0, limit);
}
