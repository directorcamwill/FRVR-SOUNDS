import type { PlacementMatch } from "@/lib/placement-matcher";

// Pattern Intelligence — deterministic analysis over a set of placement
// matches. Tells the artist "across your closest matches, here's what
// they have in common". No LLM; pure function so it can render instantly
// and is safe to re-compute on every render.

export interface PatternInsights {
  count: number;
  dominantPlacementType?: { value: string; coverage: number; detail: string };
  dominantPlatform?: { value: string; coverage: number; detail: string };
  dominantGenre?: { value: string; coverage: number; detail: string };
  dominantVocalType?: { value: string; coverage: number; detail: string };
  commonMoods: Array<{ value: string; coverage: number }>;
  bpmRange?: { min: number; max: number; median: number; count: number };
  keyModeBreakdown?: { minor: number; major: number };
  takeaways: string[];
}

function dominantFromField<T extends string | null | undefined>(
  values: T[],
  minCoverage = 0.5
): { value: string; coverage: number } | undefined {
  const counts = new Map<string, number>();
  for (const v of values) {
    if (!v) continue;
    const k = String(v).trim();
    if (!k) continue;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  if (counts.size === 0) return undefined;
  let topValue: string | undefined;
  let topCount = 0;
  for (const [k, n] of counts) {
    if (n > topCount) {
      topCount = n;
      topValue = k;
    }
  }
  if (!topValue) return undefined;
  const total = values.filter(Boolean).length;
  const coverage = topCount / Math.max(total, 1);
  return coverage >= minCoverage
    ? { value: topValue, coverage }
    : undefined;
}

export function analyzeMatches(
  matches: PlacementMatch[]
): PatternInsights {
  const count = matches.length;
  if (count === 0) {
    return { count: 0, commonMoods: [], takeaways: [] };
  }

  const pls = matches.map((m) => m.placement);

  const dominantPlacementType = dominantFromField(
    pls.map((p) => p.placement_type),
    0.4
  );
  const dominantPlatform = dominantFromField(
    pls.map((p) => p.platform),
    0.4
  );
  const dominantGenre = dominantFromField(
    pls.map((p) => p.genre),
    0.4
  );
  const dominantVocalType = dominantFromField(
    pls.map((p) => p.vocal_type ?? null),
    0.4
  );

  // Mood analysis — count occurrences of each mood across all placements,
  // surface moods present in at least 40% of the matches.
  const moodCounts = new Map<string, number>();
  for (const p of pls) {
    for (const m of p.mood ?? []) {
      const k = m.toLowerCase();
      moodCounts.set(k, (moodCounts.get(k) ?? 0) + 1);
    }
  }
  const commonMoods = Array.from(moodCounts.entries())
    .map(([value, n]) => ({ value, coverage: n / count }))
    .filter((m) => m.coverage >= 0.4)
    .sort((a, b) => b.coverage - a.coverage);

  // BPM range
  const bpms = pls.map((p) => p.bpm).filter((b): b is number => !!b);
  let bpmRange: PatternInsights["bpmRange"];
  if (bpms.length > 0) {
    const sorted = [...bpms].sort((a, b) => a - b);
    const median =
      sorted.length % 2 === 0
        ? Math.round((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2)
        : sorted[Math.floor(sorted.length / 2)];
    bpmRange = {
      min: Math.min(...bpms),
      max: Math.max(...bpms),
      median,
      count: bpms.length,
    };
  }

  // Key/mode breakdown (minor vs major).
  const keyModeBreakdown = pls.reduce(
    (acc, p) => {
      if (!p.key) return acc;
      if (p.key.toLowerCase().endsWith("m")) acc.minor += 1;
      else acc.major += 1;
      return acc;
    },
    { minor: 0, major: 0 }
  );

  // Human-readable takeaways — the "pattern headline".
  const takeaways: string[] = [];
  if (dominantPlacementType) {
    takeaways.push(
      `${Math.round(dominantPlacementType.coverage * 100)}% of matches are ${dominantPlacementType.value} placements — pitch this song as a ${dominantPlacementType.value.toLowerCase()}.`
    );
  }
  if (dominantPlatform) {
    takeaways.push(
      `${Math.round(dominantPlatform.coverage * 100)}% live on ${dominantPlatform.value} — your target buyer skews toward that platform's supervisors.`
    );
  }
  if (bpmRange) {
    takeaways.push(
      `Target tempo window: ${bpmRange.min}–${bpmRange.max} BPM (median ${bpmRange.median}). Tracks outside this range are a harder sell for this profile.`
    );
  }
  if (keyModeBreakdown.minor + keyModeBreakdown.major > 0) {
    const minorPct = keyModeBreakdown.minor / (keyModeBreakdown.minor + keyModeBreakdown.major);
    if (minorPct >= 0.6) {
      takeaways.push(
        `Minor keys dominate (${keyModeBreakdown.minor}/${keyModeBreakdown.minor + keyModeBreakdown.major}) — emotional weight lives here.`
      );
    } else if (minorPct <= 0.4) {
      takeaways.push(
        `Major keys dominate (${keyModeBreakdown.major}/${keyModeBreakdown.minor + keyModeBreakdown.major}) — brighter tonal palette.`
      );
    }
  }
  if (commonMoods.length > 0) {
    takeaways.push(
      `Emotional signature: ${commonMoods
        .slice(0, 4)
        .map((m) => m.value)
        .join(" · ")} — lean into these words in your metadata and pitches.`
    );
  }
  if (dominantVocalType) {
    takeaways.push(
      `${Math.round(dominantVocalType.coverage * 100)}% use ${dominantVocalType.value} vocals.`
    );
  }

  return {
    count,
    dominantPlacementType: dominantPlacementType && {
      value: dominantPlacementType.value,
      coverage: dominantPlacementType.coverage,
      detail: `${Math.round(dominantPlacementType.coverage * 100)}% of matches`,
    },
    dominantPlatform: dominantPlatform && {
      value: dominantPlatform.value,
      coverage: dominantPlatform.coverage,
      detail: `${Math.round(dominantPlatform.coverage * 100)}% of matches`,
    },
    dominantGenre: dominantGenre && {
      value: dominantGenre.value,
      coverage: dominantGenre.coverage,
      detail: `${Math.round(dominantGenre.coverage * 100)}% of matches`,
    },
    dominantVocalType: dominantVocalType && {
      value: dominantVocalType.value,
      coverage: dominantVocalType.coverage,
      detail: `${Math.round(dominantVocalType.coverage * 100)}% of matches`,
    },
    commonMoods,
    bpmRange,
    keyModeBreakdown,
    takeaways,
  };
}
