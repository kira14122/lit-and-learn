import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { getSupabaseClient } from '../supabaseClient';
import {
  scoreSession, meetingDays, sessionsOf, rulesFor, type Mark,
  type ScheduleConfig, DEFAULT_SCHEDULE, normaliseSchedule,
} from './attendanceScoring';

// Attendance.
// One toolbar. One real table. One control language:
//  - segmented controls for switching (class, view)
//  - 40px-high controls everywhere
//  - indigo = primary action, grey = secondary, red = destructive
// Two classes: Level 4 Morning and Level 4 Weekend. Both are one group
// each, with S1/S2 carried as a label per student.

interface ClassDef { id: string; title: string; classType: 'weekday' | 'weekend'; hasSections: boolean; tag: string; }
const CLASSES: ClassDef[] = [
  { id: 'am', title: 'Level 4 · Morning', classType: 'weekday', hasSections: true, tag: 'AM' },
  { id: 'wk', title: 'Level 4 · Weekend', classType: 'weekend', hasSections: true, tag: 'WKD' },
];

interface Student { id: string; name: string; section: number; joined?: string; enrolledFrom?: string; }
interface Log { id: string; student_id: string; session: string; check_in: string | null; check_out: string | null; na?: boolean; }

const C = {
  ink: '#0F172A', sub: '#64748B', faint: '#94A3B8',
  line: '#E2E8F0', lineSoft: '#F1F5F9', bgSoft: '#F8FAFC',
  indigo: '#4F46E5', indigoSoft: '#EEF2FF',
  green: '#059669', greenSoft: '#ECFDF5',
  amber: '#B45309', amberSoft: '#FFFBEB',
  red: '#DC2626', redSoft: '#FEF2F2',
};

const DEFAULTS = { instructor: 'Dr. Chouit Abderraouf', term: 'Summer Term 2026', level: '4' };
const remembered = (k: string, f: string) => { try { return localStorage.getItem(`ll_att_${k}`) || f; } catch { return f; } };
const remember = (k: string, v: string) => { try { localStorage.setItem(`ll_att_${k}`, v); } catch { /* ignore */ } };

const sessionEndOf = (sc: ScheduleConfig, se: string): string => rulesFor(se, sc).sessionEnd;
const todayLocal = () => new Date().toLocaleDateString('en-CA');
const nowHM = () => new Date().toLocaleTimeString('en-GB', { timeZone: 'America/New_York', hour12: false, hour: '2-digit', minute: '2-digit' });
const toHM = (iso: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  let h = d.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${String(d.getMinutes()).padStart(2, '0')} ${ampm}`;
};
// 24h "HH:MM" for <input type="time"> values, which require it.
const toHM24 = (iso: string | null): string => iso ? `${String(new Date(iso).getHours()).padStart(2, '0')}:${String(new Date(iso).getMinutes()).padStart(2, '0')}` : '';
const hm24To12 = (hm: string): string => {
  if (!hm) return '';
  const [H, M] = hm.split(':').map(Number);
  const ampm = H >= 12 ? 'PM' : 'AM';
  return `${H % 12 || 12}:${String(M).padStart(2, '0')} ${ampm}`;
};
const hmToIso = (date: string, hm: string): string => new Date(`${date}T${hm}:00`).toISOString();

// ---------- the control language ----------
const ui: Record<string, any> = {
  wrap: { fontFamily: '"Fredoka", sans-serif', color: C.ink },

  // every control is 40px tall
  seg: { display: 'inline-flex', background: C.bgSoft, border: `1px solid ${C.line}`, borderRadius: 12, padding: 3, height: 40, boxSizing: 'border-box' as const },
  segBtn: (a: boolean) => ({
    fontFamily: 'inherit', cursor: 'pointer', border: 'none', borderRadius: 9,
    padding: '0 16px', fontWeight: 600, fontSize: '0.9rem', height: 32, margin: 'auto 0',
    background: a ? '#fff' : 'transparent', color: a ? C.ink : C.faint,
    boxShadow: a ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.12s',
  }),
  primary: { fontFamily: 'inherit', cursor: 'pointer', background: C.indigo, color: '#fff', border: 'none', borderRadius: 12, padding: '0 18px', height: 40, fontWeight: 600, fontSize: '0.9rem' },
  secondary: { fontFamily: 'inherit', cursor: 'pointer', background: '#fff', color: C.sub, border: `1px solid ${C.line}`, borderRadius: 12, padding: '0 16px', height: 40, fontWeight: 600, fontSize: '0.9rem' },
  input: { fontFamily: 'inherit', border: `1px solid ${C.line}`, borderRadius: 12, padding: '0 14px', height: 40, fontSize: '0.9rem', color: C.ink, background: '#fff', boxSizing: 'border-box' as const },

  // small in-table controls, all 30px
  tBtn: { fontFamily: 'inherit', cursor: 'pointer', background: '#fff', color: C.sub, border: `1px solid ${C.line}`, borderRadius: 9, padding: '0 12px', height: 30, fontWeight: 600, fontSize: '0.82rem' },
  tDanger: { fontFamily: 'inherit', cursor: 'pointer', background: '#fff', color: C.red, border: `1px solid #FECACA`, borderRadius: 9, padding: '0 12px', height: 30, fontWeight: 600, fontSize: '0.82rem' },
  tInput: { fontFamily: 'inherit', border: `1px solid ${C.line}`, borderRadius: 9, padding: '0 6px', height: 30, width: 118, fontSize: '0.82rem', color: C.ink, background: '#fff', boxSizing: 'border-box' as const },

  chip: (m: Mark) => {
    const c = m === 'P' ? [C.greenSoft, C.green] : m === 'L' ? [C.amberSoft, C.amber] : [C.redSoft, C.red];
    return { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, background: c[0], color: c[1], borderRadius: 9, fontWeight: 700, fontSize: '0.85rem' };
  },
  sTag: { display: 'inline-block', background: C.bgSoft, border: `1px solid ${C.lineSoft}`, color: C.faint, borderRadius: 6, padding: '1px 7px', fontSize: '0.72rem', fontWeight: 700 },

  table: { background: '#fff', border: `1px solid ${C.lineSoft}`, borderRadius: 16, overflowX: 'auto' as const },
  thead: { display: 'grid', padding: '0 18px', height: 40, alignItems: 'center', background: C.bgSoft, borderBottom: `1px solid ${C.lineSoft}`, fontSize: '0.72rem', textTransform: 'uppercase' as const, letterSpacing: '0.7px', color: C.faint, fontWeight: 700 },
  tr: { display: 'grid', padding: '0 18px', minHeight: 52, alignItems: 'center', borderBottom: `1px solid ${C.lineSoft}` },
  mono: { fontVariantNumeric: 'tabular-nums', color: C.sub, fontSize: '0.9rem' },

  // page header + tabs
  page: { maxWidth: 1080, margin: '0 auto' },
  kicker: { fontSize: '0.72rem', textTransform: 'uppercase' as const, letterSpacing: '0.7px', color: C.faint, fontWeight: 700, marginBottom: 4 },
  h1: { fontSize: '1.35rem', fontWeight: 600, letterSpacing: '-0.3px', margin: 0 },
  tabRow: { display: 'flex', gap: 22, borderBottom: `1px solid ${C.line}`, marginBottom: 16 },
  tab: (a: boolean) => ({
    fontFamily: 'inherit', cursor: 'pointer', background: 'none', border: 'none',
    padding: '10px 2px', fontSize: '0.95rem', fontWeight: 600,
    color: a ? C.ink : C.faint,
    borderBottom: a ? `2px solid ${C.indigo}` : '2px solid transparent',
    marginBottom: -1,
  }),
  iconBtn: { fontFamily: 'inherit', cursor: 'pointer', background: '#fff', color: C.sub, border: `1px solid ${C.line}`, borderRadius: 10, width: 38, height: 38, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' },
  addCard: { background: C.bgSoft, borderRadius: 14, padding: 14, marginBottom: 16 },
  segSm: { display: 'inline-flex', border: `1px solid ${C.line}`, borderRadius: 8, overflow: 'hidden', height: 28 },
  segSmBtn: (a: boolean) => ({
    fontFamily: 'inherit', cursor: 'pointer', border: 'none', padding: '0 10px', height: 26,
    fontWeight: 600, fontSize: '0.78rem',
    background: a ? C.indigoSoft : '#fff', color: a ? C.indigo : C.faint,
  }),
};

// ---------- one session's cell: the mark, the two times, the clear ----------
// Session and TimeCell live out here on purpose. A component declared inside
// another component gets a fresh identity on every render, so React throws the
// old one away and builds it again — which is why a time box being typed into
// used to lose what was in it.

interface SessionCtx {
  logs: Record<string, Log>;
  markFor: (studentId: string, session: string) => Mark;
  setTime: (log: Log, field: 'check_in' | 'check_out', hm: string) => void;
  setPendingClear: (v: { log: Log; name: string; at: string } | null) => void;
  setPendingIn: (v: { studentId: string; name: string; session: string } | null) => void;
  beginEdit: () => void;
  endEdit: () => void;
}

// A time box that belongs to whoever is typing in it. It holds its own draft
// while focused and writes once, on the way out — so a background refresh can
// never pull a half-typed time out from under you.
function TimeCell({ value, allowBlank, title, onCommit, beginEdit, endEdit }: {
  value: string;
  allowBlank: boolean;
  title: string;
  onCommit: (hm: string) => void;
  beginEdit: () => void;
  endEdit: () => void;
}) {
  const [draft, setDraft] = useState(value);
  const focused = useRef(false);
  // Follow the saved value only while the box is idle.
  useEffect(() => { if (!focused.current) setDraft(value); }, [value]);

  return (
    <input
      type="time" style={ui.tInput} value={draft} title={title}
      onFocus={() => { focused.current = true; beginEdit(); }}
      onChange={e => setDraft(e.target.value)}
      onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
      onBlur={() => {
        focused.current = false;
        endEdit();
        // An arrival cannot be blanked — use Clear for that.
        if (!draft && !allowBlank) { setDraft(value); return; }
        if (draft !== value) onCommit(draft);
      }}
    />
  );
}

function Session({ stu, se, ctx }: { stu: Student; se: string; ctx: SessionCtx }) {
  const l = ctx.logs[`${stu.id}:${se}`];

  // Not applicable: shown plainly, counted nowhere.
  if (l?.na) {
    return (
      <>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          minWidth: 30, height: 30, borderRadius: 9, background: C.bgSoft,
          border: `1px solid ${C.line}`, color: C.faint, fontWeight: 700, fontSize: '0.72rem',
        }}>N/A</span>
        <span style={{ gridColumn: 'span 2', color: C.faint, fontSize: '0.85rem' }}>not counted</span>
        <button style={ui.tBtn} onClick={() => ctx.setPendingClear({ log: l, name: stu.name, at: 'N/A' })}>Undo</button>
      </>
    );
  }

  const mark = ctx.markFor(stu.id, se);
  return (
    <>
      <span style={ui.chip(mark)}>{mark}</span>
      {l ? (
        <>
          <TimeCell
            value={toHM24(l.check_in)} allowBlank={false}
            title="Arrival time — edit if a student forgot to scan and you know when they arrived"
            beginEdit={ctx.beginEdit} endEdit={ctx.endEdit}
            onCommit={hm => ctx.setTime(l, 'check_in', hm)}
          />
          <TimeCell
            value={toHM24(l.check_out)} allowBlank
            title="Blank = stayed to the end"
            beginEdit={ctx.beginEdit} endEdit={ctx.endEdit}
            onCommit={hm => ctx.setTime(l, 'check_out', hm)}
          />
          <button
            style={ui.tDanger}
            onClick={() => ctx.setPendingClear({ log: l, name: stu.name, at: toHM(l.check_in) })}
            title="Remove today's check-in — the student goes back to A and drops off the sheet"
          >Clear</button>
        </>
      ) : (
        <>
          <span style={{ gridColumn: 'span 2' }}>
            <button style={ui.tBtn} onClick={() => ctx.setPendingIn({ studentId: stu.id, name: stu.name, session: se })}>Check in now</button>
          </span>
          <span />
        </>
      )}
    </>
  );
}

export function AttendancePortal() {
  const { getToken } = useAuth();
  const [classId, setClassId] = useState('am');
  const cls = CLASSES.find(c => c.id === classId)!;
  const [view, setView] = useState<'today' | 'manage' | 'records'>('today');
  const monthStart = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toLocaleDateString('en-CA'); };
  const [rStart, setRStart] = useState<string>(monthStart());
  const [rEnd, setREnd] = useState<string>(todayLocal());
  const [rLogs, setRLogs] = useState<any[]>([]);
  const [rLoading, setRLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [date, setDate] = useState(todayLocal());
  const [allStudents, setAllStudents] = useState<Record<string, Student[]>>({});
  const [logs, setLogs] = useState<Record<string, Log>>({});
  const [newName, setNewName] = useState('');
  const [newSection, setNewSection] = useState<1 | 2>(1);
  const [showBulk, setShowBulk] = useState(false);
  const [query, setQuery] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [bulkBusy, setBulkBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Student | null>(null);
  const [pendingClear, setPendingClear] = useState<{ log: Log; name: string; at: string } | null>(null);
  const [pendingIn, setPendingIn] = useState<{ studentId: string; name: string; session: string } | null>(null);
  const [pendingClearVisitors, setPendingClearVisitors] = useState(false);
  const [editVisitor, setEditVisitor] = useState<{ id: string; name: string; level: string; section: string } | null>(null);
  const [pendingRemoveVisitor, setPendingRemoveVisitor] = useState<{ id: string; name: string } | null>(null);
  const [promoteVisitor, setPromoteVisitor] = useState<{ id: string; name: string; section: string } | null>(null);
  // Make-ups are taught by another teacher; here we only record that a
  // student attended one, so their percentage is right.
  const [makeupFor, setMakeupFor] = useState<{ id: string; name: string } | null>(null);
  const [makeupDate, setMakeupDate] = useState(todayLocal());
  const [makeupRows, setMakeupRows] = useState<any[]>([]);
  const [makeupMsg, setMakeupMsg] = useState('');

  const [instructor, setInstructor] = useState(() => remembered('instructor', DEFAULTS.instructor));
  const [term, setTerm] = useState(() => remembered('term', DEFAULTS.term));
  const [level, setLevel] = useState(() => remembered('level', DEFAULTS.level));
  const [blankTimeOut, setBlankTimeOut] = useState(() => remembered('blankout', '') === '1');
  useEffect(() => { remember('instructor', instructor); }, [instructor]);
  useEffect(() => { remember('term', term); }, [term]);
  useEffect(() => { remember('level', level); }, [level]);
  useEffect(() => { remember('blankout', blankTimeOut ? '1' : ''); }, [blankTimeOut]);
  const [codeOn, setCodeOn] = useState(false);
  const [visitorMode, setVisitorMode] = useState(false);
  const [visitors, setVisitors] = useState<any[]>([]);
  // The school calendar: when the term runs, and every day the class is closed.
  interface Closure { from: string; to: string; label: string; }
  const [termStart, setTermStart] = useState('');
  const [termEnd, setTermEnd] = useState('');
  const [closures, setClosures] = useState<Closure[]>([]);
  const [newClosure, setNewClosure] = useState<Closure>({ from: '', to: '', label: '' });
  const [schedule, setSchedule] = useState<ScheduleConfig>(DEFAULT_SCHEDULE);
  const [schedDraft, setSchedDraft] = useState<ScheduleConfig>(DEFAULT_SCHEDULE);
  const [schedMsg, setSchedMsg] = useState('');

  const authed = useCallback(async () => getSupabaseClient((await getToken({ template: 'supabase' })) ?? undefined), [getToken]);
  const sessionsFor = (c: ClassDef): string[] => sessionsOf(c.classType);

  // How many time boxes are open right now. Above zero, the background
  // refresh stands down.
  const editCount = useRef(0);
  const beginEdit = useCallback(() => { editCount.current += 1; }, []);
  const endEdit = useCallback(() => { editCount.current = Math.max(0, editCount.current - 1); }, []);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    const sb = await authed();
    const { data: roster } = await sb
      .from('attendance_students')
      .select('id, name, section, class_type, created_at, enrolled_from')
      .eq('active', true)
      .order('name', { ascending: true });
    const byClass: Record<string, Student[]> = {};
    CLASSES.forEach(c => {
      byClass[c.id] = (roster || [])
        .filter((r: any) => r.class_type === c.classType)
        .map((r: any) => ({
          id: r.id, name: r.name, section: r.section ?? 1,
          joined: r.created_at ? new Date(r.created_at).toLocaleDateString('en-CA') : undefined,
          enrolledFrom: r.enrolled_from || undefined,
        }));
    });
    const { data: logRows } = await sb
      .from('attendance_logs')
      .select('id, student_id, session, check_in, check_out, na')
      .eq('log_date', date);
    const map: Record<string, Log> = {};
    (logRows || []).forEach((l: any) => { map[`${l.student_id}:${l.session}`] = l; });
    const { data: secretRow } = await sb.from('attendance_settings').select('value').eq('key', 'checkin_secret').maybeSingle();
    setCodeOn(Boolean((secretRow?.value as any)?.enabled));

    const { data: schedRow } = await sb.from('attendance_settings').select('value').eq('key', 'schedule').maybeSingle();
    const sc = normaliseSchedule(schedRow?.value);
    setSchedule(sc);
    setSchedDraft(sc);

    const { data: muRows } = await sb.from('attendance_logs')
      .select('id, student_id, log_date')
      .eq('session', 'makeup')
      .order('log_date', { ascending: true });
    setMakeupRows(muRows || []);

    const { data: calRow } = await sb.from('attendance_settings').select('value').eq('key', 'calendar').maybeSingle();
    const cal = (calRow?.value as any) || {};
    setTermStart(cal.termStart || '');
    setTermEnd(cal.termEnd || '');

    // Absorb the older single-date list, if this project still has one.
    const { data: ncRow } = await sb.from('attendance_settings').select('value').eq('key', 'no_class_days').maybeSingle();
    const legacy = (((ncRow?.value as any)?.dates as string[]) || []).map(d => ({ from: d, to: d, label: 'No class' }));
    const saved: Closure[] = Array.isArray(cal.closures) ? cal.closures : [];
    const merged = [...saved];
    legacy.forEach(l => { if (!merged.some(c => c.from === l.from && c.to === l.to)) merged.push(l); });
    setClosures(merged.sort((a, b) => a.from.localeCompare(b.from)));

    const { data: vmRow } = await sb.from('attendance_settings').select('value').eq('key', 'visitor_mode').maybeSingle();
    setVisitorMode(Boolean((vmRow?.value as any)?.enabled));

    // Today's walk-in visitors for the class currently being viewed.
    const { data: vRows } = await sb.from('attendance_students')
      .select('id, name, visitor_level, visitor_date, visitor_class')
      .eq('class_type', 'visitor').eq('active', true).eq('visitor_date', date)
      .order('name', { ascending: true });
    // Older visitor rows have no visitor_class; treat those as weekday.
    setVisitors((vRows || []).filter((v: any) => (v.visitor_class || 'weekday') === cls.classType));
    setAllStudents(byClass);
    setLogs(map);
    if (!quiet) setLoading(false);
  }, [authed, date, classId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (date !== todayLocal()) return;
    // Hold the refresh while a time box is open — refreshing mid-edit is what
    // used to make a typed time snap back to its old value.
    const t = setInterval(() => { if (editCount.current === 0) load(true); }, 12000);
    return () => clearInterval(t);
  }, [date, load]);

  const allForClass = allStudents[classId] || [];
  const students = query.trim()
    ? allForClass.filter(s0 => s0.name.toLowerCase().includes(query.trim().toLowerCase()))
    : allForClass;
  const sess = sessionsFor(cls);
  const primarySession = cls.classType === 'weekday'
    ? 'single'
    : (nowHM() < schedule.weekend.morning.sessionEnd ? 'morning' : 'afternoon');
  // "Checked in" means present today: for the weekend that is either
  // session, so the count does not drop to zero after midday.
  const inCount = allForClass.filter(s =>
    sess.some(se => logs[`${s.id}:${se}`]?.check_in)).length;

  // ---- actions ----
  const addStudent = async () => {
    const name = newName.trim();
    if (!name) return;
    const sb = await authed();
    await sb.from('attendance_students').insert({ name, class_type: cls.classType, section: cls.hasSections ? newSection : 1, active: true });
    setNewName('');
    load(true);
  };
  // Paste a whole class at once: one name per line.
  const addBulk = async () => {
    const names = bulkText.split('\n').map(n => n.trim()).filter(Boolean);
    if (!names.length || bulkBusy) return;
    setBulkBusy(true);
    const sb = await authed();
    await sb.from('attendance_students').insert(
      names.map(name => ({ name, class_type: cls.classType, section: cls.hasSections ? newSection : 1, active: true })),
    );
    setBulkText(''); setShowBulk(false); setBulkBusy(false);
    load(true);
  };

  const saveName = async (id: string) => {
    const name = editName.trim();
    if (!name) { setEditingId(null); return; }
    const sb = await authed();
    await sb.from('attendance_students').update({ name }).eq('id', id);
    setEditingId(null);
    load(true);
  };
  // The first day a student is accountable. Blank = counted from the start.
  const addMakeup = async () => {
    if (!makeupFor || !makeupDate) return;
    const sb = await authed();
    const { error } = await sb.from('attendance_logs').insert({
      student_id: makeupFor.id, session: 'makeup',
      log_date: makeupDate, check_in: hmToIso(makeupDate, '14:45'),
    });
    if (error) {
      // One make-up per student per date: the database enforces it.
      setMakeupMsg(error.code === '23505'
        ? 'A make-up is already recorded for that date.'
        : `Could not save: ${error.message}`);
      return;
    }
    setMakeupMsg('');
    load(true);
  };
  const removeMakeup = async (logId: string) => {
    const sb = await authed();
    await sb.from('attendance_logs').delete().eq('id', logId);
    load(true);
  };
  const makeupsOf = (studentId: string) => makeupRows.filter(m => m.student_id === studentId);

  const setEnrolledFrom = async (id: string, d: string) => {
    const sb = await authed();
    await sb.from('attendance_students').update({ enrolled_from: d || null }).eq('id', id);
    load(true);
  };

  const moveToSection = async (id: string, section: number) => {
    const sb = await authed();
    await sb.from('attendance_students').update({ section }).eq('id', id);
    load(true);
  };
  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const sb = await authed();
    await sb.from('attendance_students').delete().eq('id', pendingDelete.id);
    setPendingDelete(null);
    load(true);
  };
  const confirmCheckIn = async () => {
    if (!pendingIn) return;
    const sb = await authed();
    await sb.from('attendance_logs').insert({
      student_id: pendingIn.studentId, session: pendingIn.session,
      log_date: date, check_in: new Date().toISOString(),
    });
    setPendingIn(null);
    load(true);
  };
  // One tap writes the class-end time on every checked-in student who has
  // no departure yet. Individual rows can still be edited afterwards.
  // Weekend, the whole day in one tap. Students scan once in the morning;
  // the normal day is stay to 12:00, come back at 1:00, stay to 4:30. So
  // that is what this writes, and you correct only the people who did
  // something else.
  //
  // The afternoon rows go in already closed. Creating them open was the old
  // trap: "All out" had already run over the rows that existed at the time,
  // so the new afternoons stayed blank and had to be typed by hand.
  //
  // Safe to press again at any point in the day — it only ever fills what is
  // still blank, and never touches a time you have already set.
  const fillWeekendDay = async () => {
    const sb = await authed();
    const amEnd = schedule.weekend.morning.sessionEnd;        // 12:00
    const pmStart = schedule.weekend.afternoon.sessionStart;  // 1:00 — when class
                                                              // begins, not when
                                                              // the QR opens
    const pmEnd = schedule.weekend.afternoon.sessionEnd;      // 4:30
    // The whole class, never just the search results.
    const everyone = [...allForClass, ...visitors];

    // 1. Anyone here this morning is assumed back after lunch — arrival and
    //    departure both written, so nothing is left half-filled.
    const needPm = everyone.filter(stu => {
      const am = logs[`${stu.id}:morning`];
      return am?.check_in && !am.na && !logs[`${stu.id}:afternoon`];
    });
    if (needPm.length) {
      await sb.from('attendance_logs').insert(
        needPm.map(stu => ({
          student_id: stu.id, session: 'afternoon', log_date: date,
          check_in: hmToIso(date, pmStart),
          check_out: hmToIso(date, pmEnd),
        })),
      );
    }

    // 2. Close every session still hanging open at its own end time.
    const open = everyone.flatMap(stu => sess
      .map(se => ({ se, l: logs[`${stu.id}:${se}`] }))
      .filter(x => x.l && x.l.check_in && !x.l.check_out && !x.l.na));
    if (open.length) {
      await Promise.all(open.map(({ se, l }) =>
        sb.from('attendance_logs')
          .update({ check_out: hmToIso(date, se === 'morning' ? amEnd : pmEnd) })
          .eq('id', l!.id)));
    }

    if (!needPm.length && !open.length) return;
    load(true);
  };

  const checkEveryoneOut = async () => {
    const sb = await authed();
    // Everyone present today — roster students and visiting students alike.
    // The whole class, never just the search results.
    const everyone = [...allForClass, ...visitors];
    const targets = everyone.flatMap(stu => sess
      .map(se => ({ se, l: logs[`${stu.id}:${se}`] }))
      .filter(x => x.l && x.l.check_in && !x.l.check_out && !x.l.na));
    await Promise.all(targets.map(({ se, l }) =>
      sb.from('attendance_logs').update({ check_out: hmToIso(date, sessionEndOf(schedule, se)) }).eq('id', l!.id)));
    load(true);
  };

  // Removes today's record for one session — the student returns to A and
  // drops off the export. Used when someone appears briefly then leaves.
  const confirmClear = async () => {
    if (!pendingClear) return;
    const sb = await authed();
    await sb.from('attendance_logs').delete().eq('id', pendingClear.log.id);
    setPendingClear(null);
    load(true);
  };

  const saveCalendar = async (next: { termStart?: string; termEnd?: string; closures?: Closure[] }) => {
    const sb = await authed();
    const value = {
      termStart: next.termStart ?? termStart,
      termEnd: next.termEnd ?? termEnd,
      closures: next.closures ?? closures,
    };
    const { error } = await sb.from('attendance_settings')
      .upsert({ key: 'calendar', value, updated_at: new Date().toISOString() });
    if (error) return;
    if (next.termStart !== undefined) setTermStart(next.termStart);
    if (next.termEnd !== undefined) setTermEnd(next.termEnd);
    if (next.closures !== undefined) setClosures(next.closures);
  };

  /** Is this date inside any closure? */
  const isClosed = (d: string) => closures.some(c => d >= c.from && d <= (c.to || c.from));
  const closureFor = (d: string) => closures.find(c => d >= c.from && d <= (c.to || c.from));

  // The "No class" button on the day being viewed.
  const toggleNoClass = async () => {
    const existing = closureFor(date);
    if (existing && existing.from === existing.to) {
      await saveCalendar({ closures: closures.filter(c => c !== existing) });
    } else if (!existing) {
      await saveCalendar({
        closures: [...closures, { from: date, to: date, label: 'No class' }]
          .sort((a, b) => a.from.localeCompare(b.from)),
      });
    }
    // A date inside a multi-day holiday is left alone — remove it in Settings.
  };

  const addClosure = async () => {
    const from = newClosure.from;
    if (!from) return;
    const to = newClosure.to || from;
    if (to < from) return;
    await saveCalendar({
      closures: [...closures, { from, to, label: newClosure.label.trim() || 'No class' }]
        .sort((a, b) => a.from.localeCompare(b.from)),
    });
    setNewClosure({ from: '', to: '', label: '' });
  };

  const removeClosure = async (c: Closure) =>
    saveCalendar({ closures: closures.filter(x => x !== c) });

  const setTime = async (log: Log, field: 'check_in' | 'check_out', hm: string) => {
    const sb = await authed();
    await sb.from('attendance_logs').update({ [field]: hm ? hmToIso(date, hm) : null }).eq('id', log.id);
    load(true);
  };
  const toggleVisitorMode = async (on: boolean) => {
    const sb = await authed();
    const { error } = await sb.from('attendance_settings')
      .upsert({ key: 'visitor_mode', value: { enabled: on }, updated_at: new Date().toISOString() });
    if (!error) setVisitorMode(on);
  };
  const removeVisitor = async (id: string) => {
    const sb = await authed();
    await sb.from('attendance_students').delete().eq('id', id);
    load(true);
  };
  // A walk-in who turns out to belong here becomes a normal student.
  // Their id does not change, so today's check-in comes with them.
  const confirmPromote = async () => {
    if (!promoteVisitor) return;
    const name = promoteVisitor.name.trim();
    if (!name) return;
    const sb = await authed();
    await sb.from('attendance_students').update({
      name,
      class_type: cls.classType,
      section: cls.hasSections ? Number(promoteVisitor.section) : 1,
      visitor_level: null,
      visitor_date: null,
      visitor_class: null,
    }).eq('id', promoteVisitor.id);
    setPromoteVisitor(null);
    load(true);
  };

  const confirmRemoveVisitor = async () => {
    if (!pendingRemoveVisitor) return;
    await removeVisitor(pendingRemoveVisitor.id);
    setPendingRemoveVisitor(null);
  };
  const saveVisitor = async () => {
    if (!editVisitor) return;
    const name = editVisitor.name.trim();
    if (!name) return;
    const sb = await authed();
    await sb.from('attendance_students').update({
      name,
      visitor_level: `${editVisitor.level} · Section ${editVisitor.section}`,
      section: Number(editVisitor.section),
    }).eq('id', editVisitor.id);
    setEditVisitor(null);
    load(true);
  };

  const removeAllVisitors = async () => {
    const sb = await authed();
    await Promise.all(visitors.map(v => sb.from('attendance_students').delete().eq('id', v.id)));
    setPendingClearVisitors(false);
    load(true);
  };

  const toggleCode = async (on: boolean) => {
    const sb = await authed();
    const { data: row } = await sb.from('attendance_settings').select('value').eq('key', 'checkin_secret').maybeSingle();
    const value = { ...((row?.value as any) || {}), enabled: on };
    const { error } = await sb.from('attendance_settings').upsert({ key: 'checkin_secret', value, updated_at: new Date().toISOString() });
    if (!error) setCodeOn(on);
  };
  const markFor = (studentId: string, session: string): Mark => {
    const l = logs[`${studentId}:${session}`];
    // The scoring engine expects 24h "HH:MM" — never the display format.
    const ci = l?.check_in ? toHM24(l.check_in) : null;
    const co = l?.check_out ? toHM24(l.check_out) : null;
    return scoreSession(session, ci, co, schedule);
  };

  // ---- schedule ----
  const saveSchedule = async (next: ScheduleConfig) => {
    const sb = await authed();
    const { error } = await sb.from('attendance_settings')
      .upsert({ key: 'schedule', value: next, updated_at: new Date().toISOString() });
    if (error) { setSchedMsg(`Could not save: ${error.message}`); return; }
    setSchedule(next);
    setSchedDraft(next);
    setSchedMsg('Saved.');
    setTimeout(() => setSchedMsg(''), 2500);
  };
  const editSched = (path: string[], value: any) => {
    setSchedDraft(prev => {
      const next: any = JSON.parse(JSON.stringify(prev));
      let node = next;
      for (let i = 0; i < path.length - 1; i++) node = node[path[i]];
      node[path[path.length - 1]] = value;
      return next;
    });
  };
  const schedDirty = JSON.stringify(schedDraft) !== JSON.stringify(schedule);

  // ---- records ----
  const loadRecords = useCallback(async () => {
    setRLoading(true);
    const sb = await authed();
    const { data } = await sb
      .from('attendance_logs')
      .select('id, student_id, session, check_in, check_out, log_date, na')
      .gte('log_date', rStart)
      .lte('log_date', rEnd)
      .order('log_date', { ascending: true });
    setRLogs(data || []);
    setRLoading(false);
  }, [authed, rStart, rEnd]);

  useEffect(() => { if (view === 'records') loadRecords(); }, [view, loadRecords]);

  const buildRecords = () => {
    const ids = new Set(students.map(st => st.id));
    const classLogs = rLogs.filter((l: any) => ids.has(l.student_id));
    // Class was held on a day if anyone in this class checked in —
    // holidays and cancelled days never count against a student.
    // Class days come from the meeting pattern (e.g. Mon–Thu), not from
    // who happened to check in — a day when everyone was absent is still a
    // class day. Days marked "no class" are excluded, and nothing before
    // the first record is invented.
    const recorded = classLogs.map((l: any) => l.log_date as string).sort();
    const floor = recorded.length ? recorded[0] : rStart;
    // Start at the later of: range start, term start, first record.
    let from = floor > rStart ? floor : rStart;
    if (termStart && termStart > from) from = termStart;
    // End at the earlier of: range end, term end, today.
    const today = todayLocal();
    let to = rEnd < today ? rEnd : today;
    if (termEnd && termEnd < to) to = termEnd;

    const meetDays = cls.classType === 'weekday' ? schedule.weekday.days : schedule.weekend.days;
    const heldDays = meetingDays(from, to, meetDays).filter(d => !isClosed(d));
    const byKey = new Map<string, any>();
    classLogs.forEach((l: any) => byKey.set(`${l.student_id}:${l.log_date}:${l.session}`, l));

    const scoreOf = (se: string, ci: string | null, co: string | null): Mark =>
      scoreSession(se, ci, co, schedule);

    // Every student is judged over every day the class was held. Days that
    // genuinely do not apply to someone (joined mid-term, excused) are
    // marked N/A by hand — guessing from their first check-in would hide
    // real absences at the start of term.
    const rows = students.map(stu => {
      let P = 0, L = 0, A = 0;
      // Days before a student enrolled are not theirs to answer for.
      const myDays = stu.enrolledFrom
        ? heldDays.filter(d => d >= stu.enrolledFrom!)
        : heldDays;
      const daily: { day: string; marks: Mark[]; in1: string; out1: string; outAssumed: boolean; makeup?: boolean }[] = [];
      myDays.forEach(day => {
        // A day marked N/A does not apply to this student: no mark, and it
        // is left out of both the totals and the attendance rate.
        // N/A applies per session: an excused afternoon is left out of the
        // totals on its own, without excusing the morning too.
        const marks: Mark[] = [];
        sess.forEach(se => {
          const l = byKey.get(`${stu.id}:${day}:${se}`);
          if (l?.na) return;                       // this session does not count
          marks.push(scoreOf(se, l?.check_in ? toHM24(l.check_in) : null, l?.check_out ? toHM24(l.check_out) : null));
        });
        if (!marks.length) return;                 // every session excused
        marks.forEach(m => { if (m === 'P') P++; else if (m === 'L') L++; else A++; });
        const first = byKey.get(`${stu.id}:${day}:${sess[0]}`);
        // No recorded departure means "stayed to the end" — the same
        // assumption the mark and the printed sheet use, so show it here
        // too rather than leaving the line looking incomplete.
        const realOut = toHM(first?.check_out || null);
        const assumed = Boolean(first?.check_in) && !realOut;
        daily.push({
          day, marks,
          in1: toHM(first?.check_in || null),
          out1: realOut || (assumed ? hm24To12(sessionEndOf(schedule, sess[0])) : ''),
          outAssumed: assumed,
        });
      });
      // Make-up classes are extra credit: each one adds a P without
      // cancelling the absence it makes up for.
      // Each make-up is worth one mark: a full day for the weekday class,
      // half a weekend day (because a weekend day is two sessions).
      // Make-up classes recover missed time. They do NOT add class days:
      // every student is measured over the same days the class was held.
      // A make-up is worth one mark — a full weekday, or half a weekend day
      // (a weekend day being two sessions) — and nobody can recover more
      // than they missed, so a rate can never exceed 100%. The absences and
      // the make-ups both stay visible in their own columns.
      const makeupLogs = classLogs.filter((l: any) =>
        l.student_id === stu.id && l.session === 'makeup' && !l.na);
      makeupLogs.forEach((l: any) => {
        daily.push({
          day: l.log_date, marks: ['P'], in1: toHM(l.check_in), out1: '', outAssumed: false, makeup: true,
        });
      });
      daily.sort((a, b) => a.day.localeCompare(b.day));

      const makeups = makeupLogs.length;
      const recovered = Math.min(makeups, A);      // cannot recover more than missed
      // P / L / A count SLOTS, not days: a weekend day is two of them.
      // The rate divides slots by slots, so it is a true percentage either
      // way — but the column beside it has to be days, or three Saturdays
      // read as six.
      const total = P + L + A;                      // slots that counted
      const days = daily.filter(d => !d.makeup).length;
      const rate = total ? Math.round((((P + recovered) + 0.5 * L) / total) * 100) : 0;
      return { stu, P, L, A, total, days, rate, makeups, recovered, daily };
    });
    return { rows, heldDays };
  };

  const downloadRecordsCsv = () => {
    const { rows } = buildRecords();
    const head = ['Student', 'Section', 'Class days', 'Slots', 'Present', 'Late', 'Absent', 'Make-ups', 'Recovered', 'Attendance %'];
    const csv = [head, ...rows.map(r => [r.stu.name, `S${r.stu.section}`, r.days, r.total, r.P, r.L, r.A, r.makeups, r.recovered, r.rate])]
      .map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url; a.download = `attendance-records-${rStart}-to-${rEnd}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const setPreset = (kind: 'week' | 'month' | 'all') => {
    const now = new Date();
    if (kind === 'week') {
      const d = new Date(now); d.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // Monday
      setRStart(d.toLocaleDateString('en-CA'));
    } else if (kind === 'month') {
      setRStart(monthStart());
    } else {
      setRStart(termStart || '2026-01-01');
    }
    setREnd(todayLocal());
  };

  // ---- export (unchanged school sheet) ----
  const printSheet = () => {
    const pretty = new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    const cols = ['Time in', 'Time out'];

    // The sheet shows ONE arrival and ONE departure, even for the weekend's
    // two sessions: first time in, last time out. The two marks are kept
    // in Records — the paper only needs the day's span.
    const dayTimes = (id: string): [string, string] => {
      const ins: string[] = [], outs: string[] = [];
      sess.forEach(se => {
        const l = logs[`${id}:${se}`];
        if (!l || l.na || !l.check_in) return;
        ins.push(toHM24(l.check_in));
        outs.push(l.check_out ? toHM24(l.check_out) : sessionEndOf(schedule, se));
      });
      if (!ins.length) return ['', ''];
      const firstIn = ins.sort()[0];
      const lastOut = blankTimeOut ? '' : outs.sort()[outs.length - 1];
      return [hm24To12(firstIn), lastOut ? hm24To12(lastOut) : ''];
    };
    // Only students who actually attended appear on the signed sheet —
    // an absent student must never have a signable row.
    const attended = students.filter(stu =>
      sess.some(se => {
        const l = logs[`${stu.id}:${se}`];
        return l?.check_in && !l.na;
      }));
    // Printed in arrival order: the times then run in sequence down the
    // page, and anyone written in by hand belongs naturally at the bottom.
    const firstIn = (stu: Student) => {
      const times = sess.map(se => logs[`${stu.id}:${se}`]?.check_in).filter(Boolean) as string[];
      return times.length ? times.sort()[0] : '';
    };
    const ordered = [...attended].sort((a, b) => firstIn(a).localeCompare(firstIn(b)));
    const bodyHtml = ordered.map((stu, i) => {
      const times = dayTimes(stu.id);
      return '<tr>'
        + `<td class="n">${i + 1}</td><td class="nm">${stu.name.toUpperCase()}</td><td class="sec">S${stu.section}</td>`
        + times.map(t => `<td class="t">${t}</td>`).join('')
        + '<td class="sg"></td></tr>';
    }).join('');
    // --- visitor sheet body (their own page) ---
    const vAttended = visitors
      .filter(v => sess.some(se => logs[`${v.id}:${se}`]?.check_in))
      .sort((a, b) => {
        const t = (x: any) => (sess.map(se => logs[`${x.id}:${se}`]?.check_in).filter(Boolean) as string[]).sort()[0] || '';
        return t(a).localeCompare(t(b));
      });
    const vBody = vAttended.map((v, i) => {
      const times = dayTimes(v.id);
      return '<tr>'
        + `<td class="n">${i + 1}</td><td class="nm">${v.name.toUpperCase()}</td><td class="sec">${(/Section\s*(\d)/.exec(v.visitor_level || '') || [, '—'])[1]}</td>`
        + times.map(t => `<td class="t">${t}</td>`).join('')
        + '<td class="sg"></td></tr>';
    }).join('');

    const styles = `
        @page { size: A4; margin: 15mm; }
        body { font-family: "Times New Roman", Times, serif; color:#000; margin:0; font-size:12pt; }
        .sheet { page-break-after: always; }
        .sheet:last-child { page-break-after: auto; }
        .hdr { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px; }
        .hdr div { line-height:1.9; }
        .term { font-weight:bold; font-size:13pt; }
        .fld { display:inline-block; min-width:150px; border-bottom:1px solid #000; padding:0 4px; }
        table { width:100%; border-collapse:collapse; }
        th, td { border:1px solid #000; padding:2px 6px; font-size:12pt; }
        th { background:#EDEDED; text-align:left; height:26px; font-size:11pt; }
        td { height:28px; }
        td.n { width:32px; text-align:center; } td.sec { width:78px; text-align:center; } td.t { width:78px; text-align:center; } td.sg { width:150px; }
        .foot { margin-top:120px; font-size:12pt; }
        .sigline { display:inline-block; min-width:250px; border-bottom:1px solid #000; }`;

    const classSheet = `
      <div class="sheet">
        <div class="hdr">
          <div><div class="term">${term}</div><div>Class Level: <span class="fld">${level} &nbsp; (${cls.tag})</span></div></div>
          <div><div>Date: <span class="fld">${pretty}</span></div><div>Instructor: <span class="fld">${instructor}</span></div></div>
        </div>
        <table><thead><tr><th style="width:30px"></th><th>Student Name</th><th style="width:62px">Section</th>${cols.map(c => `<th style="width:78px">${c}</th>`).join('')}<th style="width:150px">Signature</th></tr></thead>
        <tbody>${bodyHtml}</tbody></table>
        <div class="foot">Instructor Signature: <span class="sigline">&nbsp;</span></div>
      </div>`;

    const visitorSheet = vAttended.length ? `
      <div class="sheet">
        <div class="hdr">
          <div><div class="term">${term}</div><div>Level: <span class="fld">&nbsp;</span></div></div>
          <div><div>Date: <span class="fld">${pretty}</span></div><div>Instructor: <span class="fld">${instructor}</span></div></div>
        </div>
        <table><thead><tr><th style="width:30px"></th><th>Student Name</th><th style="width:70px">Section</th>${cols.map(c => `<th style="width:78px">${c}</th>`).join('')}<th style="width:150px">Signature</th></tr></thead>
        <tbody>${vBody}</tbody></table>
        <div class="foot">Instructor Signature: <span class="sigline">&nbsp;</span></div>
      </div>` : '';

    const w = window.open('', '_blank');
    if (!w) { alert('Please allow pop-ups for this site so the sheet can open.'); return; }
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Attendance ${date}</title>
      <style>${styles}</style></head><body>${classSheet}${visitorSheet}</body></html>`;
    w.document.write(html); w.document.close(); w.focus();
    setTimeout(() => w.print(), 300);
  };

  // Everything a Session cell needs, handed down as one object.
  const sessionCtx: SessionCtx = {
    logs, markFor, setTime, setPendingClear, setPendingIn, beginEdit, endEdit,
  };

  const cols = 'minmax(0,1fr) 56px 118px 118px 88px';
  const manageCols = cls.hasSections ? 'minmax(0,1fr) 96px 140px 130px 168px' : 'minmax(0,1fr) 140px 130px 168px';
  const sectionCounts = cls.hasSections
    ? `${allForClass.filter(s => s.section === 1).length} in section 1, ${allForClass.filter(s => s.section === 2).length} in section 2`
    : '';

  return (
    <div style={{ ...ui.wrap, ...ui.page }}>
      {/* ---------- header: which class ---------- */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <div>
          <div style={ui.kicker}>Class</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h2 style={ui.h1}>{cls.title}</h2>
            <button style={ui.tBtn} onClick={() => setClassId(classId === 'am' ? 'wk' : 'am')}>
              Switch to {classId === 'am' ? 'weekend' : 'morning'}
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <input
              style={{ ...ui.input, height: 38, width: 210, paddingRight: query ? 30 : 14 }}
              placeholder="Search students…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {query && (
              <button
                style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: C.faint, fontSize: '1rem', fontFamily: 'inherit', padding: 4 }}
                onClick={() => setQuery('')}
                title="Clear search"
              >×</button>
            )}
          </div>
          <button
            style={showSettings ? { ...ui.iconBtn, background: C.indigoSoft, color: C.indigo, borderColor: C.indigo } : ui.iconBtn}
            onClick={() => setShowSettings(v => !v)}
            title="Settings"
          >⚙</button>
        </div>
      </div>

      {/* ---------- tabs ---------- */}
      <div style={ui.tabRow}>
        <button style={ui.tab(view === 'today')} onClick={() => setView('today')}>Today</button>
        <button style={ui.tab(view === 'manage')} onClick={() => setView('manage')}>Manage</button>
        <button style={ui.tab(view === 'records')} onClick={() => setView('records')}>Records</button>
      </div>

      {/* ================= TODAY ================= */}
      {view === 'today' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <input type="date" style={{ ...ui.input, height: 36 }} value={date} onChange={e => setDate(e.target.value)} />
              <span style={{ fontSize: '0.9rem', color: C.sub }}>
                {inCount} of {allForClass.length} checked in{date === todayLocal() ? ' · updates live' : ''}
                {query.trim() && <> · showing {students.length} match{students.length === 1 ? '' : 'es'}</>}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {cls.classType === 'weekend' && (
                <button
                  style={{ ...ui.secondary, height: 36 }}
                  onClick={fillWeekendDay}
                  title="Writes the normal weekend day for everyone who checked in this morning: out at 12:00, back at 1:00, out at 4:30. Only fills what is blank — press it as often as you like. Correct anyone who left early on their own row."
                >
                  Fill the day · out {hm24To12(schedule.weekend.morning.sessionEnd)} → back {hm24To12(schedule.weekend.afternoon.sessionStart)} → out {hm24To12(schedule.weekend.afternoon.sessionEnd)}
                </button>
              )}
              <button
                style={isClosed(date)
                  ? { ...ui.secondary, height: 36, background: C.amberSoft, color: C.amber, borderColor: C.amber }
                  : { ...ui.secondary, height: 36 }}
                onClick={toggleNoClass}
                title="Holiday or cancelled class — this day counts for nobody"
              >{isClosed(date) ? 'No class ✓' : 'No class'}</button>
              {cls.classType === 'weekday' && (
                <button style={{ ...ui.secondary, height: 36 }} onClick={checkEveryoneOut}
                  title="Writes the class-end time on everyone still checked in.">
                  All out at {hm24To12(schedule.weekday.sessionEnd)}
                </button>
              )}
              <button style={{ ...ui.primary, height: 36 }} onClick={printSheet}>Export sheet</button>
            </div>
          </div>

          {isClosed(date) && (
            <div style={{ background: C.amberSoft, border: `1px solid #FDE68A`, color: C.amber, borderRadius: 12, padding: '10px 14px', marginBottom: 12, fontSize: '0.9rem' }}>
              <strong>{closureFor(date)?.label || 'No class'}</strong> — this day is excluded from everyone's attendance.
              {closureFor(date) && closureFor(date)!.from !== closureFor(date)!.to && (
                <> Part of {closureFor(date)!.from} → {closureFor(date)!.to}; remove it in Settings.</>
              )}
            </div>
          )}

          <div style={ui.table}>
            <div style={{ ...ui.thead, gridTemplateColumns: cols, gap: 10 }}>
              <span>Student</span>
              {cls.classType === 'weekday'
                ? <><span>Mark</span><span>In</span><span>Out</span><span /></>
                : <><span style={{ gridColumn: 'span 4' }}>Morning &amp; afternoon</span></>}
            </div>

            {loading ? (
              <div style={{ padding: 20, color: C.faint }}>Loading…</div>
            ) : students.length === 0 && visitors.length === 0 ? (
              <div style={{ padding: '26px 20px', color: C.faint }}>
                {query.trim()
                  ? <>No student matches “{query.trim()}”.</>
                  : <>No students in this class yet. Open <strong style={{ color: C.sub }}>Manage</strong> to add them.</>}
              </div>
            ) : students.map(stu => (
              cls.classType === 'weekday' ? (
                <div key={stu.id} style={{ ...ui.tr, gridTemplateColumns: cols, gap: 10 }}>
                  <span style={{ fontWeight: 600 }}>
                    {stu.name}
                    {cls.hasSections && <span style={{ ...ui.sTag, marginLeft: 8 }}>S{stu.section}</span>}
                  </span>
                  {sess.map(se => <Session key={se} stu={stu} se={se} ctx={sessionCtx} />)}
                </div>
              ) : (
                // Weekend: two sessions, stacked so the row never runs off screen.
                <div key={stu.id} style={{ padding: '10px 14px', borderBottom: `1px solid ${C.lineSoft}` }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>{stu.name}</div>
                  {sess.map(se => (
                    <div key={se} style={{ display: 'grid', gridTemplateColumns: '54px 56px 118px 118px 88px', gap: 10, alignItems: 'center', padding: '4px 0' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: C.faint, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {se === 'morning' ? 'AM' : 'PM'}
                      </span>
                      <Session stu={stu} se={se} ctx={sessionCtx} />
                    </div>
                  ))}
                </div>
              )
            ))}

            {visitors.length > 0 && (
              <>
                <div style={{ padding: '8px 18px', background: '#FFFBEB', borderTop: `1px solid ${C.lineSoft}`, borderBottom: `1px solid ${C.lineSoft}`, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.7px', color: '#92400E', fontWeight: 700 }}>
                  Visiting students today
                </div>
                {visitors.map(v => (
                  cls.classType === 'weekend' ? (
                    <div key={v.id} style={{ padding: '10px 14px', borderBottom: `1px solid ${C.lineSoft}`, background: '#FFFEF9' }}>
                      <div style={{ fontWeight: 600, marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {v.name}
                        <span style={{ ...ui.sTag, background: '#FEF3C7', borderColor: '#FDE68A', color: '#92400E' }}>{v.visitor_level || 'visitor'}</span>
                        <button style={{ ...ui.tBtn, height: 24, padding: '0 8px', fontSize: '0.75rem', color: C.green, borderColor: C.green }}
                          onClick={() => { const m = /Section\s*(\d)/.exec(v.visitor_level || ''); setPromoteVisitor({ id: v.id, name: v.name, section: m ? m[1] : '1' }); }}
                        >Add to class</button>
                        <button style={{ ...ui.tBtn, height: 24, padding: '0 8px', fontSize: '0.75rem' }}
                          onClick={() => { const m = /^(.*?)\s*·\s*Section\s*(\d)/.exec(v.visitor_level || ''); setEditVisitor({ id: v.id, name: v.name, level: m ? m[1].trim() : 'Level 1', section: m ? m[2] : '1' }); }}
                        >Edit</button>
                        <button style={{ ...ui.tDanger, height: 24, padding: '0 8px', fontSize: '0.75rem' }}
                          onClick={() => setPendingRemoveVisitor({ id: v.id, name: v.name })}
                        >Remove</button>
                      </div>
                      {sess.map(se => {
                        const l = logs[`${v.id}:${se}`];
                        return (
                          <div key={se} style={{ display: 'grid', gridTemplateColumns: '54px 56px 118px 118px 88px', gap: 10, alignItems: 'center', padding: '4px 0' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: C.faint, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              {se === 'morning' ? 'AM' : 'PM'}
                            </span>
                            {l
                              ? <Session stu={{ id: v.id, name: v.name, section: 1 }} se={se} ctx={sessionCtx} />
                              : <>
                                  <span style={{ color: C.faint }}>—</span>
                                  <span style={{ gridColumn: 'span 2', color: C.faint, fontSize: '0.85rem' }}>not this session</span>
                                  <span />
                                </>}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                  <div key={v.id} style={{ ...ui.tr, gridTemplateColumns: cols, gap: 10, background: '#FFFEF9' }}>
                    <span style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {v.name}
                      <span style={{ ...ui.sTag, background: '#FEF3C7', borderColor: '#FDE68A', color: '#92400E' }}>{v.visitor_level || 'visitor'}</span>
                      <button
                        style={{ ...ui.tBtn, height: 24, padding: '0 8px', fontSize: '0.75rem', color: C.green, borderColor: C.green }}
                        title="This student belongs to my class — move them onto the roster"
                        onClick={() => {
                          const m = /Section\s*(\d)/.exec(v.visitor_level || '');
                          setPromoteVisitor({ id: v.id, name: v.name, section: m ? m[1] : '1' });
                        }}
                      >Add to class</button>
                      <button
                        style={{ ...ui.tBtn, height: 24, padding: '0 8px', fontSize: '0.75rem' }}
                        onClick={() => {
                          const m = /^(.*?)\s*·\s*Section\s*(\d)/.exec(v.visitor_level || '');
                          setEditVisitor({
                            id: v.id,
                            name: v.name,
                            level: m ? m[1].trim() : 'Level 1',
                            section: m ? m[2] : '1',
                          });
                        }}
                      >Edit</button>
                      <button
                        style={{ ...ui.tDanger, height: 24, padding: '0 8px', fontSize: '0.75rem' }}
                        onClick={() => setPendingRemoveVisitor({ id: v.id, name: v.name })}
                      >Remove</button>
                    </span>
                    {sess.map(se => {
                      const l = logs[`${v.id}:${se}`];
                      if (!l) {
                        return (
                          <React.Fragment key={se}>
                            <span style={{ color: C.faint }}>—</span>
                            <span style={{ gridColumn: 'span 2', color: C.faint, fontSize: '0.85rem' }}>not this session</span>
                            <span />
                          </React.Fragment>
                        );
                      }
                      return <Session key={se} stu={{ id: v.id, name: v.name, section: 1 }} se={se} ctx={sessionCtx} />;
                    })}
                  </div>
                  )
                ))}
                <div style={{ padding: '10px 18px', background: '#FFFEF9' }}>
                  <button style={ui.tDanger} onClick={() => setPendingClearVisitors(true)}>Remove all visitors</button>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* ================= MANAGE ================= */}
      {view === 'manage' && (
        <>
          <div style={ui.addCard}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                style={{ ...ui.input, height: 36, flex: 1, minWidth: 200 }}
                placeholder="Student name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addStudent(); }}
              />
              {cls.hasSections && (
                <div style={{ ...ui.segSm, height: 36 }}>
                  {[1, 2].map(n => (
                    <button key={n} style={{ ...ui.segSmBtn(newSection === n), height: 34, padding: '0 14px', fontSize: '0.85rem' }}
                      onClick={() => setNewSection(n as 1 | 2)}>S{n}</button>
                  ))}
                </div>
              )}
              <button style={{ ...ui.primary, height: 36 }} onClick={addStudent}>Add</button>
            </div>

            {!showBulk ? (
              <button
                style={{ background: 'none', border: 'none', padding: '10px 0 0', fontFamily: 'inherit', fontSize: '0.85rem', color: C.indigo, cursor: 'pointer', fontWeight: 600 }}
                onClick={() => setShowBulk(true)}
              >Adding a whole class? Paste a list of names</button>
            ) : (
              <div style={{ marginTop: 12 }}>
                <textarea
                  style={{ ...ui.input, height: 130, width: '100%', padding: '10px 12px', lineHeight: 1.6, resize: 'vertical' as const }}
                  placeholder={'One name per line:\nIris Ramirez\nYoussef Benali\nDaphne Bauer'}
                  value={bulkText}
                  onChange={e => setBulkText(e.target.value)}
                />
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
                  <button style={{ ...ui.primary, height: 36 }} onClick={addBulk} disabled={bulkBusy}>
                    {bulkBusy ? 'Adding…' : `Add ${bulkText.split('\n').map(n => n.trim()).filter(Boolean).length || ''} students`.trim()}
                  </button>
                  <button style={{ ...ui.secondary, height: 36 }} onClick={() => { setShowBulk(false); setBulkText(''); }}>Cancel</button>
                  {cls.hasSections && <span style={{ fontSize: '0.85rem', color: C.sub }}>All added to Section {newSection}</span>}
                </div>
              </div>
            )}
          </div>

          <div style={{ ...ui.thead, gridTemplateColumns: manageCols, gap: 10, borderRadius: '12px 12px 0 0', border: `1px solid ${C.lineSoft}`, borderBottom: 'none', marginTop: 4 }}>
            <span>Student</span>
            {cls.hasSections && <span>Section</span>}
            <span>Enrolled from</span>
            <span>Make-ups</span>
            <span style={{ textAlign: 'right' }}>Actions</span>
          </div>
          <p style={{ margin: '0 0 8px', fontSize: '0.9rem', color: C.sub, display: 'none' }}>
            {query.trim()
              ? `${students.length} of ${allForClass.length} students match "${query.trim()}"`
              : `${students.length} student${students.length === 1 ? '' : 's'}${sectionCounts ? ` · ${sectionCounts}` : ''}`}
          </p>

          <div style={ui.table}>
            {loading ? (
              <div style={{ padding: 20, color: C.faint }}>Loading…</div>
            ) : students.length === 0 ? (
              <div style={{ padding: '26px 20px', color: C.faint }}>
                {query.trim() ? `No student matches “${query.trim()}”.` : 'No students yet — add them above.'}
              </div>
            ) : students.map(stu => {
              const editing = editingId === stu.id;
              return (
                <div key={stu.id} style={{ ...ui.tr, gridTemplateColumns: manageCols, gap: 10, background: editing ? C.bgSoft : '#fff' }}>
                  {editing ? (
                    <input
                      style={{ ...ui.tInput, width: '100%', height: 32, fontSize: '0.92rem' }}
                      value={editName} autoFocus
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveName(stu.id); if (e.key === 'Escape') setEditingId(null); }}
                    />
                  ) : (
                    <span style={{ fontWeight: 600 }}>{stu.name}</span>
                  )}

                  {cls.hasSections && (
                    <div style={ui.segSm}>
                      {[1, 2].map(n => (
                        <button key={n} style={ui.segSmBtn(stu.section === n)}
                          onClick={() => stu.section !== n && moveToSection(stu.id, n)}>S{n}</button>
                      ))}
                    </div>
                  )}

                  <input
                    type="date"
                    style={{ ...ui.tInput, width: 140 }}
                    value={stu.enrolledFrom || ''}
                    onChange={e => setEnrolledFrom(stu.id, e.target.value)}
                    title="Class days before this date are not counted for this student. Leave blank to count from the start."
                  />

                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: makeupsOf(stu.id).length ? 700 : 400, color: makeupsOf(stu.id).length ? C.indigo : C.faint, minWidth: 14 }}>
                      {makeupsOf(stu.id).length || '—'}
                    </span>
                    <button
                      style={{ ...ui.tBtn, padding: '0 10px' }}
                      onClick={() => { setMakeupFor({ id: stu.id, name: stu.name }); setMakeupDate(todayLocal()); setMakeupMsg(''); }}
                      title="Record a make-up class this student attended"
                    >Add</button>
                  </span>

                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    {editing ? (
                      <>
                        <button style={{ ...ui.tBtn, color: C.indigo, borderColor: C.indigo }} onClick={() => saveName(stu.id)}>Save</button>
                        <button style={ui.tBtn} onClick={() => setEditingId(null)}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button style={ui.tBtn} onClick={() => { setEditingId(stu.id); setEditName(stu.name); }}>Rename</button>
                        <button style={ui.tDanger} onClick={() => setPendingDelete(stu)}>Delete</button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ================= RECORDS ================= */}
      {view === 'records' && (
        <>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
            <div style={{ ...ui.seg, height: 36 }}>
              <button style={{ ...ui.segBtn(false), height: 28 }} onClick={() => setPreset('week')}>This week</button>
              <button style={{ ...ui.segBtn(false), height: 28 }} onClick={() => setPreset('month')}>This month</button>
              <button style={{ ...ui.segBtn(false), height: 28 }} onClick={() => setPreset('all')}>Whole term</button>
            </div>
            <input type="date" style={{ ...ui.input, height: 36 }} value={rStart} onChange={e => setRStart(e.target.value)} />
            <span style={{ color: C.faint }}>to</span>
            <input type="date" style={{ ...ui.input, height: 36 }} value={rEnd} onChange={e => setREnd(e.target.value)} />
            <div style={{ flex: 1 }} />
            <button style={{ ...ui.secondary, height: 36 }} onClick={downloadRecordsCsv}>Download CSV</button>
          </div>

          <p style={{ margin: '0 0 10px', fontSize: '0.9rem', color: C.sub }}>
            Every slot is scored on its own: P is full credit, L is half, A is none. A weekend day has two
            slots, morning and afternoon, so a student who comes all morning and skips the afternoon has 100%
            and 0% — half the day. Days counts days; P, L and A count slots. A make-up recovers one missed
            slot. Click a student for their day-by-day record.
          </p>

          <div style={ui.table}>
            {(() => {
              if (rLoading || loading) return <div style={{ padding: 20, color: C.faint }}>Loading…</div>;
              const { rows, heldDays } = buildRecords();
              if (heldDays.length === 0) return <div style={{ padding: '26px 20px', color: C.faint }}>No class days with check-ins in this range yet.</div>;
              const recCols = 'minmax(0,1fr) 80px 52px 52px 52px 74px 130px';
              return (
                <>
                  <div style={{ ...ui.thead, gridTemplateColumns: recCols, gap: 10 }}>
                    <span>Student</span><span>Days</span>
                    <span title={sess.length > 1 ? 'Counted per slot — a weekend day has two' : undefined}>P</span>
                    <span title={sess.length > 1 ? 'Counted per slot — a weekend day has two' : undefined}>L</span>
                    <span title={sess.length > 1 ? 'Counted per slot — a weekend day has two' : undefined}>A</span>
                    <span>Make-up</span><span>Rate</span>
                  </div>
                  {rows.map(r => (
                    <React.Fragment key={r.stu.id}>
                      <div
                        style={{ ...ui.tr, gridTemplateColumns: recCols, gap: 10, cursor: 'pointer', background: expanded === r.stu.id ? C.bgSoft : '#fff' }}
                        onClick={() => setExpanded(expanded === r.stu.id ? null : r.stu.id)}
                      >
                        <span style={{ fontWeight: 600 }}>
                          {r.stu.name}
                          {cls.hasSections && <span style={{ ...ui.sTag, marginLeft: 8 }}>S{r.stu.section}</span>}
                        </span>
                        <span style={ui.mono} title={sess.length > 1 ? `${r.days} days · ${r.total} slots` : undefined}>{r.days}</span>
                        <span style={{ color: C.green, fontWeight: 700 }}>{r.P}</span>
                        <span style={{ color: C.amber, fontWeight: 700 }}>{r.L}</span>
                        <span style={{ color: C.red, fontWeight: 700 }}>{r.A}</span>
                        <span style={{ color: r.makeups ? C.indigo : C.faint, fontWeight: r.makeups ? 700 : 400 }}
                          title={r.makeups && r.recovered < r.makeups
                            ? `${r.makeups} attended, ${r.recovered} counted — no absence left to recover`
                            : undefined}>
                          {r.makeups || '—'}
                          {r.makeups > r.recovered && <span style={{ color: C.faint, fontWeight: 400 }}> ({r.recovered})</span>}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 700, minWidth: 42 }}>{r.rate}%</span>
                          <span style={{ width: 52, height: 6, background: C.lineSoft, borderRadius: 9999, overflow: 'hidden' }}>
                            <span style={{ display: 'block', height: '100%', width: `${r.rate}%`, background: r.rate >= 80 ? C.green : r.rate >= 60 ? '#D97706' : C.red, borderRadius: 9999 }} />
                          </span>
                        </span>
                      </div>
                      {expanded === r.stu.id && (
                        <div style={{ background: C.bgSoft, borderBottom: `1px solid ${C.lineSoft}`, padding: '10px 18px 14px' }}>
                          {r.daily.map((d, di) => (
                            <div key={`${d.day}-${di}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0', fontSize: '0.88rem' }}>
                              <span style={{ ...ui.mono, minWidth: 150 }}>{new Date(`${d.day}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                              {d.marks.map((m, i) => <span key={i} style={ui.chip(m)}>{m}</span>)}
                              {d.in1 && (
                                <span style={ui.mono}>
                                  in {d.in1}
                                  {d.out1 && <>{' · out '}{d.out1}</>}
                                </span>
                              )}
                              {d.makeup && (
                                <span style={{ background: C.indigoSoft, color: C.indigo, borderRadius: 6, padding: '2px 8px', fontSize: '0.75rem', fontWeight: 700 }}>
                                  MAKE-UP
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </>
              );
            })()}
          </div>
        </>
      )}

      {/* ---------- dialogs ---------- */}
      {editVisitor && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
          onClick={() => setEditVisitor(null)}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '28px 30px', width: 'min(440px, 92vw)', boxShadow: '0 24px 60px -12px rgba(0,0,0,0.3)', fontFamily: 'inherit' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.25rem', fontWeight: 600 }}>Edit visiting student</h3>

            <label style={{ display: 'block', fontSize: '0.8rem', color: C.faint, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>Name</label>
            <input
              style={{ ...ui.input, width: '100%', marginBottom: 14 }}
              value={editVisitor.name}
              onChange={e => setEditVisitor({ ...editVisitor, name: e.target.value.toUpperCase() })}
            />

            <label style={{ display: 'block', fontSize: '0.8rem', color: C.faint, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>Their level</label>
            <select
              style={{ ...ui.input, width: '100%', marginBottom: 14, cursor: 'pointer' }}
              value={editVisitor.level}
              onChange={e => setEditVisitor({ ...editVisitor, level: e.target.value })}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={`Level ${n}`}>Level {n}</option>)}
            </select>

            <label style={{ display: 'block', fontSize: '0.8rem', color: C.faint, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>Their section</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
              {['1', '2'].map(n => (
                <button key={n}
                  style={{
                    flex: 1, fontFamily: 'inherit', cursor: 'pointer', borderRadius: 12, padding: '11px',
                    fontWeight: 600, fontSize: '0.95rem',
                    background: editVisitor.section === n ? C.indigo : '#fff',
                    color: editVisitor.section === n ? '#fff' : C.sub,
                    border: editVisitor.section === n ? 'none' : `1px solid ${C.line}`,
                  }}
                  onClick={() => setEditVisitor({ ...editVisitor, section: n })}
                >Section {n}</button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button style={ui.secondary} onClick={() => setEditVisitor(null)}>Cancel</button>
              <button style={ui.primary} onClick={saveVisitor} disabled={!editVisitor.name.trim()}>Save changes</button>
            </div>
          </div>
        </div>
      )}

      {makeupFor && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
          onClick={() => { setMakeupFor(null); setMakeupMsg(''); }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '28px 30px', width: 'min(460px, 92vw)', boxShadow: '0 24px 60px -12px rgba(0,0,0,0.3)', fontFamily: 'inherit' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 6px', fontSize: '1.25rem', fontWeight: 600 }}>Make-up classes — {makeupFor.name}</h3>
            <p style={{ margin: '0 0 18px', color: C.sub, lineHeight: 1.6, fontSize: '0.92rem' }}>
              {cls.classType === 'weekday'
                ? 'Each make-up counts as one full present day.'
                : 'Each make-up counts as half a weekend day — two make-ups make a full day.'}
              {' '}The absence it makes up for stays on the record.
            </p>

            <label style={{ display: 'block', fontSize: '0.8rem', color: C.faint, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>Date attended</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
              <input type="date" style={{ ...ui.input, flex: 1 }} value={makeupDate} onChange={e => setMakeupDate(e.target.value)} />
              <button style={ui.primary} onClick={addMakeup} disabled={!makeupDate}>Add</button>
            </div>
            {makeupMsg && (
              <p style={{ margin: '-8px 0 16px', color: C.amber, fontSize: '0.88rem' }}>{makeupMsg}</p>
            )}

            {makeupsOf(makeupFor.id).length > 0 && (
              <>
                <div style={{ fontSize: '0.8rem', color: C.faint, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>
                  Recorded ({makeupsOf(makeupFor.id).length})
                </div>
                <div style={{ border: `1px solid ${C.lineSoft}`, borderRadius: 12, overflow: 'hidden', marginBottom: 18 }}>
                  {makeupsOf(makeupFor.id).map((m, i, arr) => (
                    <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 14px', borderBottom: i < arr.length - 1 ? `1px solid ${C.lineSoft}` : 'none' }}>
                      <span style={{ fontSize: '0.92rem' }}>
                        {new Date(`${m.log_date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <button style={ui.tDanger} onClick={() => removeMakeup(m.id)}>Remove</button>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button style={ui.secondary} onClick={() => { setMakeupFor(null); setMakeupMsg(''); }}>Done</button>
            </div>
          </div>
        </div>
      )}

      {promoteVisitor && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
          onClick={() => setPromoteVisitor(null)}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '28px 30px', width: 'min(440px, 92vw)', boxShadow: '0 24px 60px -12px rgba(0,0,0,0.3)', fontFamily: 'inherit' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 600 }}>Add to {cls.title}</h3>
            <p style={{ margin: '0 0 18px', color: C.sub, lineHeight: 1.6, fontSize: '0.92rem' }}>
              They stop being a visitor and join your roster for the rest of the term.
              Today's check-in stays with them.
            </p>

            <label style={{ display: 'block', fontSize: '0.8rem', color: C.faint, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>Name</label>
            <input
              style={{ ...ui.input, width: '100%', marginBottom: cls.hasSections ? 14 : 22 }}
              value={promoteVisitor.name}
              onChange={e => setPromoteVisitor({ ...promoteVisitor, name: e.target.value.toUpperCase() })}
            />

            {cls.hasSections && (
              <>
                <label style={{ display: 'block', fontSize: '0.8rem', color: C.faint, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>Section in my class</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
                  {['1', '2'].map(n => (
                    <button key={n}
                      style={{
                        flex: 1, fontFamily: 'inherit', cursor: 'pointer', borderRadius: 12, padding: '11px',
                        fontWeight: 600, fontSize: '0.95rem',
                        background: promoteVisitor.section === n ? C.indigo : '#fff',
                        color: promoteVisitor.section === n ? '#fff' : C.sub,
                        border: promoteVisitor.section === n ? 'none' : `1px solid ${C.line}`,
                      }}
                      onClick={() => setPromoteVisitor({ ...promoteVisitor, section: n })}
                    >Section {n}</button>
                  ))}
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button style={ui.secondary} onClick={() => setPromoteVisitor(null)}>Cancel</button>
              <button style={{ ...ui.primary, background: C.green }} onClick={confirmPromote} disabled={!promoteVisitor.name.trim()}>Add to class</button>
            </div>
          </div>
        </div>
      )}

      {pendingRemoveVisitor && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
          onClick={() => setPendingRemoveVisitor(null)}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '28px 30px', width: 'min(430px, 92vw)', boxShadow: '0 24px 60px -12px rgba(0,0,0,0.3)', fontFamily: 'inherit' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 600 }}>Remove {pendingRemoveVisitor.name}?</h3>
            <p style={{ margin: '0 0 22px', color: C.sub, lineHeight: 1.6, fontSize: '0.92rem' }}>
              This visiting student and their check-in are deleted. Your own class is untouched.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button style={ui.secondary} onClick={() => setPendingRemoveVisitor(null)}>Cancel</button>
              <button style={{ ...ui.primary, background: C.red }} onClick={confirmRemoveVisitor}>Remove</button>
            </div>
          </div>
        </div>
      )}

      {pendingClearVisitors && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
          onClick={() => setPendingClearVisitors(false)}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '28px 30px', width: 'min(430px, 90vw)', boxShadow: '0 24px 60px -12px rgba(0,0,0,0.3)', fontFamily: 'inherit' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 600 }}>Remove all {visitors.length} visitor{visitors.length === 1 ? '' : 's'}?</h3>
            <p style={{ margin: '0 0 22px', color: C.sub, lineHeight: 1.6, fontSize: '0.92rem' }}>
              This deletes today's visiting students and their check-ins. Export the visitor sheet first if you still need it. Your own class is untouched.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button style={ui.secondary} onClick={() => setPendingClearVisitors(false)}>Cancel</button>
              <button style={{ ...ui.primary, background: C.red }} onClick={removeAllVisitors}>Remove all</button>
            </div>
          </div>
        </div>
      )}

      {pendingIn && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
          onClick={() => setPendingIn(null)}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '28px 30px', width: 'min(430px, 90vw)', boxShadow: '0 24px 60px -12px rgba(0,0,0,0.3)', fontFamily: 'inherit' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 600 }}>Check in {pendingIn.name}?</h3>
            <p style={{ margin: '0 0 22px', color: C.sub, lineHeight: 1.6, fontSize: '0.92rem' }}>
              Their arrival will be recorded as <strong>{toHM(new Date().toISOString())}</strong>.
              {date !== todayLocal() && <> This is for <strong>{new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</strong>, not today.</>}
              {' '}You can correct the time afterwards in the In box.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button style={ui.secondary} onClick={() => setPendingIn(null)}>Cancel</button>
              <button style={ui.primary} onClick={confirmCheckIn}>Check in</button>
            </div>
          </div>
        </div>
      )}

      {pendingClear && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
          onClick={() => setPendingClear(null)}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '28px 30px', width: 'min(430px, 90vw)', boxShadow: '0 24px 60px -12px rgba(0,0,0,0.3)', fontFamily: 'inherit' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 600 }}>Remove {pendingClear.name}'s check-in?</h3>
            <p style={{ margin: '0 0 22px', color: C.sub, lineHeight: 1.6, fontSize: '0.92rem' }}>
              Their arrival at {pendingClear.at} will be deleted for today. They go back to <strong>A</strong> and
              will not appear on the printed sheet. Their name stays on your roster and their other days are untouched.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button style={ui.secondary} onClick={() => setPendingClear(null)}>Cancel</button>
              <button style={{ ...ui.primary, background: C.red }} onClick={confirmClear}>Remove check-in</button>
            </div>
          </div>
        </div>
      )}

      {pendingDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
          onClick={() => setPendingDelete(null)}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '28px 30px', width: 'min(420px, 90vw)', boxShadow: '0 24px 60px -12px rgba(0,0,0,0.3)', fontFamily: 'inherit' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 600 }}>Delete {pendingDelete.name}?</h3>
            <p style={{ margin: '0 0 22px', color: C.sub, lineHeight: 1.6, fontSize: '0.92rem' }}>
              Their attendance history is deleted with them. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button style={ui.secondary} onClick={() => setPendingDelete(null)}>Cancel</button>
              <button style={{ ...ui.primary, background: C.red }} onClick={confirmDelete}>Delete student</button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- settings ---------- */}
      {showSettings && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 9998, padding: '40px 16px', overflowY: 'auto' }}
          onClick={() => setShowSettings(false)}
        >
        <div
          style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 18, padding: '22px 24px', boxSizing: 'border-box', width: 'min(720px, 100%)', boxShadow: '0 24px 60px -12px rgba(0,0,0,0.3)', fontFamily: 'inherit' }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, paddingBottom: 14, borderBottom: `1px solid ${C.lineSoft}` }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>Settings</h3>
            <button style={ui.iconBtn} onClick={() => setShowSettings(false)} title="Close">×</button>
          </div>

          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.7px', color: C.faint, fontWeight: 700, margin: '0 0 10px' }}>Printed sheet header</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input style={{ ...ui.input, width: 170 }} value={term} onChange={e => setTerm(e.target.value)} placeholder="Term" />
            <input style={{ ...ui.input, width: 80 }} value={level} onChange={e => setLevel(e.target.value)} placeholder="Level" />
            <input style={{ ...ui.input, width: 220 }} value={instructor} onChange={e => setInstructor(e.target.value)} placeholder="Instructor" />
          </div>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.88rem', color: C.sub, cursor: 'pointer', marginTop: 12 }}>
            <input type="checkbox" checked={blankTimeOut} onChange={e => setBlankTimeOut(e.target.checked)} />
            Print Time out blank (students write it when signing)
          </label>

          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.7px', color: C.faint, fontWeight: 700, margin: '22px 0 4px' }}>Class times</div>
          <p style={{ margin: '0 0 12px', color: C.sub, fontSize: '0.86rem', lineHeight: 1.55, maxWidth: 620 }}>
            These drive the P / L / A marks and decide when the QR code works. Saving applies everywhere at once.
          </p>

          <div style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 14, padding: '14px 16px', marginBottom: 10, boxSizing: 'border-box', maxWidth: '100%' }}>
            <div style={{ fontWeight: 600, marginBottom: 10 }}>Level 4 · Morning</div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <label style={{ fontSize: '0.82rem', color: C.sub }}>Class starts<br />
                <input type="time" style={{ ...ui.input, marginTop: 4, width: 128 }} value={schedDraft.weekday.sessionStart}
                  onChange={e => editSched(['weekday', 'sessionStart'], e.target.value)} /></label>
              <label style={{ fontSize: '0.82rem', color: C.sub }}>On time until<br />
                <input type="time" style={{ ...ui.input, marginTop: 4, width: 128 }} value={schedDraft.weekday.graceEnd}
                  onChange={e => editSched(['weekday', 'graceEnd'], e.target.value)} /></label>
              <label style={{ fontSize: '0.82rem', color: C.sub }}>Class ends<br />
                <input type="time" style={{ ...ui.input, marginTop: 4, width: 128 }} value={schedDraft.weekday.sessionEnd}
                  onChange={e => editSched(['weekday', 'sessionEnd'], e.target.value)} /></label>
              <label style={{ fontSize: '0.82rem', color: C.sub }}>QR opens<br />
                <input type="time" style={{ ...ui.input, marginTop: 4, width: 128 }} value={schedDraft.weekday.checkinOpen}
                  onChange={e => editSched(['weekday', 'checkinOpen'], e.target.value)} /></label>
              <label style={{ fontSize: '0.82rem', color: C.sub }}>QR closes<br />
                <input type="time" style={{ ...ui.input, marginTop: 4, width: 128 }} value={schedDraft.weekday.checkinClose}
                  onChange={e => editSched(['weekday', 'checkinClose'], e.target.value)} /></label>
            </div>
          </div>

          {([['morning', 'Level 4 · Weekend — morning'], ['afternoon', 'Level 4 · Weekend — afternoon']] as const).map(([key, title]) => (
            <div key={key} style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 14, padding: '14px 16px', marginBottom: 10, boxSizing: 'border-box', maxWidth: '100%' }}>
              <div style={{ fontWeight: 600, marginBottom: 10 }}>{title}</div>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <label style={{ fontSize: '0.82rem', color: C.sub }}>Session starts<br />
                  <input type="time" style={{ ...ui.input, marginTop: 4, width: 128 }} value={schedDraft.weekend[key].sessionStart}
                    onChange={e => editSched(['weekend', key, 'sessionStart'], e.target.value)} /></label>
                <label style={{ fontSize: '0.82rem', color: C.sub }}>On time until<br />
                  <input type="time" style={{ ...ui.input, marginTop: 4, width: 128 }} value={schedDraft.weekend[key].graceEnd}
                    onChange={e => editSched(['weekend', key, 'graceEnd'], e.target.value)} /></label>
                <label style={{ fontSize: '0.82rem', color: C.sub }}>Session ends<br />
                  <input type="time" style={{ ...ui.input, marginTop: 4, width: 128 }} value={schedDraft.weekend[key].sessionEnd}
                    onChange={e => editSched(['weekend', key, 'sessionEnd'], e.target.value)} /></label>
                <label style={{ fontSize: '0.82rem', color: C.sub }}>QR opens<br />
                  <input type="time" style={{ ...ui.input, marginTop: 4, width: 128 }} value={schedDraft.weekend[key].checkinOpen}
                    onChange={e => editSched(['weekend', key, 'checkinOpen'], e.target.value)} /></label>
                <label style={{ fontSize: '0.82rem', color: C.sub }}>QR closes<br />
                  <input type="time" style={{ ...ui.input, marginTop: 4, width: 128 }} value={schedDraft.weekend[key].checkinClose}
                    onChange={e => editSched(['weekend', key, 'checkinClose'], e.target.value)} /></label>
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <button style={{ ...ui.primary, opacity: schedDirty ? 1 : 0.45, cursor: schedDirty ? 'pointer' : 'default' }}
              disabled={!schedDirty} onClick={() => saveSchedule(schedDraft)}>Save times</button>
            {schedDirty && <button style={ui.secondary} onClick={() => setSchedDraft(schedule)}>Discard</button>}
            <button style={ui.secondary} onClick={() => setSchedDraft(normaliseSchedule(null))}>Reset to defaults</button>
            {schedMsg && <span style={{ fontSize: '0.85rem', color: C.sub }}>{schedMsg}</span>}
          </div>

          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.7px', color: C.faint, fontWeight: 700, margin: '22px 0 4px' }}>Term</div>
          <p style={{ margin: '0 0 10px', color: C.sub, fontSize: '0.86rem', lineHeight: 1.55, maxWidth: 620 }}>
            Attendance is only counted between these dates. Leave blank to count from your first record.
          </p>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 6 }}>
            <label style={{ fontSize: '0.82rem', color: C.sub }}>Term starts<br />
              <input type="date" style={{ ...ui.input, marginTop: 4 }} value={termStart}
                onChange={e => saveCalendar({ termStart: e.target.value })} /></label>
            <label style={{ fontSize: '0.82rem', color: C.sub }}>Term ends<br />
              <input type="date" style={{ ...ui.input, marginTop: 4 }} value={termEnd}
                onChange={e => saveCalendar({ termEnd: e.target.value })} /></label>
            {(termStart || termEnd) && (
              <button style={ui.secondary} onClick={() => saveCalendar({ termStart: '', termEnd: '' })}>Clear</button>
            )}
          </div>

          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.7px', color: C.faint, fontWeight: 700, margin: '22px 0 4px' }}>Holidays &amp; closures</div>
          <p style={{ margin: '0 0 10px', color: C.sub, fontSize: '0.86rem', lineHeight: 1.55, maxWidth: 620 }}>
            Days here count for nobody. Use a range for a whole holiday week.
          </p>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 12 }}>
            <label style={{ fontSize: '0.82rem', color: C.sub }}>From<br />
              <input type="date" style={{ ...ui.input, marginTop: 4 }} value={newClosure.from}
                onChange={e => setNewClosure({ ...newClosure, from: e.target.value })} /></label>
            <label style={{ fontSize: '0.82rem', color: C.sub }}>To (optional)<br />
              <input type="date" style={{ ...ui.input, marginTop: 4 }} value={newClosure.to}
                onChange={e => setNewClosure({ ...newClosure, to: e.target.value })} /></label>
            <label style={{ fontSize: '0.82rem', color: C.sub, flex: 1, minWidth: 160 }}>Name<br />
              <input style={{ ...ui.input, marginTop: 4, width: '100%' }} placeholder="e.g. National holiday"
                value={newClosure.label}
                onChange={e => setNewClosure({ ...newClosure, label: e.target.value })} /></label>
            <button style={ui.primary} onClick={addClosure} disabled={!newClosure.from}>Add</button>
          </div>

          {closures.length === 0 ? (
            <p style={{ color: C.faint, fontSize: '0.88rem', margin: 0 }}>No holidays added yet.</p>
          ) : (
            <div style={{ border: `1px solid ${C.lineSoft}`, borderRadius: 12, overflow: 'hidden' }}>
              {closures.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 14px', borderBottom: i < closures.length - 1 ? `1px solid ${C.lineSoft}` : 'none', background: '#fff' }}>
                  <span>
                    <strong style={{ fontWeight: 600 }}>{c.label}</strong>
                    <span style={{ color: C.sub, fontSize: '0.88rem', marginLeft: 10 }}>
                      {c.from === c.to
                        ? new Date(`${c.from}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                        : `${new Date(`${c.from}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} → ${new Date(`${c.to}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                    </span>
                  </span>
                  <button style={ui.tDanger} onClick={() => removeClosure(c)}>Remove</button>
                </div>
              ))}
            </div>
          )}

          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.7px', color: C.faint, fontWeight: 700, margin: '22px 0 4px' }}>Days the class meets</div>
          <p style={{ margin: '0 0 10px', color: C.sub, fontSize: '0.86rem', lineHeight: 1.55, maxWidth: 620 }}>
            Records counts every one of these days, whether or not anyone checked in. Holidays are marked
            with the <strong>No class</strong> button on that day.
          </p>
          {(['weekday', 'weekend'] as const).map(k => (
            <div key={k} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
              <span style={{ fontSize: '0.85rem', color: C.sub, width: 150 }}>
                {k === 'weekday' ? 'Level 4 · Morning' : 'Level 4 · Weekend'}
              </span>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((lbl, i) => {
                const on = (schedDraft[k].days || []).includes(i);
                return (
                  <button key={i}
                    style={{
                      fontFamily: 'inherit', cursor: 'pointer', borderRadius: 9, padding: '6px 10px',
                      fontWeight: 600, fontSize: '0.8rem',
                      background: on ? C.indigoSoft : '#fff',
                      color: on ? C.indigo : C.faint,
                      border: `1px solid ${on ? C.indigo : C.line}`,
                    }}
                    onClick={() => {
                      const cur = schedDraft[k].days || [];
                      const next = cur.includes(i) ? cur.filter(d => d !== i) : [...cur, i].sort();
                      editSched([k, 'days'], next);
                    }}
                  >{lbl}</button>
                );
              })}
            </div>
          ))}

          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.7px', color: C.faint, fontWeight: 700, margin: '22px 0 8px' }}>Testing</div>
          <label style={{ display: 'inline-flex', alignItems: 'flex-start', gap: 8, fontSize: '0.88rem', color: C.sub, cursor: 'pointer', lineHeight: 1.5, maxWidth: 620 }}>
            <input type="checkbox" style={{ marginTop: 3 }} checked={Boolean(schedule.testingMode)}
              onChange={e => saveSchedule({ ...schedule, testingMode: e.target.checked })} />
            <span>
              <strong style={{ color: C.ink }}>Accept the QR at any hour</strong> — for testing outside class time.
              {schedule.testingMode && <span style={{ color: C.red, fontWeight: 600 }}> Currently ON — turn this off before class.</span>}
            </span>
          </label>

          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.7px', color: C.faint, fontWeight: 700, margin: '22px 0 8px' }}>Combined class (visitors)</div>
          <label style={{ display: 'inline-flex', alignItems: 'flex-start', gap: 8, fontSize: '0.88rem', color: C.sub, cursor: 'pointer', lineHeight: 1.5, maxWidth: 620 }}>
            <input type="checkbox" style={{ marginTop: 3 }} checked={visitorMode} onChange={e => toggleVisitorMode(e.target.checked)} />
            <span>
              <strong style={{ color: C.ink }}>Let visiting students add themselves</strong> — for days another teacher's class joins yours.
              They type their name and level on the check-in screen and print on a separate sheet.
              {visitorMode && <span style={{ color: '#B45309', fontWeight: 600 }}> Currently ON — turn off when the classes separate again.</span>}
            </span>
          </label>

          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.7px', color: C.faint, fontWeight: 700, margin: '22px 0 8px' }}>Screen code</div>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.88rem', color: C.sub, cursor: 'pointer' }}>
            <input type="checkbox" checked={codeOn} onChange={e => toggleCode(e.target.checked)} />
            Only accept check-ins scanned from the classroom screen
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 22, paddingTop: 16, borderTop: `1px solid ${C.lineSoft}` }}>
            <button style={ui.primary} onClick={() => setShowSettings(false)}>Done</button>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}

export default AttendancePortal;