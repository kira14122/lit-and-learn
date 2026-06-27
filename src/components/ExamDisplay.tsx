import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getSupabaseClient } from '../supabaseClient';

// ──────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────
type ExamQueue = {
  id: string;
  code: string;
  title: string;
  examiner_name: string | null;
  ends_at: string | null;
  display_mode: 'clock' | 'speaking';
  current_entry_id: string | null;
};
type Entry = { id: string; name: string; session_label: string | null; status: string; joined_at: string };

type Phase = 'loading' | 'notfound' | 'ready';

const pad = (n: number) => String(n).padStart(2, '0');

// Crossed-out phone — same icon family as the check-in page (no emoji).
const IconPhoneOff = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"></path>
    <line x1="23" y1="1" x2="1" y2="23"></line>
  </svg>
);

export const ExamDisplay: React.FC = () => {
  const { code: rawCode } = useParams();
  const code = (rawCode || '').toUpperCase().trim();

  const [phase, setPhase] = useState<Phase>('loading');
  const [queue, setQueue] = useState<ExamQueue | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [now, setNow] = useState<Date>(new Date());
  const [flashKey, setFlashKey] = useState(0);
  const [soundReady, setSoundReady] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://litnlearn.com';
  const checkInUrl = `${origin}/exam/${code}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(checkInUrl)}`;

  // ── Audio (Web Audio API; unlocked on first interaction) ────────────────────
  const audioRef = useRef<AudioContext | null>(null);
  const unlockAudio = () => {
    try {
      if (!audioRef.current) {
        const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (Ctx) audioRef.current = new Ctx();
      }
      audioRef.current?.resume();
      if (audioRef.current) setSoundReady(true);
    } catch { /* ignore */ }
  };
  const playChime = () => {
    const ctx = audioRef.current;
    if (!ctx) return;
    const t0 = ctx.currentTime;
    ([[880, 0], [1174.66, 0.16]] as [number, number][]).forEach(([freq, offset]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain); gain.connect(ctx.destination);
      const start = t0 + offset;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.22, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.55);
      osc.start(start); osc.stop(start + 0.6);
    });
  };
  useEffect(() => {
    const h = () => unlockAudio();
    window.addEventListener('click', h);
    window.addEventListener('keydown', h);
    return () => { window.removeEventListener('click', h); window.removeEventListener('keydown', h); };
  }, []);

  // ── Live clock tick ─────────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // ── Fetchers ─────────────────────────────────────────────────────────────────
  const loadEntries = async (queueId: string) => {
    const db = getSupabaseClient();
    const { data } = await db.from('exam_queue_entries').select('id,name,session_label,status,joined_at').eq('queue_id', queueId);
    setEntries((data as Entry[]) || []);
  };

  useEffect(() => {
    let cancelled = false;
    let channel: any;
    (async () => {
      try {
        const db = getSupabaseClient();
        const { data, error } = await db.from('exam_queues').select('id,code,title,examiner_name,ends_at,display_mode,current_entry_id').eq('code', code).maybeSingle();
        if (cancelled) return;
        if (error || !data) { setPhase('notfound'); return; }
        const q = data as ExamQueue;
        setQueue(q);
        await loadEntries(q.id);
        if (cancelled) return;
        setPhase('ready');
        channel = db.channel(`examdisplay_${q.id}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'exam_queue_entries', filter: `queue_id=eq.${q.id}` }, () => loadEntries(q.id))
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'exam_queues', filter: `id=eq.${q.id}` }, (payload: any) => {
            setQueue(prev => prev ? { ...prev, ...payload.new } : prev);
          })
          .subscribe();
      } catch { if (!cancelled) setPhase('notfound'); }
    })();
    return () => { cancelled = true; if (channel) channel.unsubscribe(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  // ── Chime + flash when a new student is called ──────────────────────────────
  const prevCurrent = useRef<string | null>(null);
  const initialized = useRef(false);
  useEffect(() => {
    if (!queue) return;
    const cur = queue.current_entry_id || null;
    if (!initialized.current) { prevCurrent.current = cur; initialized.current = true; return; }
    if (cur && cur !== prevCurrent.current) { setFlashKey(k => k + 1); playChime(); }
    prevCurrent.current = cur;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue?.current_entry_id]);

  // ── Derived ──────────────────────────────────────────────────────────────────
  const ordered = useMemo(() => [...entries].sort((a, b) => new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime()), [entries]);
  const nowSpeaking = useMemo(() => {
    if (queue?.current_entry_id) return ordered.find(e => e.id === queue.current_entry_id) || null;
    return ordered.find(e => e.status === 'speaking') || null;
  }, [ordered, queue?.current_entry_id]);
  const nextUp = useMemo(() => ordered.filter(e => e.status === 'waiting').slice(0, 4), [ordered]);
  const checkedIn = ordered.filter(e => e.status !== 'no_show').length;

  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const clockStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const secStr = pad(now.getSeconds());

  const remaining = useMemo(() => {
    if (!queue?.ends_at) return null;
    return Math.max(0, Math.floor((new Date(queue.ends_at).getTime() - now.getTime()) / 1000));
  }, [queue?.ends_at, now]);
  const remainingStr = remaining == null ? null : (() => {
    const h = Math.floor(remaining / 3600), m = Math.floor((remaining % 3600) / 60), s = remaining % 60;
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  })();

  // ── Palette ──────────────────────────────────────────────────────────────────
  const BG = '#1E1B4B', LIGHT = '#E0E7FF', MUTE = '#A5B4FC', ROSE = '#FB7185';

  const wrap: React.CSSProperties = { minHeight: '100vh', background: BG, color: LIGHT, display: 'flex', flexDirection: 'column', padding: 'clamp(20px, 3vw, 48px)', boxSizing: 'border-box', overflow: 'hidden' };

  // ── Render ───────────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return <div style={{ ...wrap, alignItems: 'center', justifyContent: 'center' }}><div style={{ fontSize: '1.5rem', color: MUTE }}>Loading…</div></div>;
  }
  if (phase === 'notfound' || !queue) {
    return <div style={{ ...wrap, alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}><div><div style={{ fontSize: 'clamp(40px,7vw,90px)', fontWeight: 800, color: '#fff' }}>Exam not found</div><div style={{ fontSize: '1.4rem', color: MUTE, marginTop: '12px' }}>No exam matches the code {code}.</div></div></div>;
  }

  const soundHint = !soundReady && (
    <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.12)', color: '#fff', padding: '10px 22px', borderRadius: '9999px', fontSize: '1rem', fontWeight: 600, backdropFilter: 'blur(4px)' }}>
      🔊 Click anywhere once to enable the call chime
    </div>
  );

  return (
    <div style={wrap}>
      <style>{`
        @keyframes examNameFlash { 0%{transform:scale(1);} 18%{transform:scale(1.06);} 40%{transform:scale(1);} }
        @keyframes examGlow { 0%,100%{box-shadow:0 0 0 rgba(251,113,133,0);} 30%{box-shadow:0 0 60px rgba(251,113,133,0.55);} }
        @keyframes examPulse { 0%,100%{opacity:1;} 50%{opacity:0.35;} }
      `}</style>

      {queue.display_mode === 'speaking' ? (
        // ══════════════════════════════ SPEAKING VIEW ══════════════════════════════
        <>
          {/* Slim top bar: title · clock · small QR for latecomers */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexShrink: 0 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 'clamp(11px,1.1vw,15px)', letterSpacing: '0.05em', color: MUTE, textTransform: 'uppercase' }}>Speaking exam</div>
              <div style={{ fontSize: 'clamp(18px,2vw,30px)', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{queue.title}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(16px,2vw,32px)', flexShrink: 0 }}>
              <div style={{ fontSize: 'clamp(28px,3.5vw,56px)', fontWeight: 600, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{clockStr}</div>
              <div style={{ background: '#fff', borderRadius: '14px', padding: '8px', textAlign: 'center' }}>
                <img src={qrSrc} alt="Scan to join" style={{ width: 'clamp(64px,7vw,104px)', height: 'clamp(64px,7vw,104px)', display: 'block' }} />
                <div style={{ color: BG, fontSize: 'clamp(9px,0.8vw,12px)', fontWeight: 700, marginTop: '2px', letterSpacing: '1px' }}>{queue.code}</div>
              </div>
            </div>
          </div>

          {/* Now speaking — the hero */}
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: 0 }}>
            {nowSpeaking ? (
              <div key={flashKey} style={{ animation: 'examNameFlash 0.9s ease-out', width: '100%' }}>
                {/* SIZE DIALS — middle number in clamp(min, THIS, max) is the main one; raise it to grow text */}
                <div style={{ fontSize: 'clamp(20px,2.4vw,38px)', letterSpacing: '0.15em', color: ROSE, fontWeight: 700, textTransform: 'uppercase', marginBottom: 'clamp(8px,1.5vh,24px)' }}>Now speaking</div>
                <div style={{ fontSize: 'clamp(72px,14vw,260px)', fontWeight: 800, color: '#fff', lineHeight: 1, padding: '0 2vw' }}>{nowSpeaking.name}</div>
                {nowSpeaking.session_label && <div style={{ fontSize: 'clamp(22px,2.4vw,42px)', color: MUTE, marginTop: 'clamp(8px,1.5vh,20px)' }}>{nowSpeaking.session_label}</div>}
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 'clamp(56px,9vw,160px)', fontWeight: 800, color: '#fff', lineHeight: 1.05 }}>Get ready</div>
                <div style={{ fontSize: 'clamp(22px,2.6vw,42px)', color: MUTE, marginTop: '16px' }}>The examiner will call the first student shortly.</div>
              </div>
            )}
          </div>

          {/* Next up */}
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontSize: 'clamp(16px,1.7vw,28px)', color: MUTE, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'clamp(10px,1.5vh,18px)', textAlign: 'center' }}>
              {nextUp.length > 0 ? 'Next up' : 'No one else waiting'}
            </div>
            {nextUp.length > 0 && (
              <div style={{ display: 'flex', gap: 'clamp(10px,1.2vw,20px)', justifyContent: 'center', flexWrap: 'wrap' }}>
                {nextUp.map((e, i) => (
                  <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: i === 0 ? 'rgba(251,113,133,0.16)' : 'rgba(255,255,255,0.06)', border: `1px solid ${i === 0 ? 'rgba(251,113,133,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: '16px', padding: 'clamp(10px,1.4vh,18px) clamp(16px,1.6vw,28px)' }}>
                    <div style={{ width: 'clamp(40px,3.2vw,60px)', height: 'clamp(40px,3.2vw,60px)', borderRadius: '12px', background: i === 0 ? ROSE : 'rgba(255,255,255,0.12)', color: i === 0 ? BG : MUTE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 'clamp(20px,2vw,32px)', flexShrink: 0 }}>{i + 1}</div>
                    <div>
                      <div style={{ fontSize: 'clamp(30px,3.2vw,56px)', fontWeight: 700, color: '#fff' }}>{e.name}</div>
                      {e.session_label && <div style={{ fontSize: 'clamp(15px,1.4vw,24px)', color: MUTE }}>{e.session_label}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        // ══════════════════════════════ CLOCK VIEW ══════════════════════════════
        <>
          {/* Top bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', flexShrink: 0 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 'clamp(12px,1.2vw,18px)', letterSpacing: '0.05em', color: MUTE, textTransform: 'uppercase' }}>Summative examination</div>
              <div style={{ fontSize: 'clamp(22px,2.4vw,40px)', fontWeight: 600, color: '#fff', marginTop: '4px' }}>{queue.title}</div>
            </div>
            {queue.examiner_name && (
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 'clamp(12px,1.2vw,18px)', color: MUTE }}>Examiner</div>
                <div style={{ fontSize: 'clamp(16px,1.6vw,26px)', fontWeight: 600, color: '#fff', marginTop: '4px' }}>{queue.examiner_name}</div>
              </div>
            )}
          </div>

          {/* Body: clock + QR */}
          <div style={{ flexGrow: 1, display: 'grid', gridTemplateColumns: 'minmax(0,1.3fr) minmax(0,0.9fr)', gap: 'clamp(24px,3vw,56px)', alignItems: 'center', minHeight: 0 }}>
            {/* Left: clock */}
            <div>
              <div style={{ fontSize: 'clamp(80px,17vw,300px)', fontWeight: 600, color: '#fff', lineHeight: 0.9, letterSpacing: '0.01em', fontVariantNumeric: 'tabular-nums' }}>
                {clockStr}<span style={{ fontSize: '0.34em', color: MUTE, marginLeft: '0.12em' }}>{secStr}</span>
              </div>
              <div style={{ fontSize: 'clamp(18px,2.2vw,38px)', color: '#C7D2FE', marginTop: 'clamp(10px,1.6vh,22px)' }}>{dateStr}</div>

              <div style={{ display: 'flex', gap: 'clamp(12px,1.4vw,20px)', marginTop: 'clamp(18px,2.6vh,40px)', flexWrap: 'wrap' }}>
                {remainingStr && (
                  <div style={{ background: 'rgba(129,140,248,0.14)', borderRadius: '16px', padding: 'clamp(12px,1.6vh,22px) clamp(16px,1.6vw,28px)' }}>
                    <div style={{ fontSize: 'clamp(12px,1.1vw,17px)', color: MUTE }}>Time remaining</div>
                    <div style={{ fontSize: 'clamp(28px,3.4vw,56px)', fontWeight: 700, color: remaining === 0 ? ROSE : '#fff', fontVariantNumeric: 'tabular-nums', marginTop: '2px' }}>{remaining === 0 ? "Time's up" : remainingStr}</div>
                  </div>
                )}
                <div style={{ background: 'rgba(251,113,133,0.14)', borderRadius: '16px', padding: 'clamp(12px,1.6vh,22px) clamp(16px,1.6vw,28px)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: ROSE, display: 'flex' }}><IconPhoneOff size={36} /></span>
                  <span style={{ fontSize: 'clamp(16px,1.7vw,28px)', fontWeight: 700, color: '#FECDD3' }}>Phones away</span>
                </div>
              </div>
            </div>

            {/* Right: QR */}
            <div style={{ background: '#fff', borderRadius: '24px', padding: 'clamp(18px,2vw,32px)', textAlign: 'center', justifySelf: 'center', maxWidth: '100%' }}>
              <img src={qrSrc} alt="Scan to join the speaking queue" style={{ width: 'clamp(160px,18vw,320px)', height: 'clamp(160px,18vw,320px)', display: 'block', margin: '0 auto', maxWidth: '100%' }} />
              <div style={{ fontSize: 'clamp(15px,1.5vw,24px)', fontWeight: 700, color: BG, marginTop: 'clamp(10px,1.4vh,18px)' }}>Scan to join the speaking queue</div>
              <div style={{ fontSize: 'clamp(12px,1.2vw,18px)', color: '#4F46E5', marginTop: '6px', fontWeight: 600 }}>code {queue.code}</div>
              <div style={{ fontSize: 'clamp(11px,1vw,15px)', color: '#64748B', marginTop: 'clamp(8px,1vh,12px)', borderTop: '1px solid #E2E8F0', paddingTop: 'clamp(8px,1vh,12px)' }}>{checkedIn} checked in</div>
            </div>
          </div>
        </>
      )}

      {soundHint}
    </div>
  );
};