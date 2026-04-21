import { PLACEMENTS, type Placement } from "@/lib/placements";

// Deterministic similarity between a vault song's metadata and a curated
// placement. No LLM — this is the hot-path match layer. Scoring is weighted
// so the strongest signals (genre + mood + BPM) dominate; weaker signals
// (key, vocal type) refine the tiebreakers.

export interface SongFeatures {
  genre?: string | null;
  sub_genre?: string | null;
  moods?: string[] | null;
  bpm?: number | null;
  key?: string | null;
  vocal_type?: string | null;
}

export interface MatchReason {
  axis: "genre" | "mood" | "bpm" | "key" | "vocal";
  weight: number;
  detail: string;
}

export interface PlacementMatch {
  placement: Placement;
  score: number; // 0-100
  reasons: MatchReason[];
}

const norm = (s: string | null | undefined) =>
  (s ?? "").trim().toLowerCase();

function genreScore(
  song: SongFeatures,
  p: Placement
): MatchReason | null {
  const songGenre = norm(song.genre);
  const placementGenre = norm(p.genre);
  const placementSub = norm(p.sub_genre);
  if (!songGenre) return null;

  if (songGenre === placementGenre) {
    return {
      axis: "genre",
      weight: 30,
      detail: `Exact genre match: ${p.genre}`,
    };
  }
  if (songGenre === placementSub) {
    return {
      axis: "genre",
      weight: 25,
      detail: `Sub-genre match: ${p.sub_genre}`,
    };
  }
  if (placementGenre.includes(songGenre) || songGenre.includes(placementGenre)) {
    return {
      axis: "genre",
      weight: 15,
      detail: `Partial genre match: ${p.genre}`,
    };
  }
  if (placementSub && (placementSub.includes(songGenre) || songGenre.includes(placementSub))) {
    return {
      axis: "genre",
      weight: 10,
      detail: `Partial sub-genre match: ${p.sub_genre}`,
    };
  }
  return null;
}

function moodScore(
  song: SongFeatures,
  p: Placement
): MatchReason | null {
  const songMoods = (song.moods ?? []).map(norm).filter(Boolean);
  if (songMoods.length === 0) return null;
  const pMoods = p.mood.map(norm);
  const shared = songMoods.filter((m) => pMoods.includes(m));
  if (shared.length === 0) return null;
  const weight = Math.min(5 * shared.length, 25);
  return {
    axis: "mood",
    weight,
    detail: `Shared moods: ${shared.join(", ")}`,
  };
}

function bpmScore(
  song: SongFeatures,
  p: Placement
): MatchReason | null {
  if (!song.bpm || !p.bpm) return null;
  const diff = Math.abs(song.bpm - p.bpm);
  if (diff <= 2) {
    return {
      axis: "bpm",
      weight: 15,
      detail: `BPM nearly identical (${song.bpm} vs ${p.bpm})`,
    };
  }
  if (diff <= 10) {
    return {
      axis: "bpm",
      weight: 8,
      detail: `BPM close (${song.bpm} vs ${p.bpm}, ±${diff})`,
    };
  }
  if (diff <= 20) {
    return {
      axis: "bpm",
      weight: 3,
      detail: `BPM in range (${song.bpm} vs ${p.bpm})`,
    };
  }
  return null;
}

function keyScore(
  song: SongFeatures,
  p: Placement
): MatchReason | null {
  if (!song.key || !p.key) return null;
  const sk = song.key.trim();
  const pk = p.key.trim();
  if (sk === pk) {
    return {
      axis: "key",
      weight: 10,
      detail: `Same key: ${pk}`,
    };
  }
  const songMinor = sk.toLowerCase().endsWith("m");
  const placementMinor = pk.toLowerCase().endsWith("m");
  if (songMinor === placementMinor) {
    return {
      axis: "key",
      weight: 5,
      detail: `Same mode (${songMinor ? "minor" : "major"})`,
    };
  }
  return null;
}

function vocalScore(
  song: SongFeatures,
  p: Placement
): MatchReason | null {
  if (!song.vocal_type || !p.vocal_type) return null;
  const a = norm(song.vocal_type);
  const b = norm(p.vocal_type);
  if (!a || !b) return null;
  if (a === b) {
    return {
      axis: "vocal",
      weight: 10,
      detail: `Same vocal type: ${p.vocal_type}`,
    };
  }
  // Partial: both have a lead (e.g. "male lead" vs "female lead")
  if (a.includes("lead") && b.includes("lead")) {
    return {
      axis: "vocal",
      weight: 3,
      detail: "Both lead-vocal tracks",
    };
  }
  return null;
}

const MAX_RAW = 30 + 25 + 15 + 10 + 10; // 90

export function matchPlacements(
  song: SongFeatures,
  limit = 5
): PlacementMatch[] {
  const scored: PlacementMatch[] = PLACEMENTS.map((p) => {
    const reasons: MatchReason[] = [];
    const g = genreScore(song, p);
    if (g) reasons.push(g);
    const m = moodScore(song, p);
    if (m) reasons.push(m);
    const b = bpmScore(song, p);
    if (b) reasons.push(b);
    const k = keyScore(song, p);
    if (k) reasons.push(k);
    const v = vocalScore(song, p);
    if (v) reasons.push(v);

    const raw = reasons.reduce((acc, r) => acc + r.weight, 0);
    const score = Math.round((raw / MAX_RAW) * 100);
    return { placement: p, score, reasons };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.filter((m) => m.score > 0).slice(0, limit);
}
