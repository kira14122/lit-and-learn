// attendanceScoring.ts
// Pure scoring engine for Lit & Learn attendance.
// Give it the tap times, it returns the marks. No UI, no side effects.

export type Mark = "P" | "L" | "A";

// A time is either "HH:MM" (24h) or null (no tap recorded).
export type Time = string | null;

// Convert "HH:MM" to minutes since midnight. null -> null.
function toMin(t: Time): number | null {
  if (t == null) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// ---- Schedule config (all timing lives here) ----
export const SCHEDULE = {
  weekday: {
    graceEnd: "10:30", // in by this -> on-time side; after -> L
    dayEnd: "14:00",   // must stay to this for P
  },
  weekend: {
    morning: {
      graceEnd: "09:30",   // in by this -> P band
      lateCutoff: "11:00", // arrival after this -> A
      sessionEnd: "12:00", // break; "stayed to end" means reaching this
      minMinutes: 60,      // present under this -> A
    },
    afternoon: {
      graceEnd: "13:30",   // back by this -> P band (1:00 restart + 30m grace)
      sessionEnd: "16:30", // must stay to this for P
    },
  },
} as const;

// If no check-out was tapped, the student stayed to the session end.
function effectiveOut(out: Time, sessionEnd: string): number {
  const o = toMin(out);
  return o == null ? toMin(sessionEnd)! : o;
}

// ---- Weekday morning class: one mark ----
export function scoreWeekday(checkIn: Time, checkOut: Time): Mark {
  const inM = toMin(checkIn);
  if (inM == null) return "A";                         // never came
  const cfg = SCHEDULE.weekday;
  const outM = effectiveOut(checkOut, cfg.dayEnd);
  if (inM > toMin(cfg.graceEnd)!) return "L";          // arrived late
  if (outM >= toMin(cfg.dayEnd)!) return "P";          // on time + stayed
  return "L";                                          // on time but left early
}

// ---- Weekend morning session ----
export function scoreWeekendMorning(checkIn: Time, checkOut: Time): Mark {
  const inM = toMin(checkIn);
  if (inM == null) return "A";                         // never came
  const cfg = SCHEDULE.weekend.morning;
  if (inM > toMin(cfg.lateCutoff)!) return "A";        // arrived after 11:00
  const outM = effectiveOut(checkOut, cfg.sessionEnd);
  if (outM - inM < cfg.minMinutes) return "A";         // present under an hour
  if (inM <= toMin(cfg.graceEnd)! && outM >= toMin(cfg.sessionEnd)!) return "P";
  return "L";                                          // present >=1h but not full P
}

// ---- Weekend afternoon session ----
export function scoreWeekendAfternoon(checkIn: Time, checkOut: Time): Mark {
  const inM = toMin(checkIn);
  if (inM == null) return "A";                         // never came back after lunch
  const cfg = SCHEDULE.weekend.afternoon;
  if (inM > toMin(cfg.graceEnd)!) return "L";          // back after 1:30 -> L always
  const outM = effectiveOut(checkOut, cfg.sessionEnd);
  if (outM >= toMin(cfg.sessionEnd)!) return "P";      // back on time + stayed
  return "L";                                          // back on time but left early
}

export interface WeekendMarks { morning: Mark; afternoon: Mark; }

export function scoreWeekend(
  morningIn: Time, morningOut: Time,
  afternoonIn: Time, afternoonOut: Time,
): WeekendMarks {
  return {
    morning: scoreWeekendMorning(morningIn, morningOut),
    afternoon: scoreWeekendAfternoon(afternoonIn, afternoonOut),
  };
}

// ---- Check-in windows (public page) ----
// Must match attendance_window_open() in attendance_setup.sql.
// The database is the authority; these are for showing students
// an honest "opens at 9:45" message instead of a silent failure.
export const CHECKIN_WINDOWS: Record<string, { open: string; close: string }> = {
  single:    { open: "09:45", close: "12:00" }, // weekday: arrivals accepted until noon
  morning:   { open: "08:45", close: "12:00" }, // weekend AM 9:00-12:00
  afternoon: { open: "12:45", close: "16:30" }, // weekend PM 1:00-4:30
};

// Current wall-clock time in New York ("HH:MM"), whatever the device
// timezone is set to.
export function nowInNewYork(): string {
  return new Date().toLocaleTimeString("en-GB", {
    timeZone: "America/New_York",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function isCheckInOpen(session: string, now: string = nowInNewYork()): boolean {
  const w = CHECKIN_WINDOWS[session];
  if (!w) return false;
  return now >= w.open && now <= w.close;   // "HH:MM" compares correctly as text
}

// ---- Location check (public page) ----
// Mirrors attendance_within_school() in attendance_setup.sql. The
// database is the authority; this is so a student sees "you are too far
// from school" instead of a silent failure.

export type LocationMode = 'flag' | 'block';
export interface SchoolLocation {
  lat: number;
  lng: number;
  radius_m: number;
  /** 'flag' (default) never blocks; 'block' refuses distant check-ins. */
  mode?: LocationMode;
}

/** Distance between two coordinates, in metres. */
export function distanceMeters(
  lat1: number, lng1: number, lat2: number, lng2: number,
): number {
  const R = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

/** True if this position is inside the school radius. */
export function isAtSchool(
  school: SchoolLocation | null,
  lat: number | null,
  lng: number | null,
): boolean {
  if (!school) return true;            // not configured yet -> don't lock anyone out
  if (lat == null || lng == null) return false;
  return distanceMeters(lat, lng, school.lat, school.lng) <= school.radius_m;
}

/** Whether the page should stop this check-in. Flag mode never stops it. */
export function shouldBlockCheckIn(
  school: SchoolLocation | null,
  lat: number | null,
  lng: number | null,
): boolean {
  if (!school || (school.mode ?? 'flag') === 'flag') return false;
  return !isAtSchool(school, lat, lng);
}

/** Metres from school, or null if unknown. Used for the teacher's warning. */
export function distanceFromSchool(
  school: SchoolLocation | null,
  lat: number | null | undefined,
  lng: number | null | undefined,
): number | null {
  if (!school || lat == null || lng == null) return null;
  return distanceMeters(lat, lng, school.lat, school.lng);
}