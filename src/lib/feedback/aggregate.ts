// Deterministic weekly Feedback Loop aggregation.
// Input: a list of shipped content_pieces with optional performance JSONB.
// Output: this-week-vs-last-week deltas, top signal, top anti-signal,
// per-pillar / per-emotion lift over baseline.
//
// "Lift" is a single engagement-rate proxy:
//   lift = (saves + replies + 2 * sends + 5 * follows_from + 10 * sales) / max(views, 1)
// Saves/replies are weighted lightly; sends 2x; follows-from 5x because they
// represent audience growth; sales 10x because they're the actual revenue
// outcome. Tunable later — kept simple here so the math is auditable.

export interface PiecePerformance {
  views?: number;
  saves?: number;
  replies?: number;
  sends?: number;
  follows_from?: number;
  sales_attributed?: number;
}

export interface ShippedPiece {
  id: string;
  pillar_id: string | null;
  format_id?: string | null;
  shipped_at: string | null;     // ISO
  hook?: string | null;
  fit_score?: { total?: number } | null;
  performance?: PiecePerformance | null;
  // The dominant emotion is captured per-hook; we accept it as a hint.
  emotion?: string | null;
}

export interface WeeklyAggregate {
  period_start: string;          // ISO date (Monday)
  period_end: string;            // ISO date (Sunday)
  pieces_shipped: number;
  pieces_with_data: number;
  baseline_lift: number | null;
  top_signal: AggregateSignal | null;
  top_anti_signal: AggregateSignal | null;
  by_pillar: AggregateBucket[];
  by_emotion: AggregateBucket[];
  totals: PiecePerformance;
  wow: WeekOverWeek;
}

export interface AggregateSignal {
  kind: "pillar" | "emotion" | "format";
  key: string;
  lift: number;
  delta_from_baseline: number;   // lift - baseline_lift, signed
  pieces: number;
  message: string;
}

export interface AggregateBucket {
  key: string;
  pieces: number;
  totals: PiecePerformance;
  lift: number;
}

export interface WeekOverWeek {
  views: number;
  saves: number;
  follows_from: number;
  sales_attributed: number;
  pieces_shipped: number;
}

function liftOf(p: PiecePerformance | null | undefined): number {
  if (!p || !p.views) return 0;
  const num =
    (p.saves ?? 0) +
    (p.replies ?? 0) +
    2 * (p.sends ?? 0) +
    5 * (p.follows_from ?? 0) +
    10 * (p.sales_attributed ?? 0);
  return num / Math.max(p.views ?? 1, 1);
}

function sumPerf(perfs: Array<PiecePerformance | null | undefined>): PiecePerformance {
  return perfs.reduce<PiecePerformance>(
    (acc, p) => {
      if (!p) return acc;
      acc.views = (acc.views ?? 0) + (p.views ?? 0);
      acc.saves = (acc.saves ?? 0) + (p.saves ?? 0);
      acc.replies = (acc.replies ?? 0) + (p.replies ?? 0);
      acc.sends = (acc.sends ?? 0) + (p.sends ?? 0);
      acc.follows_from = (acc.follows_from ?? 0) + (p.follows_from ?? 0);
      acc.sales_attributed =
        (acc.sales_attributed ?? 0) + (p.sales_attributed ?? 0);
      return acc;
    },
    { views: 0, saves: 0, replies: 0, sends: 0, follows_from: 0, sales_attributed: 0 },
  );
}

function startOfWeekISO(d: Date): Date {
  const date = new Date(d);
  const day = (date.getUTCDay() + 6) % 7; // Mon = 0
  date.setUTCDate(date.getUTCDate() - day);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

function isInRange(iso: string, start: Date, end: Date): boolean {
  const t = new Date(iso).getTime();
  return t >= start.getTime() && t < end.getTime();
}

function bucketize<K extends string>(
  pieces: ShippedPiece[],
  keyOf: (p: ShippedPiece) => K | null | undefined,
): AggregateBucket[] {
  const map = new Map<string, ShippedPiece[]>();
  for (const piece of pieces) {
    const k = keyOf(piece);
    if (!k) continue;
    const arr = map.get(k) ?? [];
    arr.push(piece);
    map.set(k, arr);
  }
  return Array.from(map.entries()).map(([key, ps]) => {
    const totals = sumPerf(ps.map((p) => p.performance));
    return {
      key,
      pieces: ps.length,
      totals,
      lift: liftOf(totals),
    };
  });
}

function strongestSignal(
  buckets: AggregateBucket[],
  baseline: number,
  kind: AggregateSignal["kind"],
): { top: AggregateSignal | null; bottom: AggregateSignal | null } {
  if (buckets.length === 0) return { top: null, bottom: null };
  const sorted = [...buckets].sort((a, b) => b.lift - a.lift);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const top: AggregateSignal | null =
    best && best.pieces > 0
      ? {
          kind,
          key: best.key,
          lift: best.lift,
          delta_from_baseline: best.lift - baseline,
          pieces: best.pieces,
          message: `${kind === "pillar" ? "Pillar" : "Emotion"} "${best.key}" is +${(((best.lift - baseline) / Math.max(baseline, 0.0001)) * 100).toFixed(0)}% over baseline (${best.pieces} piece${best.pieces === 1 ? "" : "s"}). Double its slots.`,
        }
      : null;
  const bottom: AggregateSignal | null =
    worst && worst.pieces > 0 && worst.lift < baseline
      ? {
          kind,
          key: worst.key,
          lift: worst.lift,
          delta_from_baseline: worst.lift - baseline,
          pieces: worst.pieces,
          message: `${kind === "pillar" ? "Pillar" : "Emotion"} "${worst.key}" is below baseline (${worst.pieces} piece${worst.pieces === 1 ? "" : "s"}). Retire or rework.`,
        }
      : null;
  return { top, bottom };
}

export function aggregateWeek(
  allPieces: ShippedPiece[],
  now: Date = new Date(),
): WeeklyAggregate {
  const thisWeekStart = startOfWeekISO(now);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setUTCDate(lastWeekStart.getUTCDate() - 7);
  const thisWeekEnd = new Date(thisWeekStart);
  thisWeekEnd.setUTCDate(thisWeekEnd.getUTCDate() + 7);

  const inRange = (start: Date, end: Date) =>
    allPieces.filter((p) => p.shipped_at && isInRange(p.shipped_at, start, end));

  const thisWeek = inRange(thisWeekStart, thisWeekEnd);
  const lastWeek = inRange(lastWeekStart, thisWeekStart);

  const piecesWithData = thisWeek.filter(
    (p) => p.performance && (p.performance.views ?? 0) > 0,
  );

  const totals = sumPerf(thisWeek.map((p) => p.performance));
  const lastWeekTotals = sumPerf(lastWeek.map((p) => p.performance));
  const baseline = liftOf(totals);

  const byPillar = bucketize(piecesWithData, (p) => p.pillar_id ?? null);
  const byEmotion = bucketize(piecesWithData, (p) => p.emotion ?? null);

  // Pick the strongest of pillar vs emotion as the headline top_signal
  // (whichever has the larger delta_from_baseline). Same for anti-signal.
  const pillarSig = strongestSignal(byPillar, baseline, "pillar");
  const emotionSig = strongestSignal(byEmotion, baseline, "emotion");

  const tops = [pillarSig.top, emotionSig.top].filter(Boolean) as AggregateSignal[];
  const bottoms = [pillarSig.bottom, emotionSig.bottom].filter(
    Boolean,
  ) as AggregateSignal[];

  const top_signal =
    tops.length === 0
      ? null
      : tops.reduce((a, b) =>
          a.delta_from_baseline >= b.delta_from_baseline ? a : b,
        );
  const top_anti_signal =
    bottoms.length === 0
      ? null
      : bottoms.reduce((a, b) =>
          a.delta_from_baseline <= b.delta_from_baseline ? a : b,
        );

  const wow: WeekOverWeek = {
    views: (totals.views ?? 0) - (lastWeekTotals.views ?? 0),
    saves: (totals.saves ?? 0) - (lastWeekTotals.saves ?? 0),
    follows_from: (totals.follows_from ?? 0) - (lastWeekTotals.follows_from ?? 0),
    sales_attributed:
      (totals.sales_attributed ?? 0) - (lastWeekTotals.sales_attributed ?? 0),
    pieces_shipped: thisWeek.length - lastWeek.length,
  };

  const periodEnd = new Date(thisWeekEnd);
  periodEnd.setUTCDate(periodEnd.getUTCDate() - 1);

  return {
    period_start: thisWeekStart.toISOString().slice(0, 10),
    period_end: periodEnd.toISOString().slice(0, 10),
    pieces_shipped: thisWeek.length,
    pieces_with_data: piecesWithData.length,
    baseline_lift: piecesWithData.length > 0 ? baseline : null,
    top_signal,
    top_anti_signal,
    by_pillar: byPillar,
    by_emotion: byEmotion,
    totals,
    wow,
  };
}
