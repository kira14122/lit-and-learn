import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { QRCodeSVG } from 'qrcode.react';
import { getSupabaseClient } from '../supabaseClient';

// Shown on the classroom screen (TV, PC, laptop or your phone).
// Displays a QR code that changes every 5 minutes, so a code texted to
// someone outside the room is dead before it is useful. Keep this open
// in a small window on your laptop for latecomers.
//
// Teacher-only: mount it behind the same admin gate as the portal.

type ClassType = 'weekday' | 'weekend';
type Session = 'single' | 'day';

interface Arrival { name: string; at: string; level?: string; }

const INDIGO = '#4F46E5';
// A classroom screen can't scroll, so show the most recent arrivals and
// summarise the rest. Newest first, which is what students look for.
const MAX_ROWS = 14;

// Values are style objects, plus a few style *builders* (e.g. pill(active)).
const s: Record<string, any> = {
  page: { fontFamily: '"Fredoka", sans-serif', background: '#0F172A', color: '#fff', minHeight: '100vh', padding: '24px 20px 40px', boxSizing: 'border-box' },
  wrap: { maxWidth: 1150, margin: '0 auto' },
  top: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 20 },
  pill: (a: boolean): React.CSSProperties => ({ background: a ? INDIGO : 'transparent', color: a ? '#fff' : '#94A3B8', border: a ? 'none' : '1px solid #334155', padding: '8px 18px', borderRadius: 9999, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.95rem' }),
  grid: { display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(260px, 0.85fr)', gap: 28, alignItems: 'start' },
  qrCard: { background: '#fff', borderRadius: 28, padding: '28px 28px 22px', textAlign: 'center' },
  title: { fontSize: '2.1rem', fontWeight: 600, margin: '0 0 4px', color: '#0F172A', letterSpacing: '-0.5px' },
  sub: { fontSize: '1rem', color: '#64748B', margin: '0 0 18px' },
  refresh: { fontSize: '0.85rem', color: '#94A3B8', marginTop: 14 },
  listCard: { background: '#1E293B', borderRadius: 24, padding: '20px 22px' },
  listHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 },
  row: { display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid #334155', fontSize: '1.15rem' },
  warn: { background: '#FFFBEB', color: '#92400E', borderRadius: 14, padding: '14px 18px', fontSize: '0.95rem', marginBottom: 18 },
};

function defaultClass(): ClassType {
  const d = new Date().getDay(); // 5 = Fri, 6 = Sat
  return d === 5 || d === 6 ? 'weekend' : 'weekday';
}
function defaultSession(c: ClassType): Session {
  return c === 'weekend' ? 'day' : 'single';
}
const toHM = (iso: string) => {
  const d = new Date(iso);
  let h = d.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${String(d.getMinutes()).padStart(2, '0')} ${ampm}`;
};

export function CheckInDisplay() {
  const { getToken } = useAuth();
  const [classType, setClassType] = useState<ClassType>(defaultClass());
  const [session, setSession] = useState<Session>(defaultSession(defaultClass()));
  const [token, setToken] = useState<string | null>(null);
  const [tokenErr, setTokenErr] = useState<string>('');
  const [arrivals, setArrivals] = useState<Arrival[]>([]);
  const [total, setTotal] = useState(0);
  const [visitorArrivals, setVisitorArrivals] = useState<Arrival[]>([]);
  const [listTab, setListTab] = useState<'class' | 'visitors'>('class');

  // If the visitors disappear, fall back to the class list.
  useEffect(() => {
    if (visitorArrivals.length === 0 && listTab === 'visitors') setListTab('class');
  }, [visitorArrivals.length, listTab]);
  const [showList, setShowList] = useState(true);

  // Matches the getToken({template:'supabase'}) call used elsewhere in
  // TeacherDashboard / GradingPortal.
  const authed = useCallback(async () => getSupabaseClient((await getToken({ template: 'supabase' })) ?? undefined), [getToken]);

  // --- current code, refreshed well inside the 5-minute slot ---
  const pullToken = useCallback(async () => {
    try {
      const sb = await authed();
      const { data, error } = await sb.rpc('attendance_current_token', { p_class: classType });
      if (error) { setTokenErr(error.message); return; }
      setTokenErr('');
      setToken((data as string) || null);
    } catch (e: any) {
      setTokenErr(e?.message || 'Could not get the code.');
    }
  }, [authed, classType]);

  useEffect(() => {
    pullToken();
    const t = setInterval(pullToken, 45000);
    return () => clearInterval(t);
  }, [pullToken]);

  // --- who has arrived so far ---
  const pullArrivals = useCallback(async () => {
    const sb = await authed();
    const today = new Date().toLocaleDateString('en-CA');

    const { data: roster } = await sb
      .from('attendance_students')
      .select('id, name')
      .eq('class_type', classType)
      .eq('active', true);

    // Visiting students from a combined class, kept in their own list.
    const { data: vRows } = await sb
      .from('attendance_students')
      .select('id, name, visitor_level, visitor_class')
      .eq('class_type', 'visitor')
      .eq('active', true)
      .eq('visitor_date', today);
    const visitorRoster = (vRows || []).filter((v: any) => (v.visitor_class || 'weekday') === classType);

    const { data: logs } = await sb
      .from('attendance_logs')
      .select('student_id, check_in')
      .eq('log_date', today)
      .eq('session', session);

    const build = (people: any[]): Arrival[] => {
      const names = new Map<string, { name: string; level?: string }>();
      people.forEach((r: any) => names.set(r.id, { name: r.name, level: r.visitor_level }));
      return (logs || [])
        .filter((l: any) => l.check_in && names.has(l.student_id))
        .map((l: any) => ({ name: names.get(l.student_id)!.name, level: names.get(l.student_id)!.level, at: l.check_in }))
        .sort((a, b) => (a.at < b.at ? 1 : -1));
    };

    setArrivals(build(roster || []));
    setTotal((roster || []).length);
    setVisitorArrivals(build(visitorRoster));
  }, [authed, classType, session]);

  useEffect(() => {
    pullArrivals();
    const t = setInterval(pullArrivals, 15000);
    return () => clearInterval(t);
  }, [pullArrivals]);

  const switchClass = (c: ClassType) => { setClassType(c); setSession(defaultSession(c)); };

  const base = typeof window !== 'undefined' ? window.location.origin : '';
  const url = `${base}/checkin?c=${classType}&s=${session}${token ? `&t=${token}` : ''}`;

  return (
    <div style={s.page}>
      <div style={s.wrap}>
        <div style={s.top}>
          <button style={s.pill(classType === 'weekday')} onClick={() => switchClass('weekday')}>Level 4 · Morning</button>
          <button style={s.pill(classType === 'weekend')} onClick={() => switchClass('weekend')}>Level 4 · Weekend</button>

          <div style={{ flex: 1 }} />
          <button style={s.pill(showList)} onClick={() => setShowList(v => !v)}>
            {showList ? 'Hide arrivals' : 'Show arrivals'}
          </button>
        </div>

        {tokenErr && (
          <div style={s.warn}>
            Could not get the rotating code ({tokenErr}). Students can still check in — the
            code is only enforced once you switch it on in the portal.
          </div>
        )}

        <div style={{ ...s.grid, gridTemplateColumns: showList ? s.grid.gridTemplateColumns : '1fr' }}>
          <div style={s.qrCard}>
            <h1 style={s.title}>Check in</h1>
            <p style={s.sub}>Scan this code, then tap your name.</p>
            <QRCodeSVG value={url} size={340} level="M" style={{ width: '100%', height: 'auto', maxWidth: 420 }} />
            <p style={s.refresh}>This code refreshes by itself — no need to do anything.</p>
          </div>

          {showList && (
            <div style={s.listCard}>
              {/* tabs — readable from across the room */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
                <button
                  style={{
                    fontFamily: 'inherit', cursor: 'pointer', borderRadius: 14,
                    padding: '13px 22px', fontWeight: 600, fontSize: '1.25rem', lineHeight: 1.1,
                    background: listTab === 'class' ? '#4F46E5' : 'transparent',
                    color: listTab === 'class' ? '#fff' : '#CBD5E1',
                    border: listTab === 'class' ? 'none' : '1px solid #475569',
                  }}
                  onClick={() => setListTab('class')}
                >
                  Class
                  <span style={{ marginLeft: 10, fontWeight: 500, opacity: 0.85, fontSize: '1.05rem' }}>
                    {arrivals.length}/{total}
                  </span>
                </button>

                {visitorArrivals.length > 0 && (
                  <button
                    style={{
                      fontFamily: 'inherit', cursor: 'pointer', borderRadius: 14,
                      padding: '13px 22px', fontWeight: 600, fontSize: '1.25rem', lineHeight: 1.1,
                      background: listTab === 'visitors' ? '#B45309' : 'transparent',
                      color: listTab === 'visitors' ? '#fff' : '#CBD5E1',
                      border: listTab === 'visitors' ? 'none' : '1px solid #475569',
                    }}
                    onClick={() => setListTab('visitors')}
                  >
                    Visiting
                    <span style={{ marginLeft: 10, fontWeight: 500, opacity: 0.85, fontSize: '1.05rem' }}>
                      {visitorArrivals.length}
                    </span>
                  </button>
                )}
              </div>

              {/* the active list */}
              {listTab === 'class' ? (
                arrivals.length === 0 ? (
                  <p style={{ color: '#94A3B8', margin: '10px 0 0' }}>Nobody yet.</p>
                ) : (
                  <>
                    {arrivals.slice(0, MAX_ROWS).map((a, i) => (
                      <div key={i} style={s.row}>
                        <span>{a.name}</span>
                        <span style={{ color: '#94A3B8' }}>{toHM(a.at)}</span>
                      </div>
                    ))}
                    {arrivals.length > MAX_ROWS && (
                      <div style={{ ...s.row, borderBottom: 'none', color: '#64748B', fontSize: '0.92rem' }}>
                        <span>+ {arrivals.length - MAX_ROWS} more checked in earlier</span>
                        <span />
                      </div>
                    )}
                  </>
                )
              ) : (
                <>
                  {visitorArrivals.slice(0, MAX_ROWS).map((a, i) => (
                    <div key={i} style={s.row}>
                      <span>
                        {a.name}
                        {a.level && (
                          <span style={{
                            marginLeft: 8, background: '#422006', color: '#FCD34D',
                            borderRadius: 6, padding: '2px 7px', fontSize: '0.72rem', fontWeight: 700,
                          }}>{a.level.replace(' · ', ' ')}</span>
                        )}
                      </span>
                      <span style={{ color: '#94A3B8' }}>{toHM(a.at)}</span>
                    </div>
                  ))}
                  {visitorArrivals.length > MAX_ROWS && (
                    <div style={{ ...s.row, borderBottom: 'none', color: '#64748B', fontSize: '0.92rem' }}>
                      <span>+ {visitorArrivals.length - MAX_ROWS} more</span>
                      <span />
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CheckInDisplay;