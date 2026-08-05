// attendanceScoring.ts
// Pure scoring engine for Lit & Learn attendance.
// Give it the tap times, it returns the mark. No UI, no side effects.
//
// Both classes work the same way: ONE arrival, ONE departure, ONE mark
// per day. The schedule below is only the FALLBACK — the live schedule
// is stored in Supabase (attendance_settings, key 'schedule') and edited
// in the portal, so times change without touching this file or the SQL.

export type Mark = "P" | "L" | "A";

// A time is either "HH:MM" (24h) or null (no tap recorded).
export type Time = string | null;

export interface DayRules {
  graceEnd: string;      // in by this -> on-time side; after -> L
  dayEnd: string;        // must stay to this for P
  checkinOpen: string;   // QR accepted from
  checkinClose: string;  // QR accepted until
  /** Which weekdays the class meets: 0=Sun … 6=Sat. */
  days: number[];
}

export interface ScheduleConfig {
  weekday: DayRules;
  weekend: DayRules;
  /** Testing switch: when true the QR is accepted at any hour. */
  testingMode?: boolean;
}

export const DEFAULT_SCHEDULE: ScheduleConfig = {
  weekday: { graceEnd: "10:30", dayEnd: "14:00", checkinOpen: "09:45", checkinClose: "12:00", days: [1, 2, 3, 4] }, // Mon–Thu
  weekend: { graceEnd: "09:30", dayEnd: "16:30", checkinOpen: "08:45", checkinClose: "16:30", days: [5, 6] },       // Fri–Sat
  testingMode: false,
};

/** Every date the class meets between two YYYY-MM-DD dates, inclusive. */
export function meetingDays(startISO: string, endISO: string, rules: DayRules): string[] {
  if (!startISO || !endISO || startISO > endISO) return [];
  const out: string[] = [];
  const d = new Date(`${startISO}T12:00:00`);
  const end = new Date(`${endISO}T12:00:00`);
  const meets = rules.days && rules.days.length ? rules.days : [1, 2, 3, 4];
  while (d <= end) {
    if (meets.includes(d.getDay())) out.push(d.toLocaleDateString("en-CA"));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

/**
 * Fills missing fields from the defaults so a partial saved schedule can
 * never break scoring. Also migrates the older two-session weekend shape
 * (weekendMorning / weekendAfternoon) to the single-session one.
 */
export function normaliseSchedule(raw: any): ScheduleConfig {
  const d = DEFAULT_SCHEDULE;
  if (!raw || typeof raw !== "object") return d;

  let weekend = { ...d.weekend, ...(raw.weekend || {}) };
  if (!raw.weekend && (raw.weekendMorning || raw.weekendAfternoon)) {
    // migrate from the old split-session schedule
    weekend = {
      graceEnd:     raw.weekendMorning?.graceEnd     ?? d.weekend.graceEnd,
      dayEnd:       raw.weekendAfternoon?.sessionEnd ?? d.weekend.dayEnd,
      checkinOpen:  raw.weekendMorning?.checkinOpen  ?? d.weekend.checkinOpen,
      checkinClose: raw.weekendAfternoon?.checkinClose ?? d.weekend.checkinClose,
    };
  }

  const weekday = { ...d.weekday, ...(raw.weekday || {}) };
  if (!Array.isArray(weekday.days) || !weekday.days.length) weekday.days = d.weekday.days;
  if (!Array.isArray(weekend.days) || !weekend.days.length) weekend.days = d.weekend.days;

  return { weekday, weekend, testingMode: Boolean(raw.testingMode) };
}

// Convert "HH:MM" to minutes since midnight. null -> null.
function toMin(t: Time): number | null {
  if (t == null) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// If no departure was tapped, the student stayed to the end of the day.
function effectiveOut(out: Time, dayEnd: string): number {
  const o = toMin(out);
  return o == null ? toMin(dayEnd)! : o;
}

/** The one scoring rule, used by both classes. */
export function scoreDay(checkIn: Time, checkOut: Time, rules: DayRules): Mark {
  const inM = toMin(checkIn);
  if (inM == null) return "A";                       // never came
  const outM = effectiveOut(checkOut, rules.dayEnd);
  if (inM > toMin(rules.graceEnd)!) return "L";      // arrived late
  if (outM >= toMin(rules.dayEnd)!) return "P";      // on time + stayed
  return "L";                                        // on time but left early
}

export function scoreWeekday(checkIn: Time, checkOut: Time, sc: ScheduleConfig = DEFAULT_SCHEDULE): Mark {
  return scoreDay(checkIn, checkOut, sc.weekday);
}

export function scoreWeekend(checkIn: Time, checkOut: Time, sc: ScheduleConfig = DEFAULT_SCHEDULE): Mark {
  return scoreDay(checkIn, checkOut, sc.weekend);
}

/** Marks for a session key ('single' = weekday, 'day' = weekend). */
export function scoreSession(session: string, checkIn: Time, checkOut: Time, sc: ScheduleConfig = DEFAULT_SCHEDULE): Mark {
  return session === "day" ? scoreWeekend(checkIn, checkOut, sc) : scoreWeekday(checkIn, checkOut, sc);
}

// ---- Check-in windows (the QR's opening hours) ----
// The database enforces these too; these are so a student sees an honest
// "opens at 9:45 AM" instead of a silent failure.

export function windowFor(session: string, sc: ScheduleConfig = DEFAULT_SCHEDULE): { open: string; close: string } | null {
  const r = session === "day" ? sc.weekend : session === "single" ? sc.weekday : null;
  return r ? { open: r.checkinOpen, close: r.checkinClose } : null;
}

/** Current wall-clock time in New York ("HH:MM"), whatever the device is set to. */
export function nowInNewYork(): string {
  return new Date().toLocaleTimeString("en-GB", {
    timeZone: "America/New_York",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function isCheckInOpen(
  session: string,
  now: string = nowInNewYork(),
  sc: ScheduleConfig = DEFAULT_SCHEDULE,
): boolean {
  if (sc.testingMode) return true;          // testing switch: always open
  const w = windowFor(session, sc);
  if (!w) return false;
  return now >= w.open && now <= w.close;   // "HH:MM" compares correctly as text
}