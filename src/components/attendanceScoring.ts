// attendanceScoring.ts
// Pure scoring engine for Lit & Learn attendance.
// Give it the tap times, it returns the marks. No UI, no side effects.
//
// Weekday: one session a day ("single").
// Weekend: two independent sessions, morning and afternoon, each with its
//          own mark — but the printed sheet collapses them to one arrival
//          and one departure.
//
// The schedule below is only the FALLBACK. The live one is stored in
// Supabase (attendance_settings, key 'schedule') and edited in the portal.

export type Mark = "P" | "L" | "A";

/** A time is "HH:MM" (24h) or null when nothing was recorded. */
export type Time = string | null;

export interface SessionRules {
  graceEnd: string;      // in by this -> on-time side; after -> L
  sessionEnd: string;    // must stay to this for P
  checkinOpen: string;   // QR accepted from
  checkinClose: string;  // QR accepted until
}

export interface WeekdayRules extends SessionRules {
  /** Which weekdays the class meets: 0=Sun … 6=Sat. */
  days: number[];
}

export interface WeekendRules {
  days: number[];
  morning: SessionRules;
  afternoon: SessionRules;
}

export interface ScheduleConfig {
  weekday: WeekdayRules;
  weekend: WeekendRules;
  /** Testing switch: when true the QR is accepted at any hour. */
  testingMode?: boolean;
}

export const DEFAULT_SCHEDULE: ScheduleConfig = {
  weekday: {
    graceEnd: "10:30", sessionEnd: "14:00",
    checkinOpen: "09:45", checkinClose: "12:00",
    days: [1, 2, 3, 4],                     // Mon–Thu
  },
  weekend: {
    days: [5, 6],                            // Fri–Sat
    morning:   { graceEnd: "09:30", sessionEnd: "12:00", checkinOpen: "08:45", checkinClose: "12:00" },
    afternoon: { graceEnd: "13:30", sessionEnd: "16:30", checkinOpen: "12:45", checkinClose: "16:30" },
  },
  testingMode: false,
};

/** Sessions a class runs each meeting day. */
export function sessionsOf(classType: "weekday" | "weekend"): string[] {
  return classType === "weekday" ? ["single"] : ["morning", "afternoon"];
}

/** Rules for one session key. */
export function rulesFor(session: string, sc: ScheduleConfig = DEFAULT_SCHEDULE): SessionRules {
  if (session === "morning") return sc.weekend.morning;
  if (session === "afternoon") return sc.weekend.afternoon;
  return sc.weekday;
}

/**
 * Fills anything missing from the defaults, and migrates older saved
 * shapes: the flat single-session weekend, and the original
 * weekendMorning / weekendAfternoon pair.
 */
export function normaliseSchedule(raw: any): ScheduleConfig {
  const d = DEFAULT_SCHEDULE;
  if (!raw || typeof raw !== "object") return d;

  // ---- weekday ----
  const rw = raw.weekday || {};
  const weekday: WeekdayRules = {
    graceEnd:     rw.graceEnd     ?? d.weekday.graceEnd,
    // older files called this dayEnd
    sessionEnd:   rw.sessionEnd   ?? rw.dayEnd ?? d.weekday.sessionEnd,
    checkinOpen:  rw.checkinOpen  ?? d.weekday.checkinOpen,
    checkinClose: rw.checkinClose ?? d.weekday.checkinClose,
    days: Array.isArray(rw.days) && rw.days.length ? rw.days : d.weekday.days,
  };

  // ---- weekend ----
  const rk = raw.weekend || {};
  const oldAM = raw.weekendMorning || {};
  const oldPM = raw.weekendAfternoon || {};
  const flat = rk.graceEnd || rk.dayEnd;      // the one-session weekend shape

  const morning: SessionRules = {
    graceEnd:     rk.morning?.graceEnd     ?? oldAM.graceEnd     ?? (flat ? rk.graceEnd : undefined) ?? d.weekend.morning.graceEnd,
    sessionEnd:   rk.morning?.sessionEnd   ?? oldAM.sessionEnd   ?? d.weekend.morning.sessionEnd,
    checkinOpen:  rk.morning?.checkinOpen  ?? oldAM.checkinOpen  ?? (flat ? rk.checkinOpen : undefined) ?? d.weekend.morning.checkinOpen,
    checkinClose: rk.morning?.checkinClose ?? oldAM.checkinClose ?? d.weekend.morning.checkinClose,
  };
  const afternoon: SessionRules = {
    graceEnd:     rk.afternoon?.graceEnd     ?? oldPM.graceEnd     ?? d.weekend.afternoon.graceEnd,
    sessionEnd:   rk.afternoon?.sessionEnd   ?? oldPM.sessionEnd   ?? (flat ? (rk.dayEnd ?? rk.sessionEnd) : undefined) ?? d.weekend.afternoon.sessionEnd,
    checkinOpen:  rk.afternoon?.checkinOpen  ?? oldPM.checkinOpen  ?? d.weekend.afternoon.checkinOpen,
    checkinClose: rk.afternoon?.checkinClose ?? oldPM.checkinClose ?? (flat ? rk.checkinClose : undefined) ?? d.weekend.afternoon.checkinClose,
  };

  const weekend: WeekendRules = {
    days: Array.isArray(rk.days) && rk.days.length ? rk.days : d.weekend.days,
    morning, afternoon,
  };

  return { weekday, weekend, testingMode: Boolean(raw.testingMode) };
}

// Convert "HH:MM" to minutes since midnight. null -> null.
function toMin(t: Time): number | null {
  if (t == null) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// No recorded departure means the student stayed to the end of the session.
function effectiveOut(out: Time, sessionEnd: string): number {
  const o = toMin(out);
  return o == null ? toMin(sessionEnd)! : o;
}

/** The one rule, applied to whichever session's times you pass in. */
export function scoreDay(checkIn: Time, checkOut: Time, r: SessionRules): Mark {
  const inM = toMin(checkIn);
  if (inM == null) return "A";                       // never came
  const outM = effectiveOut(checkOut, r.sessionEnd);
  if (inM > toMin(r.graceEnd)!) return "L";          // arrived late
  if (outM >= toMin(r.sessionEnd)!) return "P";      // on time + stayed
  return "L";                                         // on time but left early
}

export function scoreSession(
  session: string, checkIn: Time, checkOut: Time, sc: ScheduleConfig = DEFAULT_SCHEDULE,
): Mark {
  return scoreDay(checkIn, checkOut, rulesFor(session, sc));
}

export function scoreWeekday(checkIn: Time, checkOut: Time, sc: ScheduleConfig = DEFAULT_SCHEDULE): Mark {
  return scoreDay(checkIn, checkOut, sc.weekday);
}

// ---- Check-in windows (the QR's opening hours) ----

export function windowFor(session: string, sc: ScheduleConfig = DEFAULT_SCHEDULE): { open: string; close: string } | null {
  const r = rulesFor(session, sc);
  return r ? { open: r.checkinOpen, close: r.checkinClose } : null;
}

/** Current wall-clock time in New York ("HH:MM"), whatever the device is set to. */
export function nowInNewYork(): string {
  return new Date().toLocaleTimeString("en-GB", {
    timeZone: "America/New_York", hour12: false, hour: "2-digit", minute: "2-digit",
  });
}

export function isCheckInOpen(
  session: string, now: string = nowInNewYork(), sc: ScheduleConfig = DEFAULT_SCHEDULE,
): boolean {
  if (sc.testingMode) return true;
  const w = windowFor(session, sc);
  if (!w) return false;
  return now >= w.open && now <= w.close;
}

/** Which weekend session a moment belongs to. */
export function weekendSessionAt(now: string = nowInNewYork(), sc: ScheduleConfig = DEFAULT_SCHEDULE): string {
  return now < sc.weekend.morning.sessionEnd ? "morning" : "afternoon";
}

/** Every date the class meets between two YYYY-MM-DD dates, inclusive. */
export function meetingDays(startISO: string, endISO: string, days: number[]): string[] {
  if (!startISO || !endISO || startISO > endISO) return [];
  const meets = days && days.length ? days : [1, 2, 3, 4];
  const out: string[] = [];
  const d = new Date(`${startISO}T12:00:00`);
  const end = new Date(`${endISO}T12:00:00`);
  while (d <= end) {
    if (meets.includes(d.getDay())) out.push(d.toLocaleDateString("en-CA"));
    d.setDate(d.getDate() + 1);
  }
  return out;
}