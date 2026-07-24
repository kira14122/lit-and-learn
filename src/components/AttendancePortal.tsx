import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { getSupabaseClient } from '../supabaseClient';
import {
  scoreWeekday, scoreWeekendMorning, scoreWeekendAfternoon, type Mark,
  type ScheduleConfig, DEFAULT_SCHEDULE, normaliseSchedule,
} from './attendanceScoring';

// Attendance.
// One toolbar. One real table. One control language:
//  - segmented controls for switching (class, view)
//  - 40px-high controls everywhere
//  - indigo = primary action, grey = secondary, red = destructive
// Two classes: Level 4 Morning (one group, S1/S2 as a label per student)
// and Weekend (one group, no sections).

interface ClassDef { id: string; title: string; classType: 'weekday' | 'weekend'; hasSections: boolean; tag: string; }
const CLASSES: ClassDef[] = [
  { id: 'am', title: 'Level 4 · Morning', classType: 'weekday', hasSections: true, tag: 'AM' },
  { id: 'wk', title: 'Level 4 · Weekend', classType: 'weekend', hasSections: false, tag: 'WKD' },
];

interface Student { id: string; name: string; section: number; }
interface Log { id: string; student_id: string; session: string; check_in: string | null; check_out: string | null; }

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

const sessionEndOf = (sc: ScheduleConfig, se: string): string =>
  se === 'single' ? sc.weekday.dayEnd
  : se === 'morning' ? sc.weekendMorning.sessionEnd
  : sc.weekendAfternoon.sessionEnd;
const todayLocal = () => new Date().toLocaleDateString('en-CA');
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
  tInput: { fontFamily: 'inherit', border: `1px solid ${C.line}`, borderRadius: 9, padding: '0 8px', height: 30, fontSize: '0.82rem', color: C.ink, background: '#fff', boxSizing: 'border-box' as const },

  chip: (m: Mark) => {
    const c = m === 'P' ? [C.greenSoft, C.green] : m === 'L' ? [C.amberSoft, C.amber] : [C.redSoft, C.red];
    return { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, background: c[0], color: c[1], borderRadius: 9, fontWeight: 700, fontSize: '0.85rem' };
  },
  sTag: { display: 'inline-block', background: C.bgSoft, border: `1px solid ${C.lineSoft}`, color: C.faint, borderRadius: 6, padding: '1px 7px', fontSize: '0.72rem', fontWeight: 700 },

  table: { background: '#fff', border: `1px solid ${C.lineSoft}`, borderRadius: 16, overflow: 'hidden' },
  thead: { display: 'grid', padding: '0 18px', height: 40, alignItems: 'center', background: C.bgSoft, borderBottom: `1px solid ${C.lineSoft}`, fontSize: '0.72rem', textTransform: 'uppercase' as const, letterSpacing: '0.7px', color: C.faint, fontWeight: 700 },
  tr: { display: 'grid', padding: '0 18px', minHeight: 52, alignItems: 'center', borderBottom: `1px solid ${C.lineSoft}` },
  mono: { fontVariantNumeric: 'tabular-nums', color: C.sub, fontSize: '0.9rem' },
};

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Student | null>(null);
  const [pendingClear, setPendingClear] = useState<{ log: Log; name: string; at: string } | null>(null);
  const [pendingIn, setPendingIn] = useState<{ studentId: string; name: string; session: string } | null>(null);

  const [instructor, setInstructor] = useState(() => remembered('instructor', DEFAULTS.instructor));
  const [term, setTerm] = useState(() => remembered('term', DEFAULTS.term));
  const [level, setLevel] = useState(() => remembered('level', DEFAULTS.level));
  const [blankTimeOut, setBlankTimeOut] = useState(() => remembered('blankout', '') === '1');
  useEffect(() => { remember('instructor', instructor); }, [instructor]);
  useEffect(() => { remember('term', term); }, [term]);
  useEffect(() => { remember('level', level); }, [level]);
  useEffect(() => { remember('blankout', blankTimeOut ? '1' : ''); }, [blankTimeOut]);
  const [codeOn, setCodeOn] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleConfig>(DEFAULT_SCHEDULE);
  const [schedDraft, setSchedDraft] = useState<ScheduleConfig>(DEFAULT_SCHEDULE);
  const [schedMsg, setSchedMsg] = useState('');

  const authed = useCallback(async () => getSupabaseClient((await getToken({ template: 'supabase' })) ?? undefined), [getToken]);
  const sessionsFor = (c: ClassDef): string[] => c.classType === 'weekday' ? ['single'] : ['morning', 'afternoon'];

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    const sb = await authed();
    const { data: roster } = await sb
      .from('attendance_students')
      .select('id, name, section, class_type')
      .eq('active', true)
      .order('name', { ascending: true });
    const byClass: Record<string, Student[]> = {};
    CLASSES.forEach(c => {
      byClass[c.id] = (roster || [])
        .filter((r: any) => r.class_type === c.classType)
        .map((r: any) => ({ id: r.id, name: r.name, section: r.section ?? 1 }));
    });
    const { data: logRows } = await sb
      .from('attendance_logs')
      .select('id, student_id, session, check_in, check_out')
      .eq('log_date', date);
    const map: Record<string, Log> = {};
    (logRows || []).forEach((l: any) => { map[`${l.student_id}:${l.session}`] = l; });
    const { data: secretRow } = await sb.from('attendance_settings').select('value').eq('key', 'checkin_secret').maybeSingle();
    setCodeOn(Boolean((secretRow?.value as any)?.enabled));

    const { data: schedRow } = await sb.from('attendance_settings').select('value').eq('key', 'schedule').maybeSingle();
    const sc = normaliseSchedule(schedRow?.value);
    setSchedule(sc);
    setSchedDraft(sc);
    setAllStudents(byClass);
    setLogs(map);
    if (!quiet) setLoading(false);
  }, [authed, date]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (date !== todayLocal()) return;
    const t = setInterval(() => load(true), 12000);
    return () => clearInterval(t);
  }, [date, load]);

  const students = allStudents[classId] || [];
  const sess = sessionsFor(cls);
  const primarySession = cls.classType === 'weekday' ? 'single' : (new Date().getHours() < 13 ? 'morning' : 'afternoon');
  const inCount = students.filter(s => logs[`${s.id}:${primarySession}`]?.check_in).length;

  // ---- actions ----
  const addStudent = async () => {
    const name = newName.trim();
    if (!name) return;
    const sb = await authed();
    await sb.from('attendance_students').insert({ name, class_type: cls.classType, section: cls.hasSections ? newSection : 1, active: true });
    setNewName('');
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
  const checkEveryoneOut = async () => {
    const sb = await authed();
    const targets = students.flatMap(stu => sess
      .map(se => ({ se, l: logs[`${stu.id}:${se}`] }))
      .filter(x => x.l && x.l.check_in && !x.l.check_out));
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

  const setTime = async (log: Log, field: 'check_in' | 'check_out', hm: string) => {
    const sb = await authed();
    await sb.from('attendance_logs').update({ [field]: hm ? hmToIso(date, hm) : null }).eq('id', log.id);
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
    if (session === 'single') return scoreWeekday(ci, co, schedule);
    if (session === 'morning') return scoreWeekendMorning(ci, co, schedule);
    return scoreWeekendAfternoon(ci, co, schedule);
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
      .select('id, student_id, session, check_in, check_out, log_date')
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
    const heldDays = [...new Set(classLogs.filter((l: any) => l.check_in).map((l: any) => l.log_date))].sort() as string[];
    const byKey = new Map<string, any>();
    classLogs.forEach((l: any) => byKey.set(`${l.student_id}:${l.log_date}:${l.session}`, l));

    const scoreOf = (se: string, ci: string | null, co: string | null): Mark =>
      se === 'single' ? scoreWeekday(ci, co, schedule)
      : se === 'morning' ? scoreWeekendMorning(ci, co, schedule)
      : scoreWeekendAfternoon(ci, co, schedule);

    const rows = students.map(stu => {
      let P = 0, L = 0, A = 0;
      const daily: { day: string; marks: Mark[]; in1: string; out1: string }[] = [];
      heldDays.forEach(day => {
        const marks = sess.map(se => {
          const l = byKey.get(`${stu.id}:${day}:${se}`);
          return scoreOf(se, l?.check_in ? toHM24(l.check_in) : null, l?.check_out ? toHM24(l.check_out) : null);
        });
        marks.forEach(m => { if (m === 'P') P++; else if (m === 'L') L++; else A++; });
        const first = byKey.get(`${stu.id}:${day}:${sess[0]}`);
        daily.push({ day, marks, in1: toHM(first?.check_in || null), out1: toHM(first?.check_out || null) });
      });
      const total = P + L + A;
      const rate = total ? Math.round(((P + 0.5 * L) / total) * 100) : 0;
      return { stu, P, L, A, total, rate, daily };
    });
    return { rows, heldDays };
  };

  const downloadRecordsCsv = () => {
    const { rows } = buildRecords();
    const head = ['Student', 'Section', 'Sessions held', 'Present', 'Late', 'Absent', 'Attendance %'];
    const csv = [head, ...rows.map(r => [r.stu.name, `S${r.stu.section}`, r.total, r.P, r.L, r.A, r.rate])]
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
      setRStart('2026-01-01');
    }
    setREnd(todayLocal());
  };

  // ---- export (unchanged school sheet) ----
  const printSheet = () => {
    const pretty = new Date(`${date}T12:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const cols = cls.classType === 'weekday' ? ['Time in', 'Time out'] : ['AM in', 'AM out', 'PM in', 'PM out'];
    // Only students who actually attended appear on the signed sheet —
    // an absent student must never have a signable row.
    const attended = students.filter(stu => sess.some(se => logs[`${stu.id}:${se}`]?.check_in));
    const ordered = cls.hasSections
      ? [...attended].sort((a, b) => a.section - b.section || a.name.localeCompare(b.name))
      : attended;
    const bodyHtml = ordered.map((stu, i) => {
      const times: string[] = [];
      sess.forEach(se => {
        const l = logs[`${stu.id}:${se}`];
        const cin = toHM(l?.check_in || null);
        const cout = blankTimeOut ? '' : (!cin ? '' : (toHM(l?.check_out || null) || hm24To12(sessionEndOf(schedule, se))));
        times.push(cin, cout);
      });
      return '<tr>'
        + `<td class="n">${i + 1}</td><td class="nm">${stu.name}</td><td class="sec">S${stu.section}</td>`
        + times.map(t => `<td class="t">${t}</td>`).join('')
        + '<td class="sg"></td></tr>';
    }).join('');
    const w = window.open('', '_blank');
    if (!w) { alert('Please allow pop-ups for this site so the sheet can open.'); return; }
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Attendance ${date}</title>
      <style>
        @page { size: A4; margin: 15mm; }
        body { font-family: "Times New Roman", Times, serif; color:#000; margin:0; font-size:12pt; }
        .hdr { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px; }
        .hdr div { line-height:1.9; }
        .term { font-weight:bold; font-size:13pt; }
        .fld { display:inline-block; min-width:150px; border-bottom:1px solid #000; padding:0 4px; }
        table { width:100%; border-collapse:collapse; }
        th, td { border:1px solid #000; padding:2px 6px; font-size:12pt; }
        th { background:#EDEDED; text-align:left; height:26px; font-size:11pt; }
        td { height:28px; }
        td.n { width:32px; text-align:center; } td.sec { width:62px; text-align:center; } td.t { width:78px; text-align:center; } td.sg { width:150px; }
        .foot { margin-top:34px; font-size:12pt; }
        .sigline { display:inline-block; min-width:250px; border-bottom:1px solid #000; }
      </style></head><body>
      <div class="hdr">
        <div><div class="term">${term}</div><div>Class Level: <span class="fld">${level} &nbsp; (${cls.tag})</span></div></div>
        <div><div>Date: <span class="fld">${pretty}</span></div><div>Instructor: <span class="fld">${instructor}</span></div></div>
      </div>
      <table><thead><tr><th style="width:30px"></th><th>Student Name</th><th style="width:62px">Section</th>${cols.map(c => `<th style="width:78px">${c}</th>`).join('')}<th style="width:150px">Signature</th></tr></thead>
      <tbody>${bodyHtml}</tbody></table>
      <div class="foot">Instructor Signature: <span class="sigline">&nbsp;</span></div>
      </body></html>`;
    w.document.write(html); w.document.close(); w.focus();
    setTimeout(() => w.print(), 300);
  };

  // ---- column templates keep every row aligned ----
  const todayCols = cls.classType === 'weekday'
    ? 'minmax(160px,1fr) 60px 120px 130px 90px'
    : 'minmax(130px,1fr) 60px 115px 125px 90px 60px 115px 125px 90px';
  const manageCols = cls.hasSections
    ? 'minmax(160px,1fr) 110px 200px'
    : 'minmax(160px,1fr) 200px';

  const Session = ({ stu, se }: { stu: Student; se: string }) => {
    const l = logs[`${stu.id}:${se}`];
    const mark = markFor(stu.id, se);
    return (
      <>
        <span style={ui.chip(mark)}>{mark}</span>
        {l ? (
          <>
            <input
              type="time" style={ui.tInput} defaultValue={toHM24(l.check_in)}
              onChange={e => e.target.value && setTime(l, 'check_in', e.target.value)}
              title="Arrival time — edit if a student forgot to scan and you know when they arrived"
            />
            <input
              type="time" style={ui.tInput} defaultValue={toHM24(l.check_out)}
              onChange={e => setTime(l, 'check_out', e.target.value)}
              title="Blank = stayed to the end"
            />
            <button
              style={ui.tDanger}
              onClick={() => setPendingClear({ log: l, name: stu.name, at: toHM(l.check_in) })}
              title="Remove today's check-in — the student goes back to A and drops off the sheet"
            >Clear</button>
          </>
        ) : (
          <>
            <span style={ui.mono}>—</span>
            <button style={ui.tBtn} onClick={() => setPendingIn({ studentId: stu.id, name: stu.name, session: se })}>Check in</button>
            <span />
          </>
        )}
      </>
    );
  };

  return (
    <div style={ui.wrap}>
      {/* ---- one toolbar ---- */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
        <div style={ui.seg}>
          {CLASSES.map(c => (
            <button key={c.id} style={ui.segBtn(c.id === classId)} onClick={() => setClassId(c.id)}>{c.title}</button>
          ))}
        </div>
        <div style={ui.seg}>
          <button style={ui.segBtn(view === 'today')} onClick={() => setView('today')}>Today</button>
          <button style={ui.segBtn(view === 'manage')} onClick={() => setView('manage')}>Manage</button>
          <button style={ui.segBtn(view === 'records')} onClick={() => setView('records')}>Records</button>
        </div>
        <div style={{ flex: 1 }} />
        {view === 'today' && (
          <>
            <input type="date" style={ui.input} value={date} onChange={e => setDate(e.target.value)} />
            <button style={ui.secondary} onClick={checkEveryoneOut} title="Writes the class-end time on everyone still checked in. Edit any row afterwards for early leavers.">
              All out at {cls.classType === 'weekday' ? hm24To12(schedule.weekday.dayEnd) : 'class end'}
            </button>
            <button style={ui.primary} onClick={printSheet}>Export sheet</button>
          </>
        )}
        <button
          style={showSettings
            ? { ...ui.secondary, background: C.indigoSoft, color: C.indigo, borderColor: C.indigo }
            : ui.secondary}
          onClick={() => setShowSettings(v => !v)}
        >Settings{showSettings ? ' ×' : ''}</button>
      </div>

      {/* ---- status line ---- */}
      <p style={{ margin: '0 0 14px', color: C.sub, fontSize: '0.92rem' }}>
        {view === 'today'
          ? <>{inCount} of {students.length} checked in{date === todayLocal() ? ' · updates live' : ''}</>
          : view === 'manage'
          ? <>{students.length} student{students.length === 1 ? '' : 's'} in {cls.title}</>
          : <>P counts as a full session and L as half, following the school rule. Click a student for their day-by-day record.</>}
      </p>

      {/* ---- records toolbar ---- */}
      {view === 'records' && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
          <div style={ui.seg}>
            <button style={ui.segBtn(false)} onClick={() => setPreset('week')}>This week</button>
            <button style={ui.segBtn(false)} onClick={() => setPreset('month')}>This month</button>
            <button style={ui.segBtn(false)} onClick={() => setPreset('all')}>Whole term</button>
          </div>
          <input type="date" style={ui.input} value={rStart} onChange={e => setRStart(e.target.value)} />
          <span style={{ color: C.faint }}>to</span>
          <input type="date" style={ui.input} value={rEnd} onChange={e => setREnd(e.target.value)} />
          <div style={{ flex: 1 }} />
          <button style={ui.secondary} onClick={downloadRecordsCsv}>Download CSV</button>
        </div>
      )}

      {/* ---- the table ---- */}
      <div style={ui.table}>
        {view === 'records' ? (() => {
          if (rLoading || loading) return <div style={{ padding: 20, color: C.faint }}>Loading…</div>;
          const { rows, heldDays } = buildRecords();
          if (heldDays.length === 0) return <div style={{ padding: 20, color: C.faint }}>No class days with check-ins in this range yet.</div>;
          const recCols = 'minmax(160px,1fr) 90px 60px 60px 60px 130px';
          return (
            <>
              <div style={{ ...ui.thead, gridTemplateColumns: recCols, gap: 12 }}>
                <span>Student</span><span>Sessions</span><span>P</span><span>L</span><span>A</span><span>Rate</span>
              </div>
              {rows.map(r => (
                <React.Fragment key={r.stu.id}>
                  <div
                    style={{ ...ui.tr, gridTemplateColumns: recCols, gap: 12, cursor: 'pointer', background: expanded === r.stu.id ? C.bgSoft : '#fff' }}
                    onClick={() => setExpanded(expanded === r.stu.id ? null : r.stu.id)}
                  >
                    <span style={{ fontWeight: 600 }}>
                      {r.stu.name}
                      {cls.hasSections && <span style={{ ...ui.sTag, marginLeft: 8 }}>S{r.stu.section}</span>}
                    </span>
                    <span style={ui.mono}>{r.total}</span>
                    <span style={{ color: C.green, fontWeight: 700 }}>{r.P}</span>
                    <span style={{ color: C.amber, fontWeight: 700 }}>{r.L}</span>
                    <span style={{ color: C.red, fontWeight: 700 }}>{r.A}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, minWidth: 42 }}>{r.rate}%</span>
                      <span style={{ width: 52, height: 6, background: C.lineSoft, borderRadius: 9999, overflow: 'hidden' }}>
                        <span style={{ display: 'block', height: '100%', width: `${r.rate}%`, background: r.rate >= 80 ? C.green : r.rate >= 60 ? '#D97706' : C.red, borderRadius: 9999 }} />
                      </span>
                    </span>
                  </div>
                  {expanded === r.stu.id && (
                    <div style={{ background: C.bgSoft, borderBottom: `1px solid ${C.lineSoft}`, padding: '10px 18px 14px' }}>
                      {r.daily.map(d => (
                        <div key={d.day} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0', fontSize: '0.88rem' }}>
                          <span style={{ ...ui.mono, minWidth: 150 }}>{new Date(`${d.day}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                          {d.marks.map((m, i) => <span key={i} style={ui.chip(m)}>{m}</span>)}
                          {d.in1 && <span style={ui.mono}>in {d.in1}{d.out1 ? ` · out ${d.out1}` : ''}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </React.Fragment>
              ))}
            </>
          );
        })() : view === 'today' ? (
          <>
            <div style={{ ...ui.thead, gridTemplateColumns: todayCols, gap: 12 }}>
              <span>Student</span>
              {cls.classType === 'weekday'
                ? <><span>Mark</span><span>In</span><span>Out</span><span /></>
                : <><span>AM</span><span>In</span><span>Out</span><span /><span>PM</span><span>In</span><span>Out</span><span /></>}
            </div>
            {loading ? (
              <div style={{ padding: 20, color: C.faint }}>Loading…</div>
            ) : students.length === 0 ? (
              <div style={{ padding: 20, color: C.faint }}>No students yet — switch to Manage to add your class.</div>
            ) : students.map(stu => (
              <div key={stu.id} style={{ ...ui.tr, gridTemplateColumns: todayCols, gap: 12 }}>
                <span style={{ fontWeight: 600 }}>
                  {stu.name}
                  {cls.hasSections && <span style={{ ...ui.sTag, marginLeft: 8 }}>S{stu.section}</span>}
                </span>
                {sess.map(se => <Session key={se} stu={stu} se={se} />)}
                {cls.classType === 'weekday' && <span />}
              </div>
            ))}
          </>
        ) : (
          <>
            <div style={{ ...ui.thead, gridTemplateColumns: manageCols, gap: 12 }}>
              <span>Student</span>
              {cls.hasSections && <span>Section</span>}
              <span style={{ textAlign: 'right' as const }}>Actions</span>
            </div>
            {loading ? (
              <div style={{ padding: 20, color: C.faint }}>Loading…</div>
            ) : students.length === 0 ? (
              <div style={{ padding: 20, color: C.faint }}>No students yet — add your class below.</div>
            ) : students.map(stu => (
              <div key={stu.id} style={{ ...ui.tr, gridTemplateColumns: manageCols, gap: 12 }}>
                {editingId === stu.id ? (
                  <span style={{ display: 'inline-flex', gap: 6 }}>
                    <input
                      style={{ ...ui.tInput, width: 200 }} value={editName} autoFocus
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveName(stu.id); if (e.key === 'Escape') setEditingId(null); }}
                    />
                    <button style={{ ...ui.tBtn, color: C.indigo, borderColor: C.indigo }} onClick={() => saveName(stu.id)}>Save</button>
                  </span>
                ) : (
                  <span style={{ fontWeight: 600 }}>{stu.name}</span>
                )}
                {cls.hasSections && (
                  <span style={{ display: 'inline-flex', border: `1px solid ${C.line}`, borderRadius: 9, overflow: 'hidden', width: 'fit-content' }}>
                    {[1, 2].map(n => (
                      <button key={n} style={{
                        fontFamily: 'inherit', cursor: 'pointer', border: 'none', padding: '0 12px', height: 28,
                        fontWeight: 600, fontSize: '0.8rem',
                        background: stu.section === n ? C.indigoSoft : '#fff',
                        color: stu.section === n ? C.indigo : C.faint,
                      }} onClick={() => stu.section !== n && moveToSection(stu.id, n)}>S{n}</button>
                    ))}
                  </span>
                )}
                <span style={{ display: 'inline-flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button style={ui.tBtn} onClick={() => { setEditingId(stu.id); setEditName(stu.name); }}>Rename</button>
                  <button style={ui.tDanger} onClick={() => setPendingDelete(stu)}>Delete</button>
                </span>
              </div>
            ))}
            {/* add row lives inside the table */}
            <div style={{ display: 'flex', gap: 10, padding: '14px 18px', background: C.bgSoft, flexWrap: 'wrap' }}>
              <input
                style={{ ...ui.input, minWidth: 220, flex: 1 }}
                placeholder="New student name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addStudent(); }}
              />
              {cls.hasSections && (
                <div style={ui.seg}>
                  <button style={ui.segBtn(newSection === 1)} onClick={() => setNewSection(1)}>Section 1</button>
                  <button style={ui.segBtn(newSection === 2)} onClick={() => setNewSection(2)}>Section 2</button>
                </div>
              )}
              <button style={ui.primary} onClick={addStudent}>Add student</button>
            </div>
          </>
        )}
      </div>

      {/* ---- manual check-in dialog ---- */}
      {pendingIn && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
          onClick={() => setPendingIn(null)}
        >
          <div
            style={{ background: '#fff', borderRadius: 20, padding: '28px 30px', width: 'min(430px, 90vw)', boxShadow: '0 24px 60px -12px rgba(0,0,0,0.3)', fontFamily: 'inherit' }}
            onClick={e => e.stopPropagation()}
          >
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

      {/* ---- clear check-in dialog ---- */}
      {pendingClear && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
          onClick={() => setPendingClear(null)}
        >
          <div
            style={{ background: '#fff', borderRadius: 20, padding: '28px 30px', width: 'min(430px, 90vw)', boxShadow: '0 24px 60px -12px rgba(0,0,0,0.3)', fontFamily: 'inherit' }}
            onClick={e => e.stopPropagation()}
          >
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

      {/* ---- delete dialog ---- */}
      {pendingDelete && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
          onClick={() => setPendingDelete(null)}
        >
          <div
            style={{ background: '#fff', borderRadius: 20, padding: '28px 30px', width: 'min(420px, 90vw)', boxShadow: '0 24px 60px -12px rgba(0,0,0,0.3)', fontFamily: 'inherit' }}
            onClick={e => e.stopPropagation()}
          >
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

      {/* ---- settings ---- */}
      {showSettings && (
        <div style={{ background: C.bgSoft, border: `1px solid ${C.line}`, borderRadius: 16, padding: '18px 20px', marginTop: 22, boxSizing: 'border-box', maxWidth: '100%', overflowX: 'hidden' }}>
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
            These drive the P / L / A marks and decide when the QR code works.
            Saving applies everywhere at once — the student page and the database follow immediately.
          </p>

          {/* Level 4 · Morning */}
          <div style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 14, padding: '14px 16px', marginBottom: 10, boxSizing: 'border-box', maxWidth: '100%' }}>
            <div style={{ fontWeight: 600, marginBottom: 10 }}>Level 4 · Morning</div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <label style={{ fontSize: '0.82rem', color: C.sub }}>On time until<br />
                <input type="time" style={{ ...ui.input, marginTop: 4, width: 128 }} value={schedDraft.weekday.graceEnd}
                  onChange={e => editSched(['weekday','graceEnd'], e.target.value)} /></label>
              <label style={{ fontSize: '0.82rem', color: C.sub }}>Class ends<br />
                <input type="time" style={{ ...ui.input, marginTop: 4, width: 128 }} value={schedDraft.weekday.dayEnd}
                  onChange={e => editSched(['weekday','dayEnd'], e.target.value)} /></label>
              <label style={{ fontSize: '0.82rem', color: C.sub }}>QR opens<br />
                <input type="time" style={{ ...ui.input, marginTop: 4, width: 128 }} value={schedDraft.weekday.checkinOpen}
                  onChange={e => editSched(['weekday','checkinOpen'], e.target.value)} /></label>
              <label style={{ fontSize: '0.82rem', color: C.sub }}>QR closes<br />
                <input type="time" style={{ ...ui.input, marginTop: 4, width: 128 }} value={schedDraft.weekday.checkinClose}
                  onChange={e => editSched(['weekday','checkinClose'], e.target.value)} /></label>
            </div>
          </div>

          {/* Weekend morning */}
          <div style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 14, padding: '14px 16px', marginBottom: 10, boxSizing: 'border-box', maxWidth: '100%' }}>
            <div style={{ fontWeight: 600, marginBottom: 10 }}>Level 4 · Weekend — morning</div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <label style={{ fontSize: '0.82rem', color: C.sub }}>On time until<br />
                <input type="time" style={{ ...ui.input, marginTop: 4, width: 128 }} value={schedDraft.weekendMorning.graceEnd}
                  onChange={e => editSched(['weekendMorning','graceEnd'], e.target.value)} /></label>
              <label style={{ fontSize: '0.82rem', color: C.sub }}>Absent after<br />
                <input type="time" style={{ ...ui.input, marginTop: 4, width: 128 }} value={schedDraft.weekendMorning.lateCutoff}
                  onChange={e => editSched(['weekendMorning','lateCutoff'], e.target.value)} /></label>
              <label style={{ fontSize: '0.82rem', color: C.sub }}>Session ends<br />
                <input type="time" style={{ ...ui.input, marginTop: 4, width: 128 }} value={schedDraft.weekendMorning.sessionEnd}
                  onChange={e => editSched(['weekendMorning','sessionEnd'], e.target.value)} /></label>
              <label style={{ fontSize: '0.82rem', color: C.sub }}>QR opens<br />
                <input type="time" style={{ ...ui.input, marginTop: 4, width: 128 }} value={schedDraft.weekendMorning.checkinOpen}
                  onChange={e => editSched(['weekendMorning','checkinOpen'], e.target.value)} /></label>
              <label style={{ fontSize: '0.82rem', color: C.sub }}>QR closes<br />
                <input type="time" style={{ ...ui.input, marginTop: 4, width: 128 }} value={schedDraft.weekendMorning.checkinClose}
                  onChange={e => editSched(['weekendMorning','checkinClose'], e.target.value)} /></label>
            </div>
          </div>

          {/* Weekend afternoon */}
          <div style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 14, padding: '14px 16px', marginBottom: 12, boxSizing: 'border-box', maxWidth: '100%' }}>
            <div style={{ fontWeight: 600, marginBottom: 10 }}>Level 4 · Weekend — afternoon</div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <label style={{ fontSize: '0.82rem', color: C.sub }}>Back by<br />
                <input type="time" style={{ ...ui.input, marginTop: 4, width: 128 }} value={schedDraft.weekendAfternoon.graceEnd}
                  onChange={e => editSched(['weekendAfternoon','graceEnd'], e.target.value)} /></label>
              <label style={{ fontSize: '0.82rem', color: C.sub }}>Class ends<br />
                <input type="time" style={{ ...ui.input, marginTop: 4, width: 128 }} value={schedDraft.weekendAfternoon.sessionEnd}
                  onChange={e => editSched(['weekendAfternoon','sessionEnd'], e.target.value)} /></label>
              <label style={{ fontSize: '0.82rem', color: C.sub }}>QR opens<br />
                <input type="time" style={{ ...ui.input, marginTop: 4, width: 128 }} value={schedDraft.weekendAfternoon.checkinOpen}
                  onChange={e => editSched(['weekendAfternoon','checkinOpen'], e.target.value)} /></label>
              <label style={{ fontSize: '0.82rem', color: C.sub }}>QR closes<br />
                <input type="time" style={{ ...ui.input, marginTop: 4, width: 128 }} value={schedDraft.weekendAfternoon.checkinClose}
                  onChange={e => editSched(['weekendAfternoon','checkinClose'], e.target.value)} /></label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <button style={{ ...ui.primary, opacity: schedDirty ? 1 : 0.45, cursor: schedDirty ? 'pointer' : 'default' }}
              disabled={!schedDirty} onClick={() => saveSchedule(schedDraft)}>Save times</button>
            {schedDirty && <button style={ui.secondary} onClick={() => setSchedDraft(schedule)}>Discard</button>}
            <button style={ui.secondary} onClick={() => setSchedDraft(normaliseSchedule(null))}>Reset to defaults</button>
            {schedMsg && <span style={{ fontSize: '0.85rem', color: C.sub }}>{schedMsg}</span>}
          </div>

          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.7px', color: C.faint, fontWeight: 700, margin: '22px 0 8px' }}>Testing</div>
          <label style={{ display: 'inline-flex', alignItems: 'flex-start', gap: 8, fontSize: '0.88rem', color: C.sub, cursor: 'pointer', lineHeight: 1.5, maxWidth: 620 }}>
            <input type="checkbox" style={{ marginTop: 3 }} checked={Boolean(schedule.testingMode)}
              onChange={e => saveSchedule({ ...schedule, testingMode: e.target.checked })} />
            <span>
              <strong style={{ color: C.ink }}>Accept the QR at any hour</strong> — for testing outside class time.
              {schedule.testingMode && <span style={{ color: C.red, fontWeight: 600 }}> Currently ON — turn this off before class.</span>}
            </span>
          </label>

          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.7px', color: C.faint, fontWeight: 700, margin: '22px 0 10px' }}>Screen code</div>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.88rem', color: C.sub, cursor: 'pointer' }}>
            <input type="checkbox" checked={codeOn} onChange={e => toggleCode(e.target.checked)} />
            Only accept check-ins scanned from the classroom screen
          </label>
        </div>
      )}
    </div>
  );
}

export default AttendancePortal;