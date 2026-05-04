// Deterministic streak math.
// A "streak day" is any day where the artist met the MVP plan (mvp_met=true).
// The current streak is the count of consecutive met days ending today
// (or ending yesterday — today doesn't have to be done for the streak to
// still be alive). The streak only breaks when there's a missed day strictly
// before yesterday OR a missed day yesterday with today also empty.

export interface StreakLogRow {
  log_date: string;       // "YYYY-MM-DD" (UTC, no time)
  mvp_met: boolean;
  pieces_shipped?: number;
  notes?: string | null;  // qualitative note from the artist; presence on a
                          // mvp_met=false row counts as a break acknowledgment
}

export interface StreakState {
  current_streak: number;
  longest_30d: number;
  today_logged: boolean;
  yesterday_logged: boolean;
  last_30_days: Array<{ date: string; met: boolean }>;
  // The earliest met-day in the current run, useful for "started streak on…"
  current_streak_started: string | null;
  // Surfaced when a recent streak ended without acknowledgment — lets the UI
  // prompt the artist with a "what changed?" check-in. null once acknowledged
  // or when no qualifying break exists.
  break_check_in: BreakCheckIn | null;
}

export interface BreakCheckIn {
  last_run_length: number;        // how many consecutive days the broken run was
  ended_on: string;               // YYYY-MM-DD — the last met day
  days_since: number;             // today minus ended_on
}

function dateOnlyUTC(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function shiftDays(iso: string, delta: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return dateOnlyUTC(d);
}

export function computeStreak(
  rows: StreakLogRow[],
  now: Date = new Date(),
): StreakState {
  const today = dateOnlyUTC(now);
  const yesterday = shiftDays(today, -1);

  // Index met-days for streak-run math.
  const map = new Map<string, StreakLogRow>();
  // Track ALL rows (met or not) for acknowledgment lookup.
  const anyByDate = new Map<string, StreakLogRow>();
  for (const r of rows) {
    if (r.mvp_met) map.set(r.log_date, r);
    anyByDate.set(r.log_date, r);
  }

  const today_logged = map.has(today);
  const yesterday_logged = map.has(yesterday);

  // Walk backwards from today (or yesterday if today isn't logged) and count
  // consecutive met days. The streak survives a missing today as long as
  // yesterday was met — gives the artist the full day to ship before the
  // streak breaks.
  let cursor = today_logged ? today : yesterday_logged ? yesterday : null;
  let current_streak = 0;
  let earliest: string | null = null;
  while (cursor && map.has(cursor)) {
    current_streak += 1;
    earliest = cursor;
    cursor = shiftDays(cursor, -1);
  }

  // Build the last-30-day timeline and compute the longest run within it.
  const last_30_days: Array<{ date: string; met: boolean }> = [];
  let longest = 0;
  let run = 0;
  for (let i = 29; i >= 0; i--) {
    const d = shiftDays(today, -i);
    const met = map.has(d);
    last_30_days.push({ date: d, met });
    if (met) {
      run += 1;
      if (run > longest) longest = run;
    } else {
      run = 0;
    }
  }

  // ── Break check-in detection ──
  // We only prompt when:
  //  1. There's no current streak
  //  2. There WAS a streak ≥ 2 days that ended within the last 7 days
  //  3. The artist hasn't already acknowledged this break (any streak_log
  //     row in the last 7 days with notes counts as acknowledgment)
  let break_check_in: BreakCheckIn | null = null;
  if (current_streak === 0) {
    // Find the most recent met day within the last 7 days.
    let mostRecent: string | null = null;
    for (let i = 0; i <= 7; i++) {
      const d = shiftDays(today, -i);
      if (map.has(d)) {
        mostRecent = d;
        break;
      }
    }
    if (mostRecent) {
      // Walk backward from mostRecent to compute the run length.
      let cursor: string | null = mostRecent;
      let runLength = 0;
      while (cursor && map.has(cursor)) {
        runLength += 1;
        cursor = shiftDays(cursor, -1);
      }

      // Acknowledged if any streak_log row in the last 7 days has notes.
      let acknowledged = false;
      for (let i = 0; i <= 7; i++) {
        const d = shiftDays(today, -i);
        const row = anyByDate.get(d);
        if (row && row.notes && row.notes.trim().length > 0) {
          acknowledged = true;
          break;
        }
      }

      if (runLength >= 2 && !acknowledged) {
        const daysSince =
          (Date.parse(`${today}T00:00:00Z`) -
            Date.parse(`${mostRecent}T00:00:00Z`)) /
          86400000;
        break_check_in = {
          last_run_length: runLength,
          ended_on: mostRecent,
          days_since: Math.max(1, Math.round(daysSince)),
        };
      }
    }
  }

  return {
    current_streak,
    longest_30d: longest,
    today_logged,
    yesterday_logged,
    last_30_days,
    current_streak_started: earliest,
    break_check_in,
  };
}
