import React, { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '../supabaseClient';
import { windowFor, isCheckInOpen, nowInNewYork, type ScheduleConfig, DEFAULT_SCHEDULE, normaliseSchedule } from './attendanceScoring';

// Public, no-login attendance check-in. Students scan the QR on the
// classroom screen, find their name in a list, and CONFIRM before their
// arrival is stamped — a wrong tap can always be backed out of.
// Mounted at /checkin, outside the app chrome and outside any Clerk gate.

type ClassType = 'weekday' | 'weekend';
type Session = 'single' | 'morning' | 'afternoon';

interface Student { id: string; name: string; section: number; }

const INDIGO = '#4F46E5';
const GREEN = '#059669';

const CLASS_TITLE: Record<ClassType, string> = {
  weekday: 'Level 4 · Morning',
  weekend: 'Level 4 · Weekend',
};
// The hours shown here follow the saved schedule, so students never see
// stale times after the teacher edits them in Settings.
const classSub = (c: ClassType, sc: ScheduleConfig): string =>
  c === 'weekday'
    ? `Sections 1 & 2 · ${hm24To12(sc.weekday.checkinOpen)} – ${hm24To12(sc.weekday.dayEnd)}`
    : `Section 1 · ${hm24To12(sc.weekendMorning.checkinOpen)} – ${hm24To12(sc.weekendAfternoon.sessionEnd)}`;

const s: Record<string, any> = {
  page: { fontFamily: '"Fredoka", sans-serif', background: 'linear-gradient(180deg, #EEF2FF 0%, #F3F6F8 220px)', minHeight: '100vh', color: '#0F172A', padding: '28px 16px 64px', boxSizing: 'border-box' },
  wrap: { maxWidth: 560, margin: '0 auto' },

  head: { textAlign: 'center', marginBottom: 20 },
  kicker: { display: 'inline-block', background: '#fff', color: INDIGO, border: '1px solid #E0E7FF', borderRadius: 9999, padding: '5px 14px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' as const, marginBottom: 12 },
  title: { fontSize: '1.75rem', fontWeight: 600, letterSpacing: '-0.5px', margin: '0 0 4px' },
  sub: { color: '#3F4C63', fontSize: '0.95rem', margin: 0 },

  sessRow: { display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' as const, margin: '16px 0 20px' },
  pill: (active: boolean) => ({ background: active ? INDIGO : '#fff', color: active ? '#fff' : '#3F4C63', border: active ? 'none' : '1px solid #E2E8F0', padding: '9px 20px', borderRadius: 9999, fontWeight: 600, fontSize: '0.92rem', cursor: 'pointer', fontFamily: 'inherit' }),

  filterRow: { display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' as const, marginBottom: 12 },
  chip: (active: boolean) => ({
    fontFamily: 'inherit', cursor: 'pointer', borderRadius: 9999, padding: '8px 18px',
    fontWeight: 600, fontSize: '0.88rem',
    background: active ? INDIGO : '#fff', color: active ? '#fff' : '#3F4C63',
    border: active ? 'none' : '1px solid #E2E8F0',
  }),
  search: { fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' as const, border: '1px solid #E2E8F0', borderRadius: 14, padding: '13px 16px', fontSize: '1rem', color: '#0F172A', background: '#fff', marginBottom: 12 },
  list: { background: '#fff', border: '1px solid #EEF2F7', borderRadius: 20, overflow: 'hidden', boxShadow: '0 12px 40px -18px rgba(15,23,42,0.18)' },
  row: (done: boolean) => ({
    width: '100%', textAlign: 'left' as const, fontFamily: 'inherit', cursor: done ? 'default' : 'pointer',
    display: 'flex', alignItems: 'center', gap: 12,
    background: '#fff', border: 'none', borderBottom: '1px solid #F1F5F9',
    padding: '14px 16px', transition: 'background 0.12s',
  }),
  // green check square, shown only once a student is checked in
  avatar: (_done: boolean) => ({
    width: 34, height: 34, borderRadius: 11, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: '0.95rem',
    background: GREEN, color: '#fff',
  }),
  rowName: { fontWeight: 600, fontSize: '1.02rem', color: '#0F172A' },
  sTag: { display: 'inline-block', background: '#EEF2F7', color: '#3F4C63', borderRadius: 6, padding: '1px 7px', fontSize: '0.72rem', fontWeight: 700, marginLeft: 8, verticalAlign: 'middle' },
  stamp: { marginLeft: 'auto', background: '#ECFDF5', color: GREEN, borderRadius: 9999, padding: '5px 12px', fontWeight: 700, fontSize: '0.82rem', whiteSpace: 'nowrap' as const },
  hint: { marginLeft: 'auto', color: '#64748B', fontSize: '0.85rem', whiteSpace: 'nowrap' as const },

  card: { background: '#fff', borderRadius: 20, padding: '40px 24px', textAlign: 'center' as const, color: '#3F4C63', boxShadow: '0 12px 40px -18px rgba(15,23,42,0.18)' },

  overlay: { position: 'fixed' as const, inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 999 },
  sheet: { background: '#fff', borderRadius: '24px 24px 0 0', padding: '14px 24px calc(28px + env(safe-area-inset-bottom))', width: 'min(560px, 100vw)', boxSizing: 'border-box' as const, textAlign: 'center' as const },
  grabber: { width: 40, height: 4, borderRadius: 9999, background: '#E2E8F0', margin: '0 auto 20px' },
  bigName: { fontSize: '1.5rem', fontWeight: 600, margin: '0 0 4px', letterSpacing: '-0.4px' },
  confirmBtn: { fontFamily: 'inherit', width: '100%', background: INDIGO, color: '#fff', border: 'none', borderRadius: 14, padding: '16px', fontWeight: 600, fontSize: '1.05rem', cursor: 'pointer', marginTop: 20, boxShadow: '0 10px 24px -8px rgba(79,70,229,0.5)' },
  notMeBtn: { fontFamily: 'inherit', width: '100%', background: '#fff', color: '#3F4C63', border: '1px solid #E2E8F0', borderRadius: 14, padding: '14px', fontWeight: 600, fontSize: '0.98rem', cursor: 'pointer', marginTop: 10 },

  toast: { position: 'fixed' as const, left: '50%', bottom: 'calc(24px + env(safe-area-inset-bottom))', transform: 'translateX(-50%)', background: '#0F172A', color: '#fff', borderRadius: 9999, padding: '12px 22px', fontWeight: 600, fontSize: '0.92rem', boxShadow: '0 12px 30px rgba(0,0,0,0.25)', zIndex: 1000, whiteSpace: 'nowrap' as const },
};

function toHM(iso: string): string {
  const d = new Date(iso);
  let h = d.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${String(d.getMinutes()).padStart(2, '0')} ${ampm}`;
}
function hm24To12(hm: string | undefined): string {
  if (!hm) return '';
  const [H, M] = hm.split(':').map(Number);
  const ampm = H >= 12 ? 'PM' : 'AM';
  return `${H % 12 || 12}:${String(M).padStart(2, '0')} ${ampm}`;
}
// The QR on the classroom screen carries ?c=class&s=session&t=token
function urlParams() {
  if (typeof window === 'undefined') return { c: null, s: null, t: null };
  const q = new URLSearchParams(window.location.search);
  return { c: q.get('c'), s: q.get('s'), t: q.get('t') };
}
function defaultClass(): ClassType {
  const day = new Date().getDay(); // 5 = Fri, 6 = Sat
  return day === 5 || day === 6 ? 'weekend' : 'weekday';
}
function defaultSession(cls: ClassType): Session {
  if (cls === 'weekday') return 'single';
  return new Date().getHours() < 13 ? 'morning' : 'afternoon';
}

export function CheckInPage() {
  const params = urlParams();
  const [classType] = useState<ClassType>(
    params.c === 'weekend' || params.c === 'weekday' ? params.c : defaultClass(),
  );
  const [session, setSession] = useState<Session>(
    params.s === 'single' || params.s === 'morning' || params.s === 'afternoon'
      ? params.s
      : defaultSession(params.c === 'weekend' ? 'weekend' : defaultClass()),
  );
  const [students, setStudents] = useState<Student[]>([]);
  const [done, setDone] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState<Student | null>(null);
  const [notice, setNotice] = useState('');
  const [section, setSection] = useState<1 | 2>(1);   // morning class only
  const [query, setQuery] = useState('');
  const [schedule, setSchedule] = useState<ScheduleConfig>(DEFAULT_SCHEDULE);
  const [toast, setToast] = useState('');

  const [clock, setClock] = useState<string>(nowInNewYork());
  useEffect(() => {
    const t = setInterval(() => setClock(nowInNewYork()), 20000);
    return () => clearInterval(t);
  }, []);
  const open = isCheckInOpen(session, clock, schedule);

  const supabase = getSupabaseClient(); // no token -> anonymous/public
  const info = { title: CLASS_TITLE[classType], sub: classSub(classType, schedule) };

  const load = useCallback(async () => {
    setLoading(true);
    const { data: roster } = await supabase
      .from('attendance_students')
      .select('id, name, section')
      .eq('class_type', classType)
      .eq('active', true)
      .order('name', { ascending: true });

    const { data: logs } = await supabase
      .from('attendance_logs')
      .select('student_id, check_in')
      .eq('session', session)
      .eq('log_date', new Date().toLocaleDateString('en-CA'));

    const map: Record<string, string> = {};
    (logs || []).forEach((l: any) => { if (l.check_in) map[l.student_id] = l.check_in; });

    const { data: schedRow } = await supabase
      .from('attendance_settings')
      .select('value')
      .eq('key', 'schedule')
      .maybeSingle();
    setSchedule(normaliseSchedule(schedRow?.value));

    setStudents((roster || []).map((r: any) => ({ id: r.id, name: r.name, section: r.section ?? 1 })));
    setDone(map);
    setLoading(false);
  }, [classType, session]);

  useEffect(() => { load(); }, [load]);

  const confirmCheckIn = async () => {
    const student = confirming;
    if (!student || saving) return;
    setSaving(true);
    const nowIso = new Date().toISOString();
    const { error } = await supabase
      .from('attendance_logs')
      .insert({ student_id: student.id, session, check_in: nowIso, token: params.t });

    if (!error) {
      setDone(prev => ({ ...prev, [student.id]: nowIso }));
      setToast(`You're checked in, ${student.name.split(' ')[0]} — ${toHM(nowIso)}`);
      setTimeout(() => setToast(''), 3200);
    } else if (error.code === '23505') {
      await load(); // already in earlier — keep their first, real time
    } else {
      setNotice('That code is out of date — please scan the code on the screen again.');
    }
    setSaving(false);
    setConfirming(null);
  };

  // Section chips narrow the list; search narrows it further. A searching
  // student sees matches from either section, so nobody gets stuck on the
  // wrong chip.
  const q = query.trim().toLowerCase();
  const visible = students.filter(st => {
    if (q) return st.name.toLowerCase().includes(q);
    return classType === 'weekday' ? st.section === section : true;
  });

  return (
    <div style={s.page}>
      <div style={s.wrap}>
        <header style={s.head}>
          <span style={s.kicker}>Attendance check-in</span>
          <h1 style={s.title}>{info.title}</h1>
          <p style={s.sub}>{info.sub}</p>
        </header>

        {classType === 'weekend' && (
          <div style={s.sessRow}>
            <button style={s.pill(session === 'morning')} onClick={() => setSession('morning')}>Morning</button>
            <button style={s.pill(session === 'afternoon')} onClick={() => setSession('afternoon')}>Afternoon</button>
          </div>
        )}

        {!open ? (
          <div style={s.card}>
            <p style={{ fontSize: '1.15rem', fontWeight: 600, margin: '0 0 8px', color: '#0F172A' }}>Check-in is closed</p>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              It opens at {hm24To12(windowFor(session, schedule)?.open)} and closes at {hm24To12(windowFor(session, schedule)?.close)}.<br />
              If you are here and it will not open, tell your teacher.
            </p>
          </div>
        ) : notice ? (
          <div style={s.card}>
            <p style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 8px', color: '#0F172A' }}>Please scan again</p>
            <p style={{ margin: 0, lineHeight: 1.6 }}>{notice}</p>
          </div>
        ) : loading ? (
          <div style={s.card}>Loading…</div>
        ) : students.length === 0 ? (
          <div style={s.card}>No students on this list yet. Your teacher will add you.</div>
        ) : (
          <>
            {classType === 'weekday' && (
              <div style={s.filterRow}>
                <button style={s.chip(section === 1)} onClick={() => { setSection(1); setQuery(''); }}>Section 1</button>
                <button style={s.chip(section === 2)} onClick={() => { setSection(2); setQuery(''); }}>Section 2</button>
              </div>
            )}

            <input
              style={s.search}
              placeholder="Search your name…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />

            <div style={s.list}>
              {visible.length === 0 && (
                <div style={{ padding: '22px 18px', color: '#64748B', textAlign: 'center' }}>
                  No match{classType === 'weekday' ? ` in Section ${section}` : ''}. Check the other section, or clear the search.
                </div>
              )}
              {visible.map(st => {
                const isDone = !!done[st.id];
                return (
                  <button
                    key={st.id}
                    style={s.row(isDone)}
                    onClick={() => !isDone && setConfirming(st)}
                    disabled={isDone}
                  >
                    {isDone && <span style={s.avatar(true)}>✓</span>}
                    <span>
                      <span style={s.rowName}>{st.name}</span>
                      {classType === 'weekday' && <span style={s.sTag}>S{st.section}</span>}
                    </span>
                    {isDone
                      ? <span style={s.stamp}>in {toHM(done[st.id])}</span>
                      : <span style={s.hint}>tap to check in ›</span>}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* confirm sheet — a wrong tap costs nothing */}
      {confirming && (
        <div style={s.overlay} onClick={() => !saving && setConfirming(null)}>
          <div style={s.sheet} onClick={e => e.stopPropagation()}>
            <div style={s.grabber} />
            <p style={{ color: '#64748B', fontSize: '0.8rem', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 700 }}>
              Checking in as
            </p>
            <p style={s.bigName}>{confirming.name}</p>
            <p style={{ color: '#3F4C63', fontSize: '0.95rem', fontWeight: 500, margin: 0 }}>
              {info.title}{classType === 'weekday' ? ` · Section ${confirming.section}` : ''} · {hm24To12(clock)}
            </p>
            <button style={s.confirmBtn} onClick={confirmCheckIn} disabled={saving}>
              {saving ? 'Checking you in…' : 'Yes, check me in'}
            </button>
            <button style={s.notMeBtn} onClick={() => setConfirming(null)} disabled={saving}>
              That's not me — go back
            </button>
          </div>
        </div>
      )}

      {toast && <div style={s.toast}>{toast}</div>}
    </div>
  );
}

export default CheckInPage;