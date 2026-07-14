import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { getSupabaseClient } from '../supabaseClient';

// ──────────────────────────────────────────────────────────────────────────
// Icons (inline, same style as the rest of the dashboard)
// ──────────────────────────────────────────────────────────────────────────
const IconClipboard = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>);
const IconQr        = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect><line x1="14" y1="14" x2="14" y2="14"></line><line x1="21" y1="14" x2="21" y2="14"></line><line x1="14" y1="21" x2="14" y2="21"></line><line x1="17.5" y1="17.5" x2="17.5" y2="17.5"></line><line x1="21" y1="21" x2="21" y2="21"></line></svg>);
const IconClock     = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>);
const IconMic       = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>);
const IconArrowRight= () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>);
const IconCheck     = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>);
const IconX         = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>);
const IconDownload  = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>);
const IconTrash     = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>);
const IconBack      = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"></path></svg>);
const IconPlus      = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>);
const IconExternal  = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>);
const IconCopy      = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>);
const IconPencil    = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>);
const IconLock      = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>);
const IconUnlock    = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>);

// ──────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────
type RosterPerson = { name: string; session: string };
type ExamQueue = {
  id: string;
  code: string;
  title: string;
  examiner_name: string | null;
  starts_at: string | null;
  ends_at: string | null;
  roster: RosterPerson[];
  display_mode: 'clock' | 'speaking';
  current_entry_id: string | null;
  is_open: boolean;
  speaking_total: number;
  created_at: string;
};
type ExamEntry = {
  id: string;
  queue_id: string;
  name: string;
  session_label: string | null;
  status: 'waiting' | 'speaking' | 'done' | 'no_show';
  self_added: boolean;
  joined_at: string;
  called_at: string | null;
  score_fluency: number | null;
  score_grammar: number | null;
  score_vocabulary: number | null;
  score_pronunciation: number | null;
  score_task: number | null;
  score_notes: string | null;
  scored_at: string | null;
};
type SessionBlock = { id: string; label: string; namesText: string };

// ──────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no I, L, O, 0, 1
const genCode = (len = 6): string => {
  let s = '';
  for (let i = 0; i < len; i++) s += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  return s;
};

const toLocalInput = (d: Date): string => {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

const fmtTimeOfDay = (iso: string | null): string => {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

// ──────────────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────────────
export const ExamMode: React.FC = () => {
  const { getToken } = useAuth();
  const getDb = async () => getSupabaseClient((await getToken({ template: 'supabase' })) || '');

  // Toast
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const showToast = (text: string, type: 'success' | 'error') => { setToast({ text, type }); setTimeout(() => setToast(null), 3500); };

  // List / selection
  const [queues, setQueues] = useState<ExamQueue[]>([]);
  const [queue, setQueue] = useState<ExamQueue | null>(null);
  const [entries, setEntries] = useState<ExamEntry[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);

  // Create form
  const [title, setTitle] = useState('');
  const [examiner, setExaminer] = useState('Dr. Chouit Abderraouf');
  const [startLocal, setStartLocal] = useState(() => toLocalInput(new Date()));
  const [endLocal, setEndLocal] = useState(() => toLocalInput(new Date(Date.now() + 2 * 60 * 60 * 1000)));
  const [blocks, setBlocks] = useState<SessionBlock[]>([
    { id: crypto.randomUUID(), label: 'Section 1', namesText: '' },
    { id: crypto.randomUUID(), label: 'Section 2', namesText: '' },
  ]);
  const [isCreating, setIsCreating] = useState(false);
  const createPanelRef = useRef<HTMLDivElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [speakingTotal, setSpeakingTotal] = useState(10);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // ── Scoring panel ───────────────────────────────────────────────────────────
  const [scoringId, setScoringId] = useState<string | null>(null);
  const [sFluency, setSFluency] = useState<number | ''>('');
  const [sGrammar, setSGrammar] = useState<number | ''>('');
  const [sVocab, setSVocab] = useState<number | ''>('');
  const [sPron, setSPron] = useState<number | ''>('');
  const [sTask, setSTask] = useState<number | ''>('');
  const [sNotes, setSNotes] = useState('');
  const [isSavingScore, setIsSavingScore] = useState(false);

  // ── Timer (starts when YOU press start — i.e. when the student begins) ──────
  const [tTotal, setTTotal] = useState(120);   // preset length in seconds
  const [tLeft, setTLeft] = useState(120);      // remaining
  const [tRunning, setTRunning] = useState(false);
  const [tCustomMin, setTCustomMin] = useState('4');
  const [timeUp, setTimeUp] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://litnlearn.com';

  // ── Fetchers ──────────────────────────────────────────────────────────────
  const fetchQueues = async () => {
    setIsLoadingList(true);
    try {
      const db = await getDb();
      const { data, error } = await db.from('exam_queues').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setQueues((data as ExamQueue[]) || []);
    } catch { showToast('Failed to load exams.', 'error'); }
    finally { setIsLoadingList(false); }
  };

  const fetchEntries = async (queueId: string) => {
    try {
      const db = await getDb();
      const { data, error } = await db.from('exam_queue_entries').select('*').eq('queue_id', queueId).order('joined_at', { ascending: true });
      if (error) throw error;
      setEntries((data as ExamEntry[]) || []);
    } catch { showToast('Failed to load check-ins.', 'error'); }
  };

  const refreshQueueRow = async (queueId: string) => {
    try {
      const db = await getDb();
      const { data } = await db.from('exam_queues').select('*').eq('id', queueId).single();
      if (data) setQueue(data as ExamQueue);
    } catch { /* non-fatal */ }
  };

  useEffect(() => { fetchQueues(); }, []);

  // ── Realtime (mirrors the Live Arena pattern) ──────────────────────────────
  useEffect(() => {
    if (!queue) { setEntries([]); return; }
    let channel: any;
    const setup = async () => {
      const db = await getDb();
      await fetchEntries(queue.id);
      channel = db.channel(`exam_${queue.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'exam_queue_entries', filter: `queue_id=eq.${queue.id}` }, () => {
          fetchEntries(queue.id);
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'exam_queues', filter: `id=eq.${queue.id}` }, (payload: any) => {
          setQueue(prev => prev ? { ...prev, ...payload.new } : prev);
        })
        .subscribe();
    };
    setup();
    return () => { if (channel) channel.unsubscribe(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue?.id]);

  // ── Ordered + derived ──────────────────────────────────────────────────────
  const ordered = useMemo(() => [...entries].sort((a, b) => new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime()), [entries]);
  const waiting = ordered.filter(e => e.status === 'waiting');
  const speaking = ordered.find(e => e.status === 'speaking') || null;
  const doneCount = ordered.filter(e => e.status === 'done').length;
  const rosterCount = queue?.roster?.length || 0;
  const scoringEntry = scoringId ? ordered.find(e => e.id === scoringId) || null : null;

  // ── Create exam ─────────────────────────────────────────────────────────────
  const buildRoster = (): RosterPerson[] => {
    const out: RosterPerson[] = [];
    const seen = new Set<string>();
    blocks.forEach(b => {
      b.namesText.split('\n').map(n => n.trim()).filter(Boolean).forEach(name => {
        const key = name.toLowerCase();
        if (!seen.has(key)) { seen.add(key); out.push({ name, session: b.label.trim() || 'Section' }); }
      });
    });
    return out;
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setStartLocal(toLocalInput(new Date()));
    setEndLocal(toLocalInput(new Date(Date.now() + 2 * 60 * 60 * 1000)));
    setBlocks([
      { id: crypto.randomUUID(), label: 'Section 1', namesText: '' },
      { id: crypto.randomUUID(), label: 'Section 2', namesText: '' },
    ]);
    setSpeakingTotal(10);
  };

  const handleCreate = async () => {
    if (!title.trim()) { showToast('Give the exam a title.', 'error'); return; }
    const roster = buildRoster();
    if (roster.length === 0) { showToast('Paste at least one student name.', 'error'); return; }
    setIsCreating(true);
    try {
      const db = await getDb();
      const setupFields = {
        title: title.trim(),
        examiner_name: examiner.trim() || null,
        starts_at: startLocal ? new Date(startLocal).toISOString() : null,
        ends_at: endLocal ? new Date(endLocal).toISOString() : null,
        roster,
        speaking_total: Math.max(5, Math.round(Number(speakingTotal) || 10)),
      };

      // ── EDIT existing exam (keeps the same code, QR, and any check-ins) ──
      if (editingId) {
        const { data, error } = await db.from('exam_queues').update(setupFields).eq('id', editingId).select().single();
        if (error) throw error;
        showToast('Exam updated.', 'success');
        setQueues(prev => prev.map(q => q.id === editingId ? (data as ExamQueue) : q));
        resetForm();
        return;
      }

      // ── CREATE new exam ──
      const payload = { ...setupFields, display_mode: 'clock', is_open: true };
      // Try a few codes in case of the (very rare) unique collision.
      let created: ExamQueue | null = null;
      for (let attempt = 0; attempt < 5 && !created; attempt++) {
        const code = genCode();
        const { data, error } = await db.from('exam_queues').insert([{ ...payload, code }]).select().single();
        if (!error && data) { created = data as ExamQueue; break; }
        if (error && !String(error.message || '').toLowerCase().includes('duplicate')) throw error;
      }
      if (!created) throw new Error('Could not generate a unique code. Try again.');
      showToast('Exam created.', 'success');
      setQueues(prev => [created as ExamQueue, ...prev]);
      setQueue(created);
      resetForm();
    } catch (e: any) { showToast(e.message || 'Failed to save exam.', 'error'); }
    finally { setIsCreating(false); }
  };

  // ── Edit an existing exam (loads it into the form, saves back to the same row) ──
  const startEdit = (q: ExamQueue) => {
    setQueue(null);
    setEditingId(q.id);
    setTitle(q.title || '');
    setExaminer(q.examiner_name || 'Dr. Chouit Abderraouf');
    setStartLocal(q.starts_at ? toLocalInput(new Date(q.starts_at)) : toLocalInput(new Date()));
    setEndLocal(q.ends_at ? toLocalInput(new Date(q.ends_at)) : toLocalInput(new Date(Date.now() + 2 * 60 * 60 * 1000)));
    setSpeakingTotal(q.speaking_total || 10);
    const grouped: { label: string; names: string[] }[] = [];
    (q.roster || []).forEach(p => {
      let blk = grouped.find(g => g.label === p.session);
      if (!blk) { blk = { label: p.session, names: [] }; grouped.push(blk); }
      blk.names.push(p.name);
    });
    setBlocks(grouped.length > 0
      ? grouped.map(g => ({ id: crypto.randomUUID(), label: g.label, namesText: g.names.join('\n') }))
      : [{ id: crypto.randomUUID(), label: 'Section 1', namesText: '' }]);
    setTimeout(() => createPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  // ── Block editing ───────────────────────────────────────────────────────────
  // ── Clone an exam into the create form (edit, then Create) ──────────────────
  const cloneExam = (q: ExamQueue) => {
    setQueue(null); // make sure we're on the setup view where the form lives
    setEditingId(null); // clone always creates a NEW exam, never edits
    setTitle(`${q.title} (copy)`);
    setExaminer(q.examiner_name || 'Dr. Chouit Abderraouf');
    // Times reset to a fresh default for the new day (not copied).
    setStartLocal(toLocalInput(new Date()));
    setEndLocal(toLocalInput(new Date(Date.now() + 2 * 60 * 60 * 1000)));
    setSpeakingTotal(q.speaking_total || 10);
    // Rebuild the section blocks from the roster, preserving section order.
    const grouped: { label: string; names: string[] }[] = [];
    (q.roster || []).forEach(p => {
      let blk = grouped.find(g => g.label === p.session);
      if (!blk) { blk = { label: p.session, names: [] }; grouped.push(blk); }
      blk.names.push(p.name);
    });
    setBlocks(grouped.length > 0
      ? grouped.map(g => ({ id: crypto.randomUUID(), label: g.label, namesText: g.names.join('\n') }))
      : [{ id: crypto.randomUUID(), label: 'Section 1', namesText: '' }]);
    showToast('Cloned into the form — edit the roster, then Create.', 'success');
    setTimeout(() => createPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const updateBlock = (id: string, patch: Partial<SessionBlock>) => setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...patch } : b));
  const addBlock = () => setBlocks(prev => [...prev, { id: crypto.randomUUID(), label: `Section ${prev.length + 1}`, namesText: '' }]);
  const removeBlock = (id: string) => setBlocks(prev => prev.length > 1 ? prev.filter(b => b.id !== id) : prev);

  // ── Projector control ───────────────────────────────────────────────────────
  const setDisplayMode = async (mode: 'clock' | 'speaking') => {
    if (!queue) return;
    setQueue({ ...queue, display_mode: mode });
    try {
      const db = await getDb();
      await db.from('exam_queues').update({ display_mode: mode }).eq('id', queue.id);
    } catch { showToast('Failed to switch the screen.', 'error'); refreshQueueRow(queue.id); }
  };

  const toggleOpen = async () => {
    if (!queue) return;
    const next = !queue.is_open;
    setQueue({ ...queue, is_open: next });
    try {
      const db = await getDb();
      await db.from('exam_queues').update({ is_open: next }).eq('id', queue.id);
      showToast(next ? 'Check-in re-opened.' : 'Check-in closed.', 'success');
    } catch { showToast('Failed to update check-in.', 'error'); refreshQueueRow(queue.id); }
  };

  // ── Call / Done / No-show ───────────────────────────────────────────────────
  const callEntry = async (entry: ExamEntry) => {
    if (!queue) return;
    try {
      const db = await getDb();
      // current speaker (if any) -> done
      await db.from('exam_queue_entries').update({ status: 'done' }).eq('queue_id', queue.id).eq('status', 'speaking');
      // this entry -> speaking
      await db.from('exam_queue_entries').update({ status: 'speaking', called_at: new Date().toISOString() }).eq('id', entry.id);
      // queue points at the new speaker and flips the projector to Speaking view
      await db.from('exam_queues').update({ current_entry_id: entry.id, display_mode: 'speaking' }).eq('id', queue.id);
      setQueue({ ...queue, current_entry_id: entry.id, display_mode: 'speaking' });
      await fetchEntries(queue.id);
      openScoring(entry); // panel opens on call (timer waits for you to press Start)
    } catch { showToast('Failed to call student.', 'error'); }
  };

  const callNext = () => {
    if (waiting.length === 0) { showToast('No one left waiting.', 'error'); return; }
    callEntry(waiting[0]);
  };

  const markDone = async (entry: ExamEntry) => {
    if (!queue) return;
    try {
      const db = await getDb();
      await db.from('exam_queue_entries').update({ status: 'done' }).eq('id', entry.id);
      if (queue.current_entry_id === entry.id) {
        await db.from('exam_queues').update({ current_entry_id: null }).eq('id', queue.id);
        setQueue({ ...queue, current_entry_id: null });
      }
      await fetchEntries(queue.id);
    } catch { showToast('Failed to update.', 'error'); }
  };

  const markNoShow = async (entry: ExamEntry) => {
    if (!queue) return;
    try {
      const db = await getDb();
      await db.from('exam_queue_entries').update({ status: 'no_show' }).eq('id', entry.id);
      if (queue.current_entry_id === entry.id) {
        await db.from('exam_queues').update({ current_entry_id: null }).eq('id', queue.id);
        setQueue({ ...queue, current_entry_id: null });
      }
      await fetchEntries(queue.id);
    } catch { showToast('Failed to update.', 'error'); }
  };

  // Re-queue a no-show to the BACK of the line (fresh server timestamp).
  const requeue = async (entry: ExamEntry) => {
    if (!queue) return;
    try {
      const db = await getDb();
      await db.from('exam_queue_entries').update({ status: 'waiting', called_at: null, joined_at: new Date().toISOString() }).eq('id', entry.id);
      await fetchEntries(queue.id);
      showToast(`${entry.name} moved to the back.`, 'success');
    } catch { showToast('Failed to re-queue.', 'error'); }
  };

  const approveSelfAdded = async (entry: ExamEntry) => {
    if (!queue) return;
    try {
      const db = await getDb();
      await db.from('exam_queue_entries').update({ self_added: false }).eq('id', entry.id);
      await fetchEntries(queue.id);
    } catch { showToast('Failed to approve.', 'error'); }
  };

  const removeEntry = async (entry: ExamEntry) => {
    if (!queue) return;
    try {
      const db = await getDb();
      await db.from('exam_queue_entries').delete().eq('id', entry.id);
      await fetchEntries(queue.id);
    } catch { showToast('Failed to remove.', 'error'); }
  };

  // ── Scoring panel ────────────────────────────────────────────────────────────
  const perSkill = (queue?.speaking_total || 10) / 5;
  const liveTotal: number = [sFluency, sGrammar, sVocab, sPron, sTask].reduce<number>((sum, v) => sum + (v === '' ? 0 : Number(v)), 0);
  const entryTotal = (e: ExamEntry) =>
    (e.score_fluency || 0) + (e.score_grammar || 0) + (e.score_vocabulary || 0) + (e.score_pronunciation || 0) + (e.score_task || 0);

  const openScoring = (e: ExamEntry) => {
    setScoringId(e.id);
    setSFluency(e.score_fluency ?? '');
    setSGrammar(e.score_grammar ?? '');
    setSVocab(e.score_vocabulary ?? '');
    setSPron(e.score_pronunciation ?? '');
    setSTask(e.score_task ?? '');
    setSNotes(e.score_notes ?? '');
    setTRunning(false);
    setTLeft(tTotal);
    setTimeUp(false);
  };
  const closeScoring = () => { setScoringId(null); setTRunning(false); setTimeUp(false); };

  const bump = (val: number | '', setter: (n: number | '') => void, dir: 1 | -1) => {
    const cur = val === '' ? 0 : Number(val);
    let next = Math.round((cur + dir * 0.5) * 2) / 2;
    if (next < 0) next = 0;
    if (next > perSkill) next = perSkill;
    setter(next);
  };

  const saveScore = async (finish: boolean) => {
    if (!queue || !scoringId) return;
    setIsSavingScore(true);
    try {
      const db = await getDb();
      // Clamp to the valid range at save time too (defends against any odd typed value).
      const numOrNull = (v: number | '') => (v === '' ? null : Math.min(Math.max(Number(v), 0), perSkill));
      const payload: any = {
        score_fluency: numOrNull(sFluency),
        score_grammar: numOrNull(sGrammar),
        score_vocabulary: numOrNull(sVocab),
        score_pronunciation: numOrNull(sPron),
        score_task: numOrNull(sTask),
        score_notes: sNotes.trim() || null,
        scored_at: new Date().toISOString(),
      };
      if (finish) payload.status = 'done';
      await db.from('exam_queue_entries').update(payload).eq('id', scoringId);
      if (finish && queue.current_entry_id === scoringId) {
        await db.from('exam_queues').update({ current_entry_id: null }).eq('id', queue.id);
        setQueue({ ...queue, current_entry_id: null });
      }
      await fetchEntries(queue.id);
      showToast(finish ? 'Scores saved · student finished.' : 'Scores saved.', 'success');
      if (finish) closeScoring();
    } catch { showToast('Failed to save scores.', 'error'); }
    finally { setIsSavingScore(false); }
  };

  // ── Timer ────────────────────────────────────────────────────────────────────
  const fmtClock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const setPreset = (seconds: number) => { setTTotal(seconds); setTLeft(seconds); setTRunning(false); setTimeUp(false); };
  const applyCustom = () => { const mins = Math.max(0, Math.round(Number(tCustomMin) || 0)); const secs = Math.max(15, mins * 60); setPreset(secs); };
  const startTimer = () => {
    try {
      if (!audioRef.current) {
        const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (Ctx) audioRef.current = new Ctx();
      }
      audioRef.current?.resume();
    } catch { /* ignore */ }
    setTimeUp(false);
    setTRunning(true);
  };
  const resetTimer = () => { setTRunning(false); setTLeft(tTotal); setTimeUp(false); };
  const playTimeUp = () => {
    const ctx = audioRef.current;
    if (!ctx) return;
    const t0 = ctx.currentTime;
    [0, 0.22, 0.44].forEach((offset) => {
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = 784;
      osc.connect(gain); gain.connect(ctx.destination);
      const start = t0 + offset;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.25, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);
      osc.start(start); osc.stop(start + 0.2);
    });
  };
  useEffect(() => {
    if (!tRunning) return;
    const id = setInterval(() => {
      setTLeft(prev => {
        if (prev <= 1) { clearInterval(id); setTRunning(false); setTimeUp(true); playTimeUp(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tRunning]);

  // ── Export ──────────────────────────────────────────────────────────────────
  const exportLog = () => {
    if (!queue) return;
    const header = ['Position', 'Name', 'Section', 'Status', 'Checked in', 'Called at', 'Fluency', 'Grammar', 'Vocabulary', 'Pronunciation', 'Task', `Speaking total (/${queue.speaking_total})`, 'Notes'];
    const rows = ordered.map((e, i) => [
      String(i + 1), e.name, e.session_label || '', e.status,
      new Date(e.joined_at).toLocaleString(), e.called_at ? new Date(e.called_at).toLocaleString() : '',
      e.score_fluency ?? '', e.score_grammar ?? '', e.score_vocabulary ?? '', e.score_pronunciation ?? '', e.score_task ?? '',
      e.scored_at ? entryTotal(e) : '', e.score_notes || '',
    ]);
    const csv = [header, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `exam-${queue.code}-order.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Delete exam ─────────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteId) return;
    const id = deleteId; setDeleteId(null);
    try {
      const db = await getDb();
      await db.from('exam_queues').delete().eq('id', id);
      setQueues(prev => prev.filter(q => q.id !== id));
      if (queue?.id === id) setQueue(null);
      showToast('Exam deleted.', 'success');
    } catch { showToast('Failed to delete exam.', 'error'); }
  };

  // ── Styles ──────────────────────────────────────────────────────────────────
  const ROSE = '#E11D48';
  const card: React.CSSProperties = { background: '#fff', borderRadius: '32px', padding: '32px', border: '1px solid #E2E8F0', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' };
  const input: React.CSSProperties = { width: '100%', padding: '14px 16px', borderRadius: '12px', border: '2px solid #E2E8F0', background: '#fff', color: '#0F172A', fontSize: '1.05rem', outline: 'none' };
  const label: React.CSSProperties = { display: 'block', fontSize: '0.95rem', fontWeight: 600, marginBottom: '8px', color: '#475569' };

  const checkInUrl = queue ? `${origin}/exam/${queue.code}` : '';
  const qrSrc = queue ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(checkInUrl)}` : '';

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ animation: 'fadeInDown 0.3s ease-out', position: 'relative' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)', backgroundColor: toast.type === 'success' ? '#10B981' : '#EF4444', color: '#fff', padding: '16px 32px', borderRadius: '9999px', fontWeight: 700, fontSize: '1.1rem', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', zIndex: 9998 }}>
          {toast.text}
        </div>
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', width: '90%', maxWidth: '400px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', background: '#FEF2F2', color: '#EF4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}><IconTrash /></div>
            <h3 style={{ margin: '0 0 12px', color: '#0F172A', fontSize: '1.4rem' }}>Delete this exam?</h3>
            <p style={{ color: '#64748B', margin: '0 0 24px', lineHeight: 1.5 }}>This permanently removes the exam and every check-in recorded for it. This cannot be undone.</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setDeleteId(null)} style={{ flex: 1, padding: '12px', background: '#F1F5F9', color: '#475569', borderRadius: '12px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Cancel</button>
              <button onClick={confirmDelete} style={{ flex: 1, padding: '12px', background: '#EF4444', color: '#fff', borderRadius: '12px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Yes, delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Scoring panel */}
      {scoringEntry && queue && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px', overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: '540px', background: '#fff', borderRadius: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)', padding: '24px', margin: 'auto' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: '#FFE4E6', color: ROSE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem' }}>{scoringEntry.name.charAt(0).toUpperCase()}</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A' }}>{scoringEntry.name}</span>
                    {scoringEntry.session_label && <span style={{ background: '#F1F5F9', color: '#475569', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '6px' }}>{scoringEntry.session_label}</span>}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#94A3B8', marginTop: '2px' }}>Speaking out of {queue.speaking_total} · {perSkill} per skill · private to you</div>
                </div>
              </div>
              <button onClick={closeScoring} style={{ background: '#F1F5F9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', color: '#64748B', fontSize: '1.1rem' }}>✕</button>
            </div>

            <div style={{ background: timeUp ? '#FEF2F2' : '#F8FAFC', border: `1px solid ${timeUp ? '#FCA5A5' : '#E2E8F0'}`, borderRadius: '16px', padding: '18px', textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '3rem', fontWeight: 800, color: timeUp ? '#DC2626' : '#0F172A', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{fmtClock(tLeft)}</div>
              {timeUp && <div style={{ color: '#DC2626', fontWeight: 700, marginTop: '4px' }}>Time's up</div>}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', margin: '14px 0 12px', flexWrap: 'wrap', alignItems: 'center' }}>
                {([['2:00', 120], ['3:00', 180]] as [string, number][]).map(([lbl, secs]) => (
                  <button key={lbl} onClick={() => setPreset(secs)} style={{ padding: '7px 16px', borderRadius: '999px', border: tTotal === secs ? `2px solid ${ROSE}` : '1px solid #CBD5E1', background: tTotal === secs ? '#FFE4E6' : '#fff', color: tTotal === secs ? ROSE : '#64748B', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>{lbl}</button>
                ))}
                <input type="number" min={1} value={tCustomMin} onChange={e => setTCustomMin(e.target.value)} style={{ width: '56px', padding: '7px', borderRadius: '8px', border: '1px solid #CBD5E1', textAlign: 'center', fontSize: '0.9rem' }} />
                <button onClick={applyCustom} style={{ padding: '7px 14px', borderRadius: '999px', border: '1px solid #CBD5E1', background: '#fff', color: '#64748B', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>min</button>
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                {!tRunning ? (
                  <button onClick={startTimer} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '10px 26px', borderRadius: '10px', background: ROSE, color: '#fff', border: 'none', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>▶ Start</button>
                ) : (
                  <button onClick={() => setTRunning(false)} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '10px 26px', borderRadius: '10px', background: '#475569', color: '#fff', border: 'none', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>❚❚ Pause</button>
                )}
                <button onClick={resetTimer} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '10px 18px', borderRadius: '10px', border: '1px solid #CBD5E1', background: '#fff', color: '#64748B', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>↺ Reset</button>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '10px' }}>Press Start when the student begins speaking. Optional — ignore it if you don't need it.</div>
            </div>

            <div>
              {([['Fluency', sFluency, setSFluency], ['Grammar', sGrammar, setSGrammar], ['Vocabulary', sVocab, setSVocab], ['Pronunciation', sPron, setSPron], ['Task completion', sTask, setSTask]] as [string, number | '', (n: number | '') => void][]).map(([lbl, val, setter], idx) => (
                <div key={lbl} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', borderBottom: idx < 4 ? '1px solid #F1F5F9' : 'none' }}>
                  <span style={{ fontSize: '1rem', color: '#0F172A', fontWeight: 600 }}>{lbl}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={() => bump(val, setter, -1)} style={{ width: '34px', height: '34px', borderRadius: '9px', border: '1px solid #CBD5E1', background: '#fff', color: '#475569', fontSize: '1.3rem', cursor: 'pointer', lineHeight: 1 }}>−</button>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        max={perSkill}
                        step={0.5}
                        value={val}
                        onChange={e => {
                          const raw = e.target.value;
                          if (raw === '') { setter(''); return; }
                          let n = Number(raw);
                          if (Number.isNaN(n)) return;
                          if (n < 0) n = 0;
                          if (n > perSkill) n = perSkill;
                          setter(n);
                        }}
                        style={{ width: '64px', padding: '7px 4px', borderRadius: '9px', border: '2px solid #E2E8F0', textAlign: 'center', fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', outline: 'none', background: '#fff' }}
                      />
                      <span style={{ color: '#94A3B8', fontWeight: 400, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>/ {perSkill}</span>
                    </div>
                    <button onClick={() => bump(val, setter, 1)} style={{ width: '34px', height: '34px', borderRadius: '9px', border: '1px solid #CBD5E1', background: '#fff', color: '#475569', fontSize: '1.3rem', cursor: 'pointer', lineHeight: 1 }}>+</button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(225,29,72,0.10)', borderRadius: '14px', padding: '14px 18px', margin: '16px 0' }}>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: ROSE }}>Total</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: ROSE }}>{Math.round(liveTotal * 2) / 2} <span style={{ fontSize: '1rem', opacity: 0.7 }}>/ {queue.speaking_total}</span></span>
            </div>

            <textarea value={sNotes} onChange={e => setSNotes(e.target.value)} placeholder="Private note (optional) — e.g. strong opener, hesitant on past tense" rows={2} style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '2px solid #E2E8F0', fontSize: '0.95rem', outline: 'none', resize: 'vertical', marginBottom: '16px', color: '#0F172A' }} />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => saveScore(false)} disabled={isSavingScore} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '2px solid #E2E8F0', background: '#fff', color: '#475569', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>{isSavingScore ? 'Saving…' : 'Save'}</button>
              <button onClick={() => saveScore(true)} disabled={isSavingScore} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: ROSE, color: '#fff', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 8px 16px rgba(225,29,72,0.25)' }}>{isSavingScore ? 'Saving…' : 'Save & finish'}</button>
            </div>
          </div>
        </div>
      )}

      {!queue ? (
        // ════════════════════════════════ SETUP + LIST ════════════════════════════════
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '32px', alignItems: 'start' }}>

          {/* Create */}
          <div ref={createPanelRef} style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ background: '#FFE4E6', color: ROSE, padding: '12px', borderRadius: '14px', display: 'flex' }}><IconClipboard /></div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.6rem', color: '#0F172A', fontWeight: 700 }}>{editingId ? 'Edit Exam' : 'New Speaking Exam'}</h2>
                <p style={{ margin: '2px 0 0', color: '#64748B', fontSize: '0.95rem' }}>{editingId ? 'Editing keeps the same code and QR.' : 'Students scan to claim a fair, timestamped place.'}</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={label}>Exam title</label>
                <input style={input} value={title} onChange={e => setTitle(e.target.value)} placeholder="Level 4 — Intermediate · Sections 1 + 2" />
              </div>
              <div>
                <label style={label}>Examiner name (shown on the screen)</label>
                <input style={input} value={examiner} onChange={e => setExaminer(e.target.value)} placeholder="Dr. Chouit Abderraouf" />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={label}>Exam starts</label>
                  <input type="datetime-local" style={input} value={startLocal} onChange={e => setStartLocal(e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={label}>Exam ends</label>
                  <input type="datetime-local" style={input} value={endLocal} onChange={e => setEndLocal(e.target.value)} />
                </div>
              </div>

              <div>
                <label style={label}>Speaking exam total <span style={{ color: '#94A3B8', fontWeight: 400 }}>(each skill = total ÷ 5)</span></label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {[10, 20].map(t => (
                    <button key={t} type="button" onClick={() => setSpeakingTotal(t)} style={{ flex: '0 0 auto', padding: '12px 22px', borderRadius: '12px', border: speakingTotal === t ? `2px solid ${ROSE}` : '2px solid #E2E8F0', background: speakingTotal === t ? '#FFE4E6' : '#fff', color: speakingTotal === t ? ROSE : '#475569', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>/ {t}</button>
                  ))}
                  <span style={{ color: '#94A3B8', fontSize: '0.9rem' }}>or</span>
                  <input type="number" min={5} step={5} value={speakingTotal} onChange={e => setSpeakingTotal(Number(e.target.value) || 0)} style={{ ...input, width: '110px', padding: '12px' }} />
                  <span style={{ color: '#64748B', fontSize: '0.9rem' }}>= {(Number(speakingTotal) || 0) / 5} per skill</span>
                </div>
              </div>

              {/* Session blocks */}
              <div>
                <label style={label}>Roster — paste names, one per line, per section</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {blocks.map(b => (
                    <div key={b.id} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '16px' }}>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'center' }}>
                        <input value={b.label} onChange={e => updateBlock(b.id, { label: e.target.value })} style={{ ...input, padding: '8px 12px', fontSize: '0.95rem', fontWeight: 700, maxWidth: '200px' }} />
                        {blocks.length > 1 && (
                          <button onClick={() => removeBlock(b.id)} title="Remove section" style={{ background: '#FEF2F2', color: '#EF4444', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex' }}><IconX /></button>
                        )}
                      </div>
                      <textarea value={b.namesText} onChange={e => updateBlock(b.id, { namesText: e.target.value })} rows={5} placeholder={'Amina Khaled\nYoussef Brahimi\nSalma Rahmani'} style={{ ...input, resize: 'vertical', lineHeight: 1.6, fontSize: '1rem' }} />
                    </div>
                  ))}
                </div>
                <button onClick={addBlock} style={{ marginTop: '10px', background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', padding: '8px 14px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}><IconPlus /> Add section</button>
              </div>

              <button onClick={handleCreate} disabled={isCreating} style={{ width: '100%', background: ROSE, color: '#fff', border: 'none', padding: '16px', borderRadius: '14px', fontWeight: 700, fontSize: '1.1rem', cursor: isCreating ? 'wait' : 'pointer', boxShadow: '0 10px 20px rgba(225,29,72,0.25)' }}>
                {editingId ? (isCreating ? 'Saving…' : 'Save changes') : (isCreating ? 'Creating…' : 'Create exam & generate QR')}
              </button>
              {editingId && (
                <button onClick={resetForm} disabled={isCreating} style={{ width: '100%', background: '#F1F5F9', color: '#475569', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', marginTop: '-8px' }}>Cancel edit</button>
              )}
            </div>
          </div>

          {/* Existing exams */}
          <div style={card}>
            <h3 style={{ margin: '0 0 16px', color: '#0F172A', fontSize: '1.4rem' }}>Your Exams</h3>
            {isLoadingList ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>Loading…</div>
            ) : queues.length === 0 ? (
              <div style={{ background: '#F8FAFC', padding: '40px', borderRadius: '16px', textAlign: 'center', color: '#94A3B8', border: '2px dashed #E2E8F0' }}>No exams yet. Create one to get started.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '640px', overflowY: 'auto', paddingRight: '8px' }}>
                {queues.map(q => (
                  <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: '#F8FAFC', border: '2px solid transparent', borderRadius: '16px' }}>
                    <div onClick={() => setQueue(q)} style={{ flexGrow: 1, minWidth: 0, cursor: 'pointer' }}>
                      <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '1.05rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{q.title}</div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center' }}>
                        <span style={{ background: '#FFE4E6', color: ROSE, padding: '2px 10px', borderRadius: '6px', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '1px' }}>{q.code}</span>
                        <span style={{ color: '#64748B', fontSize: '0.85rem' }}>{q.roster?.length || 0} on roster</span>
                        {!q.is_open && <span style={{ color: '#94A3B8', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><IconLock /> closed</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0, marginLeft: '12px' }}>
                      <button onClick={() => startEdit(q)} title="Edit this exam" style={{ background: '#F1F5F9', color: '#475569', border: 'none', padding: '8px', borderRadius: '10px', cursor: 'pointer', display: 'flex' }}><IconPencil /></button>
                      <button onClick={() => cloneExam(q)} title="Clone for a new exam" style={{ background: '#EEF2FF', color: '#4F46E5', border: 'none', padding: '8px', borderRadius: '10px', cursor: 'pointer', display: 'flex' }}><IconCopy /></button>
                      <button onClick={() => { setEditingId(null); setQueue(q); }} style={{ background: '#4F46E5', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>Open</button>
                      <button onClick={() => setDeleteId(q.id)} title="Delete exam" style={{ background: '#FEF2F2', color: '#EF4444', border: 'none', padding: '8px', borderRadius: '10px', cursor: 'pointer', display: 'flex' }}><IconTrash /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        // ════════════════════════════════ CONTROL CONSOLE ════════════════════════════════
        <div>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
            <div>
              <button onClick={() => setQueue(null)} style={{ background: '#fff', color: '#475569', border: '1px solid #E2E8F0', padding: '8px 16px', borderRadius: '9999px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}><IconBack /> All exams</button>
              <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#0F172A', fontWeight: 700 }}>{queue.title}</h2>
              <div style={{ color: '#64748B', marginTop: '4px' }}>Code <span style={{ background: '#FFE4E6', color: ROSE, padding: '2px 10px', borderRadius: '6px', fontWeight: 800, letterSpacing: '1px' }}>{queue.code}</span> · {queue.examiner_name || 'No examiner set'}</div>
            </div>
            <button onClick={() => window.open(`/exam/display/${queue.code}`, '_blank')} style={{ background: '#0F172A', color: '#fff', border: 'none', padding: '14px 24px', borderRadius: '14px', fontWeight: 700, fontSize: '1.05rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '10px', boxShadow: '0 10px 20px rgba(15,23,42,0.2)' }}><IconExternal /> Open projector screen</button>
          </div>

          {/* Projector mode toggle */}
          <div style={{ ...card, padding: '20px 24px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#475569', fontWeight: 600 }}>
              <IconExternal /> Projector is showing:
            </div>
            <div style={{ display: 'inline-flex', background: '#F1F5F9', padding: '6px', borderRadius: '9999px', gap: '6px' }}>
              <button onClick={() => setDisplayMode('clock')} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 22px', borderRadius: '9999px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '1rem', background: queue.display_mode === 'clock' ? '#4F46E5' : 'transparent', color: queue.display_mode === 'clock' ? '#fff' : '#64748B' }}><IconClock /> Clock view</button>
              <button onClick={() => setDisplayMode('speaking')} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 22px', borderRadius: '9999px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '1rem', background: queue.display_mode === 'speaking' ? ROSE : 'transparent', color: queue.display_mode === 'speaking' ? '#fff' : '#64748B' }}><IconMic /> Speaking view</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: '24px', alignItems: 'start' }}>

            {/* QR + check-in */}
            <div style={card}>
              <h3 style={{ margin: '0 0 16px', color: '#0F172A', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '8px' }}><IconQr /> Check-in QR</h3>
              <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '20px', padding: '20px', textAlign: 'center' }}>
                <img src={qrSrc} alt="Check-in QR" width={240} height={240} style={{ maxWidth: '100%', height: 'auto' }} />
                <div style={{ marginTop: '12px', fontSize: '0.95rem', color: '#475569', wordBreak: 'break-all' }}>{checkInUrl}</div>
                <div style={{ marginTop: '6px', fontSize: '0.85rem', color: '#94A3B8' }}>or type code <strong style={{ color: ROSE }}>{queue.code}</strong> at {origin.replace(/^https?:\/\//, '')}/exam</div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button onClick={toggleOpen} style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '12px', border: '1px solid', borderColor: queue.is_open ? '#FCA5A5' : '#86EFAC', background: queue.is_open ? '#FEF2F2' : '#F0FDF4', color: queue.is_open ? '#DC2626' : '#16A34A', fontWeight: 700, cursor: 'pointer' }}>
                  {queue.is_open ? <><IconLock /> Close check-in</> : <><IconUnlock /> Re-open check-in</>}
                </button>
                <button onClick={exportLog} style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '12px', border: '1px solid #CBD5E1', background: '#F8FAFC', color: '#475569', fontWeight: 700, cursor: 'pointer' }}><IconDownload /> Export order</button>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '16px' }}>
                {[['On roster', rosterCount, '#475569'], ['Checked in', ordered.filter(e => e.status !== 'no_show').length, '#4F46E5'], ['Done', doneCount, '#16A34A']].map(([lbl, val, col]) => (
                  <div key={lbl as string} style={{ background: '#F8FAFC', borderRadius: '14px', padding: '14px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: col as string }}>{val as number}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>{lbl as string}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live order */}
            <div style={{ ...card, gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px', borderBottom: '2px solid #F1F5F9', paddingBottom: '16px' }}>
                <h3 style={{ margin: 0, color: '#0F172A', fontSize: '1.4rem' }}>Speaking order <span style={{ color: '#94A3B8', fontWeight: 600, fontSize: '1rem' }}>(by scan time)</span></h3>
                <button onClick={callNext} disabled={waiting.length === 0} style={{ background: waiting.length === 0 ? '#E2E8F0' : ROSE, color: waiting.length === 0 ? '#94A3B8' : '#fff', border: 'none', padding: '14px 28px', borderRadius: '14px', fontWeight: 700, fontSize: '1.1rem', cursor: waiting.length === 0 ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '10px', boxShadow: waiting.length === 0 ? 'none' : '0 10px 20px rgba(225,29,72,0.25)' }}>Call next <IconArrowRight /></button>
              </div>

              {speaking && (
                <div style={{ background: ROSE, color: '#fff', borderRadius: '20px', padding: '20px 24px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', boxShadow: '0 10px 25px rgba(225,29,72,0.3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconMic /></div>
                    <div>
                      <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.85, fontWeight: 700 }}>Now speaking</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{speaking.name}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => openScoring(speaking)} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.5)', padding: '12px 20px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}><IconClock /> Score</button>
                    <button onClick={() => markDone(speaking)} style={{ background: '#fff', color: ROSE, border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}><IconCheck /> Done</button>
                  </div>
                </div>
              )}

              {ordered.length === 0 ? (
                <div style={{ background: '#F8FAFC', padding: '50px', borderRadius: '16px', textAlign: 'center', color: '#94A3B8', border: '2px dashed #E2E8F0', fontSize: '1.1rem' }}>No check-ins yet. As students scan the QR and tap their name, they'll appear here in scan order.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {ordered.map((e, i) => {
                    const isWaiting = e.status === 'waiting';
                    const isSpeaking = e.status === 'speaking';
                    const isDone = e.status === 'done';
                    const isNoShow = e.status === 'no_show';
                    const pos = ordered.filter((x, idx) => idx <= i && x.status !== 'no_show' && x.status !== 'done').length;
                    return (
                      <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 18px', borderRadius: '14px', background: isSpeaking ? '#FFF1F2' : '#F8FAFC', border: `1px solid ${isSpeaking ? '#FECDD3' : '#E2E8F0'}`, opacity: isNoShow || isDone ? 0.55 : 1 }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: isSpeaking ? ROSE : isDone ? '#DCFCE7' : isNoShow ? '#F1F5F9' : '#EEF2FF', color: isSpeaking ? '#fff' : isDone ? '#16A34A' : isNoShow ? '#94A3B8' : '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>
                          {isDone ? <IconCheck /> : isNoShow ? <IconX /> : pos}
                        </div>
                        <div style={{ flexGrow: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '1.1rem' }}>{e.name}</span>
                            {e.session_label && <span style={{ background: '#E2E8F0', color: '#475569', padding: '2px 8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>{e.session_label}</span>}
                            {e.self_added && <span style={{ background: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D', padding: '1px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>Not on list</span>}
                            {isNoShow && <span style={{ color: '#94A3B8', fontSize: '0.8rem', fontWeight: 700 }}>No-show</span>}
                            {isDone && <span style={{ color: '#16A34A', fontSize: '0.8rem', fontWeight: 700 }}>Done</span>}
                            {e.scored_at && <span style={{ background: '#FFE4E6', color: ROSE, padding: '2px 8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700 }}>{entryTotal(e)} / {queue.speaking_total}</span>}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '2px' }}>Scanned {fmtTimeOfDay(e.joined_at)}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                          {e.self_added && (
                            <button onClick={() => approveSelfAdded(e)} title="Approve" style={{ background: '#F0FDF4', color: '#16A34A', border: '1px solid #86EFAC', padding: '8px', borderRadius: '9px', cursor: 'pointer', display: 'flex' }}><IconCheck /></button>
                          )}
                          {isWaiting && (
                            <>
                              <button onClick={() => callEntry(e)} style={{ background: '#EEF2FF', color: '#4F46E5', border: 'none', padding: '8px 14px', borderRadius: '9px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>Call</button>
                              <button onClick={() => markNoShow(e)} title="No-show" style={{ background: '#F1F5F9', color: '#64748B', border: 'none', padding: '8px', borderRadius: '9px', cursor: 'pointer', display: 'flex' }}><IconX /></button>
                            </>
                          )}
                          {isNoShow && (
                            <button onClick={() => requeue(e)} style={{ background: '#EEF2FF', color: '#4F46E5', border: 'none', padding: '8px 14px', borderRadius: '9px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>Re-queue</button>
                          )}
                          {!isNoShow && (
                            <button onClick={() => openScoring(e)} title="Score this student" style={{ background: e.scored_at ? '#FFE4E6' : '#F1F5F9', color: e.scored_at ? ROSE : '#475569', border: 'none', padding: '8px 14px', borderRadius: '9px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>{e.scored_at ? 'Edit score' : 'Score'}</button>
                          )}
                          <button onClick={() => removeEntry(e)} title="Remove" style={{ background: '#FEF2F2', color: '#EF4444', border: 'none', padding: '8px', borderRadius: '9px', cursor: 'pointer', display: 'flex' }}><IconTrash /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};