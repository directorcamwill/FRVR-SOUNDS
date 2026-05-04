// Build a 14-day calendar slot grid from weekly_cadence + content_pieces.
// Pure deterministic — no DB, no LLM. The dashboard renders whatever this
// returns, so behavior changes happen here.
//
// Definition of a "slot": one (date, platform) pairing on a ship_day. Each
// slot is either filled (linked to a content_piece scheduled or shipped on
// that date) or empty (with a "+ Draft" affordance).
//
// Filling rules — a piece fills a slot when:
//   1. piece.platform matches the slot's platform AND
//   2. (a) piece.scheduled_for matches the slot's date, OR
//      (b) piece.shipped_at matches the slot's date AND piece is unscheduled.
//
// Multiple matches on the same slot: the most recent (newest updated_at) wins
// in the calendar, but all are kept on the slot for the UI to surface as
// "duplicate".

export interface CalendarPiece {
  id: string;
  platform: string | null;
  hook: string | null;
  scheduled_for: string | null;     // ISO datetime
  shipped_at: string | null;
  fit_status: string | null;
  fit_score: { total?: number } | null;
  updated_at: string;
}

export interface CadenceSettings {
  primary_count: number | null;     // slots/wk on primary
  batch_day: string | null;         // "sunday"
  ship_days: string[];              // ["tuesday","thursday","saturday"]
  primary_platform: string;         // "instagram" by default
}

export interface CalendarSlot {
  date: string;                     // YYYY-MM-DD
  weekday: string;                  // "tuesday"
  platform: string;
  is_batch_day: boolean;
  is_today: boolean;
  pieces: CalendarPiece[];
  primary: CalendarPiece | null;    // most-recent piece in this slot, if any
}

const DAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

function dateOnlyUTC(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function shiftDays(iso: string, delta: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return dateOnlyUTC(d);
}

function weekdayOf(iso: string): string {
  return DAYS[new Date(`${iso}T00:00:00Z`).getUTCDay()];
}

export function parseShipDays(input: string | null | undefined): string[] {
  if (!input) return [];
  return input
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => DAYS.includes(s as (typeof DAYS)[number]));
}

export interface BuildCalendarInput {
  cadence: CadenceSettings;
  pieces: CalendarPiece[];
  anchor: Date;       // typically `new Date()` — the calendar starts at the
                      // anchor's week's Monday and runs 14 days forward.
}

export function buildCalendarSlots(input: BuildCalendarInput): CalendarSlot[] {
  const { cadence, pieces, anchor } = input;
  const todayISO = dateOnlyUTC(anchor);

  // Walk to the Monday of `anchor`'s week, then produce 14 days forward.
  const day = (anchor.getUTCDay() + 6) % 7; // Mon = 0
  const startISO = shiftDays(todayISO, -day);

  const shipDays = new Set(cadence.ship_days);
  const batchDay = cadence.batch_day?.toLowerCase() ?? null;
  const platform = cadence.primary_platform || "instagram";

  // Bucket pieces by (date, platform) for O(1) match.
  const bucket = new Map<string, CalendarPiece[]>();
  const keyOf = (date: string, p: string) => `${date}|${p.toLowerCase()}`;
  for (const piece of pieces) {
    const date = piece.scheduled_for
      ? piece.scheduled_for.slice(0, 10)
      : piece.shipped_at
        ? piece.shipped_at.slice(0, 10)
        : null;
    const plat = piece.platform?.toLowerCase();
    if (!date || !plat) continue;
    const k = keyOf(date, plat);
    const arr = bucket.get(k) ?? [];
    arr.push(piece);
    bucket.set(k, arr);
  }

  const slots: CalendarSlot[] = [];
  for (let i = 0; i < 14; i++) {
    const date = shiftDays(startISO, i);
    const weekday = weekdayOf(date);
    const isBatch = batchDay === weekday;
    const isToday = date === todayISO;

    if (shipDays.has(weekday)) {
      const matched = bucket.get(keyOf(date, platform)) ?? [];
      // Most-recent first (by updated_at)
      matched.sort((a, b) => (b.updated_at > a.updated_at ? 1 : -1));
      slots.push({
        date,
        weekday,
        platform,
        is_batch_day: isBatch,
        is_today: isToday,
        pieces: matched,
        primary: matched[0] ?? null,
      });
    } else if (isBatch) {
      // Surface batch days even if not ship days, so the UI can show
      // "today is your batch day" without rendering an empty slot.
      slots.push({
        date,
        weekday,
        platform,
        is_batch_day: true,
        is_today: isToday,
        pieces: [],
        primary: null,
      });
    }
  }
  return slots;
}
