import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSupabaseClient } from '../supabaseClient';

// ──────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────
type RosterPerson = { name: string; session: string };
type ExamQueue = {
  id: string;
  code: string;
  title: string;
  examiner_name: string | null;
  roster: RosterPerson[];
  is_open: boolean;
};
type Entry = { name: string; status: string };

type Phase = 'loading' | 'notfound' | 'codeentry' | 'closed' | 'session' | 'name' | 'confirm' | 'straggler' | 'done';

// ──────────────────────────────────────────────────────────────────────────
// Icons
// ──────────────────────────────────────────────────────────────────────────
const IconCheck = ({ size = 20 }: { size?: number }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>);
const IconPhoneOff = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"></path><line x1="23" y1="1" x2="1" y2="23"></line></svg>);
const IconBack = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"></path></svg>);

// ──────────────────────────────────────────────────────────────────────────
// Component  (handles both  /exam  and  /exam/:code )
// ──────────────────────────────────────────────────────────────────────────
export const ExamCheckIn: React.FC = () => {
  const { code: rawCode } = useParams();
  const navigate = useNavigate();
  const code = (rawCode || '').toUpperCase().trim();

  const [phase, setPhase] = useState<Phase>(rawCode ? 'loading' : 'codeentry');
  const [queue, setQueue] = useState<ExamQueue | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [chosenSession, setChosenSession] = useState('');
  const [chosenName, setChosenName] = useState('');
  const [typedCode, setTypedCode] = useState('');
  const [stragglerName, setStragglerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const storeKey = `ll_exam_checkin_${code}`;

  // ── Load queue + entries ────────────────────────────────────────────────────
  const loadEntries = async (queueId: string) => {
    const db = getSupabaseClient();
    const { data } = await db.from('exam_queue_entries').select('name,status').eq('queue_id', queueId);
    setEntries((data as Entry[]) || []);
  };

  useEffect(() => {
    if (!rawCode) { setPhase('codeentry'); return; }
    let cancelled = false;
    (async () => {
      try {
        const db = getSupabaseClient();
        const { data, error: qErr } = await db.from('exam_queues').select('id,code,title,examiner_name,roster,is_open').eq('code', code).maybeSingle();
        if (cancelled) return;
        if (qErr || !data) { setPhase('notfound'); return; }
        const q = data as ExamQueue;
        setQueue(q);
        await loadEntries(q.id);
        if (cancelled) return;
        // Already checked in on this device?
        const prior = localStorage.getItem(storeKey);
        if (prior) { setChosenName(prior); setPhase('done'); return; }
        if (!q.is_open) { setPhase('closed'); return; }
        // Auto-skip the section step when there's only one (or none).
        const uniq: string[] = [];
        (q.roster || []).forEach(p => { if (!uniq.includes(p.session)) uniq.push(p.session); });
        if (uniq.length <= 1) { setChosenSession(uniq[0] || ''); setPhase('name'); }
        else setPhase('session');
      } catch { if (!cancelled) setPhase('notfound'); }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawCode, code]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const sessions = useMemo(() => {
    const seen: string[] = [];
    (queue?.roster || []).forEach(p => { if (!seen.includes(p.session)) seen.push(p.session); });
    return seen;
  }, [queue]);

  const takenSet = useMemo(() => new Set(entries.map(e => e.name.toLowerCase())), [entries]);
  const namesForSession = (label: string) => (queue?.roster || []).filter(p => p.session === label);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const pickSession = async (label: string) => {
    setChosenSession(label);
    setError('');
    if (queue) await loadEntries(queue.id); // refresh so just-taken names show as taken
    setPhase('name');
  };

  const pickName = (name: string) => {
    if (takenSet.has(name.toLowerCase())) return;
    setChosenName(name);
    setPhase('confirm');
  };

  const doCheckIn = async (name: string, session: string, selfAdded: boolean) => {
    if (!queue) return;
    setIsSubmitting(true);
    setError('');
    try {
      const db = getSupabaseClient();
      const { error: insErr } = await db.from('exam_queue_entries').insert([{
        queue_id: queue.id,
        name: name.trim(),
        session_label: session,
        status: 'waiting',
        self_added: selfAdded,
      }]);
      if (insErr) {
        // unique (queue_id, name) — someone already took this exact name
        if (String(insErr.message || '').toLowerCase().includes('duplicate')) {
          await loadEntries(queue.id);
          setError('That name was just checked in by someone. Pick another, or use "not on the list".');
          setPhase('name');
          return;
        }
        throw insErr;
      }
      localStorage.setItem(storeKey, name.trim());
      setChosenName(name.trim());
      setPhase('done');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally { setIsSubmitting(false); }
  };

  const submitStraggler = async () => {
    const name = stragglerName.trim();
    if (!name) { setError('Type your name.'); return; }
    await doCheckIn(name, chosenSession || sessions[0] || 'Section 1', true);
  };

  const resetMe = () => {
    localStorage.removeItem(storeKey);
    setChosenName('');
    if (!queue?.is_open) { setPhase('closed'); return; }
    if (sessions.length <= 1) { setChosenSession(sessions[0] || ''); setPhase('name'); }
    else { setChosenSession(''); setPhase('session'); }
  };

  // ── Styles ──────────────────────────────────────────────────────────────────
  const ROSE = '#E11D48';
  const page: React.CSSProperties = { minHeight: '100vh', background: '#F3F6F8', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 18px 60px' };
  const card: React.CSSProperties = { width: '100%', maxWidth: '440px', background: '#fff', borderRadius: '28px', border: '1px solid #E2E8F0', boxShadow: '0 20px 50px rgba(15,23,42,0.06)', padding: '28px 24px', marginTop: '24px' };
  const bigBtn: React.CSSProperties = { width: '100%', padding: '18px', borderRadius: '16px', border: 'none', fontSize: '1.15rem', fontWeight: 700, cursor: 'pointer' };
  const nameBtn = (taken: boolean): React.CSSProperties => ({ width: '100%', textAlign: 'left', padding: '18px 20px', borderRadius: '14px', border: `2px solid ${taken ? '#E2E8F0' : '#EEF2FF'}`, background: taken ? '#F8FAFC' : '#fff', color: taken ? '#94A3B8' : '#0F172A', fontSize: '1.1rem', fontWeight: 700, cursor: taken ? 'default' : 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' });
  const phonesAway = (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#FEF2F2', color: '#DC2626', padding: '8px 16px', borderRadius: '9999px', fontWeight: 700, fontSize: '0.9rem' }}>
      <IconPhoneOff /> Phones away after you check in
    </div>
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={page}>
      <div style={card}>

        {phase === 'loading' && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8', fontSize: '1.1rem' }}>Loading…</div>
        )}

        {phase === 'codeentry' && (
          <div>
            <h1 style={{ margin: '0 0 8px', fontSize: '1.8rem', color: '#0F172A', fontWeight: 700, textAlign: 'center' }}>Exam check-in</h1>
            <p style={{ margin: '0 0 24px', color: '#64748B', textAlign: 'center' }}>Enter the code shown on the screen.</p>
            <input value={typedCode} onChange={e => setTypedCode(e.target.value.toUpperCase())} placeholder="e.g. Q9GV4E" maxLength={8}
              style={{ width: '100%', padding: '18px', borderRadius: '14px', border: '2px solid #E2E8F0', fontSize: '1.6rem', fontWeight: 800, textAlign: 'center', letterSpacing: '4px', outline: 'none', marginBottom: '16px', color: '#0F172A' }} />
            <button onClick={() => typedCode.trim() && navigate(`/exam/${typedCode.trim()}`)} disabled={!typedCode.trim()} style={{ ...bigBtn, background: typedCode.trim() ? ROSE : '#E2E8F0', color: typedCode.trim() ? '#fff' : '#94A3B8' }}>Continue</button>
          </div>
        )}

        {phase === 'notfound' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: '64px', height: '64px', background: '#FEF2F2', color: '#EF4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '2rem', fontWeight: 800 }}>!</div>
            <h1 style={{ margin: '0 0 8px', fontSize: '1.5rem', color: '#0F172A', fontWeight: 700 }}>Exam not found</h1>
            <p style={{ margin: '0 0 24px', color: '#64748B' }}>The code <strong>{code}</strong> doesn't match any exam. Double-check the code on the screen.</p>
            <button onClick={() => navigate('/exam')} style={{ ...bigBtn, background: '#F1F5F9', color: '#475569' }}>Try another code</button>
          </div>
        )}

        {phase === 'closed' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <h1 style={{ margin: '0 0 8px', fontSize: '1.5rem', color: '#0F172A', fontWeight: 700 }}>Check-in is closed</h1>
            <p style={{ margin: 0, color: '#64748B' }}>{queue?.title}</p>
            <p style={{ margin: '16px 0 0', color: '#64748B' }}>Please see the examiner.</p>
          </div>
        )}

        {(phase === 'session' || phase === 'name' || phase === 'confirm' || phase === 'straggler') && queue && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '0.85rem', color: ROSE, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Speaking exam check-in</div>
              <h1 style={{ margin: '0 0 14px', fontSize: '1.4rem', color: '#0F172A', fontWeight: 700, lineHeight: 1.25 }}>{queue.title}</h1>
              {phonesAway}
            </div>

            {error && <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '12px 16px', borderRadius: '12px', marginBottom: '16px', fontSize: '0.95rem', fontWeight: 600, textAlign: 'center' }}>{error}</div>}

            {/* Step 1: session */}
            {phase === 'session' && (
              <div>
                <h2 style={{ fontSize: '1.1rem', color: '#475569', margin: '0 0 14px', textAlign: 'center' }}>Which section are you in?</h2>
                {sessions.map(s => (
                  <button key={s} onClick={() => pickSession(s)} style={{ ...bigBtn, background: '#EEF2FF', color: '#4F46E5', marginBottom: '12px' }}>{s}</button>
                ))}
                <button onClick={() => { setChosenSession(sessions[0] || ''); setPhase('straggler'); }} style={{ ...bigBtn, background: 'transparent', color: '#94A3B8', fontWeight: 600, fontSize: '0.95rem', padding: '12px' }}>I'm not on a section list</button>
              </div>
            )}

            {/* Step 2: name */}
            {phase === 'name' && (
              <div>
                {sessions.length > 1 && (
                  <button onClick={() => setPhase('session')} style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, marginBottom: '12px', padding: 0 }}><IconBack /> {chosenSession}</button>
                )}
                <h2 style={{ fontSize: '1.1rem', color: '#475569', margin: '0 0 14px', textAlign: 'center' }}>Tap your name</h2>
                <div style={{ maxHeight: '50vh', overflowY: 'auto', paddingRight: '4px' }}>
                  {namesForSession(chosenSession).map(p => {
                    const taken = takenSet.has(p.name.toLowerCase());
                    return (
                      <button key={p.name} onClick={() => pickName(p.name)} disabled={taken} style={nameBtn(taken)}>
                        <span>{p.name}</span>
                        {taken && <span style={{ fontSize: '0.8rem', color: '#16A34A', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><IconCheck size={14} /> Checked in</span>}
                      </button>
                    );
                  })}
                </div>
                <button onClick={() => setPhase('straggler')} style={{ ...bigBtn, background: 'transparent', color: '#94A3B8', fontWeight: 600, fontSize: '0.95rem', padding: '12px', marginTop: '4px' }}>My name isn't here</button>
              </div>
            )}

            {/* Step 3: confirm */}
            {phase === 'confirm' && (
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.1rem', color: '#475569', margin: '0 0 8px' }}>You're</h2>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', margin: '0 0 8px' }}>{chosenName}?</div>
                <div style={{ color: '#94A3B8', marginBottom: '24px' }}>{chosenSession}</div>
                <button onClick={() => doCheckIn(chosenName, chosenSession, false)} disabled={isSubmitting} style={{ ...bigBtn, background: ROSE, color: '#fff', marginBottom: '12px' }}>{isSubmitting ? 'Checking in…' : "Yes, that's me — check in"}</button>
                <button onClick={() => { setChosenName(''); setPhase('name'); }} disabled={isSubmitting} style={{ ...bigBtn, background: '#F1F5F9', color: '#475569' }}>No, go back</button>
              </div>
            )}

            {/* Straggler */}
            {phase === 'straggler' && (
              <div>
                <button onClick={() => setPhase(sessions.length > 1 ? 'session' : 'name')} style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, marginBottom: '12px', padding: 0 }}><IconBack /> Back</button>
                <h2 style={{ fontSize: '1.1rem', color: '#475569', margin: '0 0 8px', textAlign: 'center' }}>Add yourself</h2>
                <p style={{ color: '#94A3B8', fontSize: '0.9rem', textAlign: 'center', margin: '0 0 16px' }}>The examiner will see you flagged for approval.</p>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Your full name</label>
                <input value={stragglerName} onChange={e => setStragglerName(e.target.value)} placeholder="e.g. Amina Khaled" style={{ width: '100%', padding: '16px', borderRadius: '14px', border: '2px solid #E2E8F0', fontSize: '1.1rem', outline: 'none', marginBottom: '16px', color: '#0F172A' }} />
                {sessions.length > 0 && (
                  <>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Your section</label>
                    <select value={chosenSession} onChange={e => setChosenSession(e.target.value)} style={{ width: '100%', padding: '16px', borderRadius: '14px', border: '2px solid #E2E8F0', fontSize: '1.05rem', outline: 'none', marginBottom: '20px', background: '#fff', color: '#0F172A' }}>
                      {sessions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </>
                )}
                <button onClick={submitStraggler} disabled={isSubmitting} style={{ ...bigBtn, background: ROSE, color: '#fff' }}>{isSubmitting ? 'Checking in…' : 'Check in'}</button>
              </div>
            )}
          </>
        )}

        {phase === 'done' && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ width: '88px', height: '88px', background: '#DCFCE7', color: '#16A34A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}><IconCheck size={42} /></div>
            <h1 style={{ margin: '0 0 6px', fontSize: '1.8rem', color: '#0F172A', fontWeight: 800 }}>You're checked in</h1>
            <div style={{ fontSize: '1.3rem', color: '#0F172A', fontWeight: 700, marginBottom: '4px' }}>{chosenName}</div>
            {queue && <div style={{ color: '#94A3B8', marginBottom: '24px' }}>{queue.title}</div>}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#DC2626', fontWeight: 700, marginBottom: '8px' }}><IconPhoneOff /> Put your phone away</div>
              <p style={{ margin: 0, color: '#475569', fontSize: '1.05rem', lineHeight: 1.5 }}>Your place is saved by the exact time you scanned. Watch the screen at the front — it will show when it's your turn.</p>
            </div>
            <button onClick={resetMe} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>This isn't me — check in as someone else</button>
          </div>
        )}

      </div>
    </div>
  );
};