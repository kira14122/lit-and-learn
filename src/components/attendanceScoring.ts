// attendanceScoring.ts
// Pure scoring engine for Lit & Learn attendance.
// Give it the tap times, it returns the marks. No UI, no side effects.
//
// All timing is data, not code: the schedule below is only the FALLBACK.
// The live schedule is stored in Supabase (attendance_settings, key
// 'schedule') and edited from the Attendance portal, so class times and
// check-in hours can change without touching this file or the SQL.

export type Mark = "P" | "L" | "A";

// A time is either "HH:MM" (24h) or null (no tap recorded).
export type Time = string | null;

export interface ScheduleConfig {
  weekday: {
    graceEnd: string;      // in by this -> on-time side; after -> L
    dayEnd: string;        // must stay to this for P
    checkinOpen: string;   // QR accepted from
    checkinClose: string;  // QR accepted until
  };
  weekendMorning: {
    graceEnd: string;      // in by this -> P band
    lateCutoff: string;    // arrival after this -> A
    sessionEnd: string;    // break; "stayed to end" means reaching this
    minMinutes: number;    // present under this -> A
    checkinOpen: string;
    checkinClose: string;
  };
  weekendAfternoon: {
    graceEnd: string;      // back by this -> P band
    sessionEnd: string;    // must stay to this for P
    checkinOpen: string;
    checkinClose: string;
  };
  /** Testing switch: when true the QR is accepted at any hour. */
  testingMode?: boolean;
}

export const DEFAULT_SCHEDULE: ScheduleConfig = {
  weekday: {
    graceEnd: "10:30",
    dayEnd: "14:00",
    checkinOpen: "09:45",
    checkinClose: "12:00",
  },
  weekendMorning: {
    graceEnd: "09:30",
    lateCutoff: "11:00",
    sessionEnd: "12:00",
    minMinutes: 60,
    checkinOpen: "08:45",
    checkinClose: "12:00",
  },
  weekendAfternoon: {
    graceEnd: "13:30",
    sessionEnd: "16:30",
    checkinOpen: "12:45",
    checkinClose: "16:30",
  },
  testingMode: false,
};

/** Fills any missing field from the defaults, so a partial saved schedule can never break scoring. */
export function normaliseSchedule(raw: any): ScheduleConfig {
  const d = DEFAULT_SCHEDULE;
  if (!raw || typeof raw !== "object") return d;
  return {
    weekday: { ...d.weekday, ...(raw.weekday || {}) },
    weekendMorning: { ...d.weekendMorning, ...(raw.weekendMorning || {}) },
    weekendAfternoon: { ...d.weekendAfternoon, ...(raw.weekendAfternoon || {}) },
    testingMode: Boolean(raw.testingMode),
  };
}

// Convert "HH:MM" to minutes since midnight. null -> null.
function toMin(t: Time): number | null {
  if (t == null) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// If no check-out was tapped, the student stayed to the session end.
function effectiveOut(out: Time, sessionEnd: string): number {
  const o = toMin(out);
  return o == null ? toMin(sessionEnd)! : o;
}

// ---- Weekday morning class: one mark ----
export function scoreWeekday(checkIn: Time, checkOut: Time, sc: ScheduleConfig = DEFAULT_SCHEDULE): Mark {
  const inM = toMin(checkIn);
  if (inM == null) return "A";                          // never came
  const cfg = sc.weekday;
  const outM = effectiveOut(checkOut, cfg.dayEnd);
  if (inM > toMin(cfg.graceEnd)!) return "L";           // arrived late
  if (outM >= toMin(cfg.dayEnd)!) return "P";           // on time + stayed
  return "L";                                           // on time but left early
}

// ---- Weekend morning session ----
export function scoreWeekendMorning(checkIn: Time, checkOut: Time, sc: ScheduleConfig = DEFAULT_SCHEDULE): Mark {
  const inM = toMin(checkIn);
  if (inM == null) return "A";                          // never came
  const cfg = sc.weekendMorning;
  if (inM > toMin(cfg.lateCutoff)!) return "A";         // arrived after the cutoff
  const outM = effectiveOut(checkOut, cfg.sessionEnd);
  if (outM - inM < cfg.minMinutes) return "A";          // present under the minimum
  if (inM <= toMin(cfg.graceEnd)! && outM >= toMin(cfg.sessionEnd)!) return "P";
  return "L";
}

// ---- Weekend afternoon session ----
export function scoreWeekendAfternoon(checkIn: Time, checkOut: Time, sc: ScheduleConfig = DEFAULT_SCHEDULE): Mark {
  const inM = toMin(checkIn);
  if (inM == null) return "A";                          // never came back after lunch
  const cfg = sc.weekendAfternoon;
  if (inM > toMin(cfg.graceEnd)!) return "L";           // back late -> L regardless
  const outM = effectiveOut(checkOut, cfg.sessionEnd);
  if (outM >= toMin(cfg.sessionEnd)!) return "P";
  return "L";                                           // back on time but left early
}

export interface WeekendMarks { morning: Mark; afternoon: Mark; }

export function scoreWeekend(
  morningIn: Time, morningOut: Time,
  afternoonIn: Time, afternoonOut: Time,
  sc: ScheduleConfig = DEFAULT_SCHEDULE,
): WeekendMarks {
  return {
    morning: scoreWeekendMorning(morningIn, morningOut, sc),
    afternoon: scoreWeekendAfternoon(afternoonIn, afternoonOut, sc),
  };
}

// ---- Check-in windows (the QR's opening hours) ----
// The database enforces these too; these are so a student sees an honest
// "opens at 9:45 AM" instead of a silent failure.

export function windowFor(session: string, sc: ScheduleConfig = DEFAULT_SCHEDULE): { open: string; close: string } | null {
  if (session === "single") return { open: sc.weekday.checkinOpen, close: sc.weekday.checkinClose };
  if (session === "morning") return { open: sc.weekendMorning.checkinOpen, close: sc.weekendMorning.checkinClose };
  if (session === "afternoon") return { open: sc.weekendAfternoon.checkinOpen, close: sc.weekendAfternoon.checkinClose };
  return null;
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