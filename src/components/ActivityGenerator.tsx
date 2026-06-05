import React, { useState, useRef, useEffect } from 'react';
import {
  generateLessonPassage,
  generateTrueFalse,
  generateComprehensionQuestions,
  generateVocabularySet,
  generateDiscussion,
  generateGrammarNoticing,
  generateQuickVocab,
  generateQuickGrammar,
} from '../aiGenerator';
import type {
  TFItem,
  QAItem,
  VocabularyPart,
  GrammarNoticing,
  QuickVocabActivity,
  QuickGrammarActivity,
} from '../aiGenerator';

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconWand    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/></svg>;
const IconDownload= () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const IconWord    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
const IconTrash   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
const IconSpinner = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{animation:'spin 0.9s linear infinite'}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;
const IconRefresh = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>;
const IconShuffle = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>;
const IconBreak   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><polyline points="8 8 3 12 8 16"/><polyline points="16 8 21 12 16 16"/></svg>;
const IconSave    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
const IconCheck   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconEdit    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>;
const IconLock    = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;

// ─── Types ────────────────────────────────────────────────────────────────────
type SectionKind = 'tf' | 'comprehension' | 'vocab' | 'discussion' | 'grammar' | 'quickVocab' | 'quickGrammar';

type TFSection    = { id: string; kind: 'tf';            pageBreakBefore: boolean; items: TFItem[] };
type CompSection  = { id: string; kind: 'comprehension'; pageBreakBefore: boolean; items: QAItem[] };
type VocabSection = { id: string; kind: 'vocab';         pageBreakBefore: boolean; vp: VocabularyPart; wordOrder: number[]; defOrder: number[]; bankOrder: number[] };
type DiscSection  = { id: string; kind: 'discussion';    pageBreakBefore: boolean; items: string[] };
type GramSection  = { id: string; kind: 'grammar';       pageBreakBefore: boolean; data: GrammarNoticing };
type QVocabSection = { id: string; kind: 'quickVocab';   pageBreakBefore: boolean; qv: QuickVocabActivity; wordOrder: number[]; defOrder: number[]; bankOrder: number[] };
type QGramSection  = { id: string; kind: 'quickGrammar'; pageBreakBefore: boolean; data: QuickGrammarActivity };
type Section      = TFSection | CompSection | VocabSection | DiscSection | GramSection | QVocabSection | QGramSection;

type Mode      = 'lesson' | 'quick';
type Source    = 'topic' | 'paste';
type QuickType = 'vocab' | 'grammar';

type Persisted = {
  mode: Mode; title: string; level: string; passage: string; passageApproved: boolean;
  sections: Section[]; showName: boolean; showDate: boolean; showClass: boolean; showScore: boolean;
};

// ─── Constants ────────────────────────────────────────────────────────────────
const ORDER: Record<SectionKind, number> = { tf: 0, comprehension: 1, vocab: 2, discussion: 3, grammar: 4, quickVocab: 2, quickGrammar: 4 };

const INSTR = {
  tf:        'Read the statements below and decide if they are true (T) or false (F) based on the text.',
  comp:      'Answer the following questions in full sentences.',
  huntText:  'Find the exact word in the text that matches each of the definitions below.',
  huntNoTxt: 'Read each definition and write the word it describes.',
  matching:  'Match the words from the text (1-5) with their correct definitions (a-e).',
  gaps:      'Complete the sentences using the words from the box.',
  discussion:'Discuss these questions with a partner or in small groups.',
  glossary:  'Study these words, their meanings, and the example sentences.',
  qMatching: 'Match each word (1-5) with its correct definition (a-e).',
  qGaps:     'Complete each sentence with the correct word from the box.',
};

const lbl: React.CSSProperties = { display:'block', fontSize:'0.72rem', fontWeight:700, color:'#64748B', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.05em' };
const inp: React.CSSProperties = { width:'100%', padding:'9px 11px', borderRadius:'9px', border:'1.5px solid #E2E8F0', fontSize:'0.88rem', outline:'none', color:'#0F172A', fontFamily:'inherit', background:'#FAFAFA' };
const sel: React.CSSProperties = { ...inp, cursor:'pointer' };
const btn: React.CSSProperties = { padding:'5px 8px', border:'1px solid #E2E8F0', background:'#fff', borderRadius:'7px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:'0.73rem', fontWeight:600, color:'#475569', gap:'4px' };

// section accent colours (consistent with the rest of the dashboard)
const ACCENT: Record<SectionKind, { bg: string; text: string }> = {
  tf:            { bg:'#EEF2FF', text:'#4F46E5' },
  comprehension: { bg:'#EEF2FF', text:'#4F46E5' },
  vocab:         { bg:'#FFF7ED', text:'#EA580C' },
  discussion:    { bg:'#F0FDF4', text:'#16A34A' },
  grammar:       { bg:'#FEF2F2', text:'#DC2626' },
  quickVocab:    { bg:'#FFF7ED', text:'#EA580C' },
  quickGrammar:  { bg:'#FEF2F2', text:'#DC2626' },
};

// ─── Print CSS ────────────────────────────────────────────────────────────────
const PCSS = `
  @page { size: A4 portrait; margin: 18mm 20mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Times New Roman', serif; color:#000; line-height:1.6; background:#fff; margin:0; padding:0; font-size:14px; }
  .ws-fields { display:flex; flex-wrap:wrap; gap:28px; font-size:13.5px; margin-bottom:8px; }
  .ws-divider { border:none; border-top:1.5px solid #000; margin:0 0 22px; }
  h1.ws-title { text-align:center; font-size:21px; font-weight:bold; margin:0 0 22px; }
  .passage-text { font-size:14px; line-height:1.85; text-align:justify; margin:0 0 26px; }
  .part-head { font-size:15px; font-weight:bold; margin:26px 0 6px; }
  .sub-head { font-size:14px; font-weight:bold; margin:14px 0 4px; }
  .instr { font-size:13px; font-style:italic; color:#333; margin:0 0 12px; }

  .q-block { page-break-inside:avoid; break-inside:avoid; }
  .tf-row { display:flex; justify-content:space-between; align-items:baseline; gap:14px; margin-bottom:12px; page-break-inside:avoid; }
  .tf-blank { border-bottom:1px solid #333; display:inline-block; width:46px; }
  .sa-q { font-size:14px; margin-bottom:6px; }
  .sa-line { border-bottom:1px solid #888; height:24px; margin-bottom:8px; }
  .hunt-row { font-size:14px; margin-bottom:13px; page-break-inside:avoid; }
  .hunt-blank { border-bottom:1px solid #333; display:inline-block; min-width:150px; }
  .match-table { width:100%; border-collapse:collapse; }
  .match-table th { text-align:left; font-size:12px; text-transform:uppercase; letter-spacing:0.04em; border-bottom:1px solid #000; padding:4px 8px; }
  .match-table td { font-size:14px; vertical-align:top; padding:6px 8px; page-break-inside:avoid; }
  .bank { border:1px solid #000; padding:8px 12px; font-size:14px; margin-bottom:16px; text-align:center; letter-spacing:0.01em; }
  .gap-row { font-size:14px; line-height:2.4; page-break-inside:avoid; }
  .gap-blank { border-bottom:1px solid #333; display:inline-block; min-width:120px; margin:0 3px; }
  .disc-q { font-size:14px; margin:0 0 8px; page-break-inside:avoid; }
  .disc-line { border-bottom:1px solid #888; height:26px; margin-bottom:9px; }
  .gr-step { font-size:13px; font-weight:bold; margin:12px 0 5px; text-transform:uppercase; letter-spacing:0.03em; color:#222; }
  .gr-sent { font-size:14px; margin-bottom:6px; }

  .blk { margin-bottom:8px; }
  .pbefore { page-break-before:always; break-before:page; }
  .pg-break { page-break-before:always; break-before:page; }
  .ak-item { font-size:13px; padding:3px 4px; border-bottom:1px solid #ddd; }
  .ak-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:6px; }

  .no-print { display:none !important; }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const shuffle = <T,>(a: T[]): T[] => { const r=[...a]; for(let i=r.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[r[i],r[j]]=[r[j],r[i]];} return r; };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// Render text with ___ runs turned into underline spans
const WithBlanks = ({ text, cls = 'gap-blank' }: { text: string; cls?: string }) => {
  const parts = text.split(/_{2,}/g);
  if (parts.length === 1) return <>{text}</>;
  return (
    <>
      {parts.map((p, i) => (
        <React.Fragment key={i}>
          {p}
          {i < parts.length - 1 && <span className={cls}>&nbsp;</span>}
        </React.Fragment>
      ))}
    </>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────────
export const ActivityGenerator = () => {
  const [tab, setTab]                 = useState<'build' | 'settings'>('build');
  const [mode, setMode]               = useState<Mode>('lesson');
  const [level, setLevel]             = useState('B1');

  // lesson — passage
  const [source, setSource]           = useState<Source>('topic');
  const [topic, setTopic]             = useState('');
  const [pasteText, setPasteText]     = useState('');
  const [passageWords, setPassageWords] = useState(250);
  const [passage, setPassage]         = useState('');
  const [passageApproved, setApproved]= useState(false);

  // quick
  const [quickType, setQuickType]     = useState<QuickType>('vocab');
  const [quickTheme, setQuickTheme]   = useState('');
  const [grammarPoint, setGrammarPoint] = useState('');

  // worksheet
  const [title, setTitle]             = useState('');
  const [sections, setSections]       = useState<Section[]>([]);
  const [showName, setShowName]       = useState(true);
  const [showDate, setShowDate]       = useState(true);
  const [showClass, setShowClass]     = useState(false);
  const [showScore, setShowScore]     = useState(false);

  // ui
  const [busy, setBusy]               = useState<string | null>(null); // 'passage' | section kind | null
  const [restore, setRestore]         = useState<Persisted | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // ── autosave / restore ──────────────────────────────────────────────────────
  useEffect(() => {
    try { const raw = localStorage.getItem('ll_ws_v2'); if (raw) { const d = JSON.parse(raw); if (d.passage || d.sections?.length) setRestore(d); } } catch {}
  }, []);
  useEffect(() => {
    if (!passage && sections.length === 0) return;
    try {
      const data: Persisted = { mode, title, level, passage, passageApproved, sections, showName, showDate, showClass, showScore };
      localStorage.setItem('ll_ws_v2', JSON.stringify(data));
    } catch {}
  }, [mode, title, level, passage, passageApproved, sections, showName, showDate, showClass, showScore]);

  const doRestore = () => {
    if (!restore) return;
    setMode(restore.mode); setTitle(restore.title); setLevel(restore.level);
    setPassage(restore.passage); setApproved(restore.passageApproved); setSections(restore.sections);
    setShowName(restore.showName); setShowDate(restore.showDate); setShowClass(restore.showClass); setShowScore(restore.showScore);
    setRestore(null);
  };

  // ── section helpers ───────────────────────────────────────────────────────────
  const getSection = <K extends SectionKind>(k: K) => sections.find(s => s.kind === k) as Extract<Section, { kind: K }> | undefined;
  const upsert = (sec: Section) => setSections(prev => {
    const rest = prev.filter(s => s.kind !== sec.kind);
    return [...rest, sec].sort((a, b) => ORDER[a.kind] - ORDER[b.kind]);
  });
  const removeSection = (k: SectionKind) => setSections(prev => prev.filter(s => s.kind !== k));
  const togglePB = (id: string) => setSections(prev => prev.map(s => s.id === id ? { ...s, pageBreakBefore: !s.pageBreakBefore } : s));

  const hasContent = !!passage || sections.length > 0;

  // ── passage ─────────────────────────────────────────────────────────────────
  const genPassage = async () => {
    if (!topic.trim()) return alert('Please enter a topic for the passage.');
    setBusy('passage');
    const p = await generateLessonPassage(topic, level, passageWords);
    if (p) { setPassage(p); setApproved(false); if (!title.trim()) setTitle(topic.trim()); }
    else alert('Passage generation failed. Please try again.');
    setBusy(null);
  };
  const usePasted = () => {
    if (!pasteText.trim()) return alert('Please paste your source text.');
    setPassage(pasteText.trim()); setApproved(false);
  };
  const approvePassage = () => { if (!passage.trim()) return; setApproved(true); };
  const editPassage    = () => setApproved(false);

  // ── section generators (lesson) ───────────────────────────────────────────────
  const guardLesson = () => { if (mode === 'lesson' && !passageApproved) { alert('Approve a passage first, then build the activities on it.'); return false; } return true; };

  const buildVocab = (vp: VocabularyPart, pb = false): VocabSection => ({
    id: uid(), kind: 'vocab', pageBreakBefore: pb, vp,
    wordOrder: shuffle(vp.matching.map((_, i) => i)),
    defOrder:  shuffle(vp.matching.map((_, i) => i)),
    bankOrder: shuffle([...vp.gaps.map((_, i) => i), ...vp.distractors.map((_, i) => vp.gaps.length + i)]),
  });

  const buildQuickVocab = (qv: QuickVocabActivity, pb = false): QVocabSection => ({
    id: uid(), kind: 'quickVocab', pageBreakBefore: pb, qv,
    wordOrder: shuffle(qv.matching.map((_, i) => i)),
    defOrder:  shuffle(qv.matching.map((_, i) => i)),
    bankOrder: shuffle(qv.glossary.map((_, i) => i)),   // bank = all glossary words (unused ones act as distractors)
  });

  const genTF = async () => {
    if (!guardLesson()) return; setBusy('tf');
    const items = await generateTrueFalse(passage, level);
    if (items) upsert({ id: getSection('tf')?.id ?? uid(), kind: 'tf', pageBreakBefore: getSection('tf')?.pageBreakBefore ?? false, items });
    else alert('True/False generation failed. Please try again.');
    setBusy(null);
  };
  const genComp = async () => {
    if (!guardLesson()) return; setBusy('comprehension');
    const items = await generateComprehensionQuestions(passage, level);
    if (items) upsert({ id: getSection('comprehension')?.id ?? uid(), kind: 'comprehension', pageBreakBefore: getSection('comprehension')?.pageBreakBefore ?? false, items });
    else alert('Comprehension generation failed. Please try again.');
    setBusy(null);
  };
  const genVocab = async () => {
    if (!guardLesson()) return; setBusy('vocab');
    const vp = await generateVocabularySet(passage, level, true);
    if (vp) upsert(buildVocab(vp, getSection('vocab')?.pageBreakBefore ?? false));
    else alert('Vocabulary generation failed. Please try again.');
    setBusy(null);
  };
  const genDisc = async () => {
    if (!guardLesson()) return; setBusy('discussion');
    const items = await generateDiscussion(passage, level);
    if (items) upsert({ id: getSection('discussion')?.id ?? uid(), kind: 'discussion', pageBreakBefore: getSection('discussion')?.pageBreakBefore ?? false, items });
    else alert('Discussion generation failed. Please try again.');
    setBusy(null);
  };
  const genGrammar = async () => {
    if (!guardLesson()) return;
    if (!grammarPoint.trim()) return alert('Enter a grammar point for Part 4 (e.g. "present perfect").');
    setBusy('grammar');
    const data = await generateGrammarNoticing(grammarPoint, level, passage);
    if (data) upsert({ id: getSection('grammar')?.id ?? uid(), kind: 'grammar', pageBreakBefore: getSection('grammar')?.pageBreakBefore ?? false, data });
    else alert('Grammar Noticing generation failed. Please try again.');
    setBusy(null);
  };

  // ── quick mode ──────────────────────────────────────────────────────────────
  const genQuickVocab = async () => {
    if (!quickTheme.trim()) return alert('Enter a vocabulary theme.');
    setBusy('quickVocab');
    const qv = await generateQuickVocab(quickTheme, level);
    if (qv) { setSections([buildQuickVocab(qv)]); if (!title.trim()) setTitle(`Vocabulary: ${quickTheme.trim()}`); }
    else alert('Vocabulary generation failed. Please try again.');
    setBusy(null);
  };
  const genQuickGrammar = async () => {
    if (!grammarPoint.trim()) return alert('Enter a grammar point.');
    setBusy('quickGrammar');
    const data = await generateQuickGrammar(grammarPoint, level);
    if (data) { setSections([{ id: uid(), kind: 'quickGrammar', pageBreakBefore: false, data }]); if (!title.trim()) setTitle(`Grammar: ${grammarPoint.trim()}`); }
    else alert('Grammar generation failed. Please try again.');
    setBusy(null);
  };

  // ── reshuffle (client-side, instant) ──────────────────────────────────────────
  const reshuffleMatching = (id: string) => setSections(prev => prev.map(s => s.kind === 'vocab' && s.id === id ? { ...s, wordOrder: shuffle(s.vp.matching.map((_, i) => i)), defOrder: shuffle(s.vp.matching.map((_, i) => i)) } : s));
  const reshuffleBank     = (id: string) => setSections(prev => prev.map(s => s.kind === 'vocab' && s.id === id ? { ...s, bankOrder: shuffle([...s.vp.gaps.map((_, i) => i), ...s.vp.distractors.map((_, i) => s.vp.gaps.length + i)]) } : s));
  const reshuffleQMatching = (id: string) => setSections(prev => prev.map(s => s.kind === 'quickVocab' && s.id === id ? { ...s, wordOrder: shuffle(s.qv.matching.map((_, i) => i)), defOrder: shuffle(s.qv.matching.map((_, i) => i)) } : s));
  const reshuffleQBank     = (id: string) => setSections(prev => prev.map(s => s.kind === 'quickVocab' && s.id === id ? { ...s, bankOrder: shuffle(s.qv.glossary.map((_, i) => i)) } : s));

  const clearAll = () => { if (window.confirm('Clear the entire worksheet?')) { setPassage(''); setApproved(false); setSections([]); setTitle(''); localStorage.removeItem('ll_ws_v2'); } };

  // ── export ────────────────────────────────────────────────────────────────────
  const cleanHTML = () => { const c = printRef.current?.cloneNode(true) as HTMLElement; if (!c) return ''; c.querySelectorAll('.no-print').forEach(e => e.remove()); return c.innerHTML; };
  const doPrint = () => { const w = window.open('', '', 'width=960,height=1080'); if (!w) return; w.document.write(`<html><head><title>${title || 'Worksheet'}</title><style>${PCSS}</style></head><body>${cleanHTML()}</body></html>`); w.document.close(); setTimeout(() => { w.print(); w.close(); }, 600); };
  const doWord = () => { const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'><head><meta charset='utf-8'><style>${PCSS} body{margin:2cm 2.5cm}</style></head><body>${cleanHTML()}</body></html>`; const b = new Blob(['\ufeff', html], { type: 'application/msword' }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `${(title || 'worksheet').replace(/\s+/g, '-')}.doc`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(u); };

  // ── small UI atom: per-section toolbar (screen only) ──────────────────────────
  const Tools = ({ kind, id, onRegen, extra }: { kind: SectionKind; id: string; onRegen: () => void; extra?: React.ReactNode }) => {
    const sec = sections.find(s => s.id === id);
    const isBusy = busy === kind;
    const a = ACCENT[kind];
    return (
      <div className="no-print" style={{ display:'flex', gap:'4px', alignItems:'center', marginBottom:'8px', flexWrap:'wrap' }}>
        <span style={{ fontSize:'10px', fontWeight:800, textTransform:'uppercase', padding:'2px 7px', borderRadius:'5px', background:a.bg, color:a.text }}>{kind === 'tf' ? 'True / False' : kind === 'comprehension' ? 'Comprehension' : kind === 'vocab' || kind === 'quickVocab' ? 'Vocabulary' : kind === 'discussion' ? 'Discussion' : 'Grammar'}</span>
        <div style={{ flex:1 }} />
        {extra}
        <button onClick={onRegen} disabled={!!busy} title="Regenerate this section" style={{ ...btn, padding:'4px 8px', color: isBusy ? a.text : '#475569' }}>{isBusy ? <IconSpinner /> : <IconRefresh />}&nbsp;Regenerate</button>
        <button onClick={() => sec && togglePB(sec.id)} title="Page break before" style={{ ...btn, padding:'4px 6px', background: sec?.pageBreakBefore ? a.bg : '#fff', color: sec?.pageBreakBefore ? a.text : '#94A3B8' }}><IconBreak /></button>
        <button onClick={() => removeSection(kind)} title="Remove section" style={{ ...btn, padding:'4px 6px', background:'#FEF2F2', color:'#EF4444', border:'none' }}><IconTrash /></button>
      </div>
    );
  };

  // ── renderers ────────────────────────────────────────────────────────────────
  const ed = { contentEditable: true, suppressContentEditableWarning: true, style: { outline:'none' as const } };

  const renderTF = (s: TFSection) => (
    <>{s.items.map((it, i) => (
      <div key={i} className="tf-row">
        <span {...ed} style={{ flex:1, fontSize:'14px', outline:'none' }}>{i + 1}.&nbsp;{it.q}</span>
        <span className="tf-blank" style={{ borderBottom:'1px solid #333', display:'inline-block', width:'46px', flexShrink:0 }}>&nbsp;</span>
      </div>
    ))}</>
  );

  const renderComp = (s: CompSection) => (
    <>{s.items.map((it, i) => (
      <div key={i} className="q-block" style={{ marginBottom:'14px' }}>
        <div className="sa-q" {...ed} style={{ fontSize:'14px', marginBottom:'6px', outline:'none' }}>{i + 1}.&nbsp;{it.q}</div>
        {[0, 1].map(l => <div key={l} className="sa-line" style={{ borderBottom:'1px solid #888', height:'24px', marginBottom:'8px' }} />)}
      </div>
    ))}</>
  );

  const renderHunt = (vp: VocabularyPart) => (
    <>{vp.hunt.map((h, i) => {
      const tag = [h.pos, h.hint].filter(Boolean).join(' ');
      return (
        <div key={i} className="hunt-row" {...ed} style={{ fontSize:'14px', marginBottom:'13px', outline:'none' }}>
          {i + 1}.&nbsp;<span style={{ fontStyle:'italic' }}>({tag})</span>&nbsp;{h.definition}:&nbsp;
          <span className="hunt-blank" style={{ borderBottom:'1px solid #333', display:'inline-block', minWidth:'150px' }}>&nbsp;</span>
        </div>
      );
    })}</>
  );

  const renderMatching = (s: VocabSection) => (
    <table className="match-table" style={{ width:'100%', borderCollapse:'collapse' }}>
      <thead><tr>
        <th style={{ textAlign:'left', fontSize:'12px', textTransform:'uppercase', letterSpacing:'0.04em', borderBottom:'1px solid #000', padding:'4px 8px' }}>Word</th>
        <th style={{ textAlign:'left', fontSize:'12px', textTransform:'uppercase', letterSpacing:'0.04em', borderBottom:'1px solid #000', padding:'4px 8px' }}>Definition</th>
      </tr></thead>
      <tbody>{s.wordOrder.map((wi, row) => {
        const di = s.defOrder[row];
        const m = s.vp.matching[wi];
        const d = s.vp.matching[di];
        return (
          <tr key={row}>
            <td style={{ fontSize:'14px', verticalAlign:'top', padding:'6px 8px' }}><strong>{row + 1}.</strong>&nbsp;<span {...ed}>{m.word}</span>&nbsp;<span style={{ fontStyle:'italic' }}>({m.pos})</span></td>
            <td style={{ fontSize:'14px', verticalAlign:'top', padding:'6px 8px' }}><strong>{String.fromCharCode(97 + row)}.</strong>&nbsp;<span {...ed}>{d.definition}</span></td>
          </tr>
        );
      })}</tbody>
    </table>
  );

  const renderGaps = (s: VocabSection) => {
    const bankWord = (idx: number) => idx < s.vp.gaps.length ? s.vp.gaps[idx].answer : s.vp.distractors[idx - s.vp.gaps.length].word;
    const bank = s.bankOrder.map(bankWord);
    return (
      <>
        <div className="bank" style={{ border:'1px solid #000', padding:'8px 12px', fontSize:'14px', marginBottom:'16px', textAlign:'center' }}>[&nbsp;{bank.join('  |  ')}&nbsp;]</div>
        {s.vp.gaps.map((g, i) => (
          <div key={i} className="gap-row" style={{ fontSize:'14px', lineHeight:2.4 }}>
            <span {...ed}>{i + 1}.&nbsp;<WithBlanks text={g.sentence} /></span>
          </div>
        ))}
      </>
    );
  };

  const renderDisc = (s: DiscSection) => (
    <>{s.items.map((q, i) => (
      <div key={i} style={{ marginBottom:'14px' }}>
        <div className="disc-q" {...ed} style={{ fontSize:'14px', marginBottom:'8px', outline:'none' }}>{i + 1}.&nbsp;{q}</div>
        {[0, 1, 2, 3, 4, 5].map(l => <div key={l} className="disc-line" style={{ borderBottom:'1px solid #888', height:'26px', marginBottom:'9px' }} />)}
      </div>
    ))}</>
  );

  const renderGrammar = (s: GramSection) => {
    const g = s.data;
    return (
      <>
        <div className="gr-step">Step 1 — Notice these sentences</div>
        {g.targetSentences.map((t, i) => <div key={i} className="gr-sent" {...ed} style={{ fontSize:'14px', marginBottom:'6px', outline:'none' }}>•&nbsp;{t}</div>)}
        <div className="gr-step">Step 2 — What do you notice?</div>
        {g.observationQuestions.map((q, i) => (
          <div key={i} style={{ marginBottom:'8px' }}>
            <div {...ed} style={{ fontSize:'14px', marginBottom:'4px', outline:'none' }}>{i + 1}.&nbsp;{q}</div>
            <div style={{ borderBottom:'1px solid #888', height:'22px' }} />
          </div>
        ))}
        <div className="gr-step">Step 3 — Complete the rule</div>
        <div className="gap-row" {...ed} style={{ fontSize:'14px', lineHeight:2.2, marginBottom:'6px', outline:'none' }}><WithBlanks text={g.ruleText} /></div>
        <div className="gr-step">Step 4 — Practice</div>
        {g.practice.map((p, i) => (
          <div key={i} className="gap-row" style={{ fontSize:'14px', lineHeight:2.4 }}>
            <span {...ed}>{i + 1}.&nbsp;<WithBlanks text={p.q} /></span>
          </div>
        ))}
      </>
    );
  };

  // ── quick-mode renderers ─────────────────────────────────────────────────────
  const renderGlossary = (s: QVocabSection) => (
    <table className="match-table" style={{ width:'100%', borderCollapse:'collapse' }}>
      <tbody>{s.qv.glossary.map((g, i) => (
        <tr key={i}>
          <td style={{ fontSize:'14px', verticalAlign:'top', padding:'7px 8px', whiteSpace:'nowrap' }}><strong {...ed}>{g.word}</strong>&nbsp;<span style={{ fontStyle:'italic' }}>({g.pos})</span></td>
          <td style={{ fontSize:'14px', verticalAlign:'top', padding:'7px 8px' }}>
            <span {...ed}>{g.definition}</span>
            {g.example && <div {...ed} style={{ fontStyle:'italic', color:'#555', marginTop:'2px' }}>e.g. {g.example}</div>}
          </td>
        </tr>
      ))}</tbody>
    </table>
  );

  const renderQMatching = (s: QVocabSection) => (
    <table className="match-table" style={{ width:'100%', borderCollapse:'collapse' }}>
      <thead><tr>
        <th style={{ textAlign:'left', fontSize:'12px', textTransform:'uppercase', letterSpacing:'0.04em', borderBottom:'1px solid #000', padding:'4px 8px' }}>Word</th>
        <th style={{ textAlign:'left', fontSize:'12px', textTransform:'uppercase', letterSpacing:'0.04em', borderBottom:'1px solid #000', padding:'4px 8px' }}>Definition</th>
      </tr></thead>
      <tbody>{s.wordOrder.map((wi, row) => {
        const di = s.defOrder[row];
        const m = s.qv.matching[wi];
        const d = s.qv.matching[di];
        return (
          <tr key={row}>
            <td style={{ fontSize:'14px', verticalAlign:'top', padding:'6px 8px' }}><strong>{row + 1}.</strong>&nbsp;<span {...ed}>{m.word}</span>&nbsp;<span style={{ fontStyle:'italic' }}>({m.pos})</span></td>
            <td style={{ fontSize:'14px', verticalAlign:'top', padding:'6px 8px' }}><strong>{String.fromCharCode(97 + row)}.</strong>&nbsp;<span {...ed}>{d.definition}</span></td>
          </tr>
        );
      })}</tbody>
    </table>
  );

  const renderQGaps = (s: QVocabSection) => {
    const bank = s.bankOrder.map(i => s.qv.glossary[i].word);
    return (
      <>
        <div className="bank" style={{ border:'1px solid #000', padding:'8px 12px', fontSize:'14px', marginBottom:'16px', textAlign:'center' }}>[&nbsp;{bank.join('  |  ')}&nbsp;]</div>
        {s.qv.gaps.map((g, i) => (
          <div key={i} className="gap-row" style={{ fontSize:'14px', lineHeight:2.4 }}>
            <span {...ed}>{i + 1}.&nbsp;<WithBlanks text={g.sentence} /></span>
          </div>
        ))}
      </>
    );
  };

  const renderQuickGrammar = (s: QGramSection) => {
    const g = s.data;
    return (
      <>
        <div style={{ border:'1px solid #000', padding:'10px 14px', marginBottom:'18px', fontSize:'14px' }}>
          <div {...ed} style={{ marginBottom:'6px' }}><strong>Remember:</strong>&nbsp;{g.rule}</div>
          {g.examples.map((ex, i) => <div key={i} {...ed} style={{ fontStyle:'italic', color:'#444' }}>•&nbsp;{ex}</div>)}
        </div>
        {g.exercises.map((ex, xi) => (
          <div key={xi} style={{ marginBottom:'18px' }}>
            {subHead(`${String.fromCharCode(65 + xi)}. ${ex.title}`)}
            {ex.instruction && instr(ex.instruction)}
            {ex.items.map((it, i) => {
              const inline = it.q.includes('___');
              return (
                <div key={i} className="gap-row" style={{ fontSize:'14px', lineHeight: inline ? 2.4 : 1.7, marginBottom: inline ? 0 : '10px' }}>
                  <span {...ed}>{i + 1}.&nbsp;<WithBlanks text={it.q} /></span>
                  {!inline && <div style={{ borderBottom:'1px solid #888', height:'22px', marginTop:'4px' }} />}
                </div>
              );
            })}
          </div>
        ))}
      </>
    );
  };

  // ── answer key ──────────────────────────────────────────────────────────────
  const akItem: React.CSSProperties = { fontSize:'13px', padding:'3px 4px', borderBottom:'1px solid #ddd' };
  const renderAnswerKey = () => {
    const blocks: React.ReactNode[] = [];
    const tf = getSection('tf');
    const comp = getSection('comprehension');
    const vocab = getSection('vocab');
    const gram = getSection('grammar');

    if (tf) blocks.push(<div key="ak-tf" style={{ marginBottom:'18px' }}><div style={{ fontSize:'12px', fontWeight:700, textTransform:'uppercase', color:'#555', marginBottom:'6px' }}>True or False</div><div className="ak-grid">{tf.items.map((it, i) => <div key={i} style={akItem}><strong>{i + 1}.</strong>&nbsp;{it.answer === 'True' ? 'T' : 'F'}</div>)}</div></div>);
    if (comp) blocks.push(<div key="ak-comp" style={{ marginBottom:'18px' }}><div style={{ fontSize:'12px', fontWeight:700, textTransform:'uppercase', color:'#555', marginBottom:'6px' }}>Comprehension (model answers)</div>{comp.items.map((it, i) => <div key={i} style={akItem}><strong>{i + 1}.</strong>&nbsp;{it.answer}</div>)}</div>);
    if (vocab) {
      blocks.push(<div key="ak-hunt" style={{ marginBottom:'14px' }}><div style={{ fontSize:'12px', fontWeight:700, textTransform:'uppercase', color:'#555', marginBottom:'6px' }}>Vocabulary Hunt</div><div className="ak-grid">{vocab.vp.hunt.map((h, i) => <div key={i} style={akItem}><strong>{i + 1}.</strong>&nbsp;{h.word}</div>)}</div></div>);
      blocks.push(<div key="ak-match" style={{ marginBottom:'14px' }}><div style={{ fontSize:'12px', fontWeight:700, textTransform:'uppercase', color:'#555', marginBottom:'6px' }}>Matching</div><div className="ak-grid">{vocab.wordOrder.map((wi, row) => { const di = vocab.defOrder.indexOf(wi); return <div key={row} style={akItem}><strong>{row + 1}.</strong>&nbsp;{String.fromCharCode(97 + di)}</div>; })}</div></div>);
      blocks.push(<div key="ak-gaps" style={{ marginBottom:'14px' }}><div style={{ fontSize:'12px', fontWeight:700, textTransform:'uppercase', color:'#555', marginBottom:'6px' }}>Fill in the Gaps</div><div className="ak-grid">{vocab.vp.gaps.map((g, i) => <div key={i} style={akItem}><strong>{i + 1}.</strong>&nbsp;{g.answer}</div>)}</div></div>);
    }
    if (gram) blocks.push(<div key="ak-gram" style={{ marginBottom:'14px' }}><div style={{ fontSize:'12px', fontWeight:700, textTransform:'uppercase', color:'#555', marginBottom:'6px' }}>Grammar — Practice</div>{gram.data.practice.map((p, i) => <div key={i} style={akItem}><strong>{i + 1}.</strong>&nbsp;{p.answer}</div>)}</div>);

    const qv = getSection('quickVocab');
    const qg = getSection('quickGrammar');
    if (qv) {
      blocks.push(<div key="ak-qmatch" style={{ marginBottom:'14px' }}><div style={{ fontSize:'12px', fontWeight:700, textTransform:'uppercase', color:'#555', marginBottom:'6px' }}>Matching</div><div className="ak-grid">{qv.wordOrder.map((wi, row) => { const di = qv.defOrder.indexOf(wi); return <div key={row} style={akItem}><strong>{row + 1}.</strong>&nbsp;{String.fromCharCode(97 + di)}</div>; })}</div></div>);
      blocks.push(<div key="ak-qgaps" style={{ marginBottom:'14px' }}><div style={{ fontSize:'12px', fontWeight:700, textTransform:'uppercase', color:'#555', marginBottom:'6px' }}>Fill in the Gaps</div><div className="ak-grid">{qv.qv.gaps.map((g, i) => <div key={i} style={akItem}><strong>{i + 1}.</strong>&nbsp;{g.answer}</div>)}</div></div>);
    }
    if (qg) qg.data.exercises.forEach((ex, xi) => blocks.push(
      <div key={`ak-qg-${xi}`} style={{ marginBottom:'14px' }}><div style={{ fontSize:'12px', fontWeight:700, textTransform:'uppercase', color:'#555', marginBottom:'6px' }}>{String.fromCharCode(65 + xi)}. {ex.title}</div><div className="ak-grid">{ex.items.map((it, i) => <div key={i} style={akItem}><strong>{i + 1}.</strong>&nbsp;{it.answer}</div>)}</div></div>
    ));

    if (!blocks.length) return null;
    return (
      <div className="pg-break" style={{ marginTop:'46px', paddingTop:'22px', borderTop:'2px solid #000' }}>
        <div style={{ textAlign:'center', fontSize:'17px', fontWeight:'bold', marginBottom:'20px' }}>Answer Key</div>
        {blocks}
      </div>
    );
  };

  // ── part / sub-section rendering ──────────────────────────────────────────────
  const tf = getSection('tf'), comp = getSection('comprehension'), vocab = getSection('vocab'), disc = getSection('discussion'), gram = getSection('grammar');
  const qVocab = getSection('quickVocab'), qGram = getSection('quickGrammar');
  const huntInstr = passage ? INSTR.huntText : INSTR.huntNoTxt;

  // sequential Part numbers based on what's present (lesson mode only)
  let partNo = 0;
  const part = (cond: boolean) => (cond ? ++partNo : partNo);
  const p1 = part(!!tf || !!comp);
  const p2 = part(!!vocab);
  const p3 = part(!!disc);
  const p4 = part(!!gram);
  const showParts = mode === 'lesson';

  const partHead = (n: number, label: string) => <div className="part-head" {...ed} style={{ fontSize:'15px', fontWeight:'bold', margin:'26px 0 6px', outline:'none' }}>{showParts ? `Part ${n}: ` : ''}{label}</div>;
  const subHead  = (label: string) => <div className="sub-head" style={{ fontSize:'14px', fontWeight:'bold', margin:'14px 0 4px' }}>{label}</div>;
  const instr    = (t: string) => <div className="instr" {...ed} style={{ fontSize:'13px', fontStyle:'italic', color:'#333', margin:'0 0 12px', outline:'none' }}>{t}</div>;
  const pbCls    = (s?: Section) => s?.pageBreakBefore ? 'blk pbefore' : 'blk';

  // ── sidebar: section button (lesson) ──────────────────────────────────────────
  const SectionBtn = ({ kind, label, onClick }: { kind: SectionKind; label: string; onClick: () => void }) => {
    const exists = !!getSection(kind);
    const isBusy = busy === kind;
    const disabled = (mode === 'lesson' && !passageApproved) || !!busy;
    const a = ACCENT[kind];
    return (
      <button onClick={onClick} disabled={disabled} style={{ width:'100%', padding:'10px 12px', borderRadius:'10px', border:`1.5px solid ${exists ? a.text : '#E2E8F0'}`, background: exists ? a.bg : '#fff', color: exists ? a.text : '#475569', fontWeight:700, fontSize:'0.82rem', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled && mode === 'lesson' && !passageApproved ? 0.5 : 1, display:'flex', alignItems:'center', justifyContent:'space-between', gap:'8px' }}>
        <span>{label}</span>
        <span style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'0.7rem', fontWeight:600 }}>{isBusy ? <IconSpinner /> : exists ? <><IconRefresh /> Regenerate</> : <>+ Generate</>}</span>
      </button>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display:'flex', gap:'28px', alignItems:'flex-start' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── SIDEBAR ─────────────────────────────────────────────────────────── */}
      <div style={{ flex:'0 0 320px', background:'#fff', borderRadius:'26px', padding:'22px', border:'1px solid #E2E8F0', boxShadow:'0 8px 24px rgba(0,0,0,0.04)', position:'sticky', top:'20px', maxHeight:'calc(100vh - 40px)', overflowY:'auto' }}>

        {/* tabs */}
        <div style={{ display:'flex', gap:'4px', background:'#F1F5F9', padding:'4px', borderRadius:'12px', marginBottom:'18px' }}>
          {(['build', 'settings'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ flex:1, padding:'7px', border:'none', borderRadius:'8px', fontWeight:700, fontSize:'0.74rem', cursor:'pointer', background: tab === t ? '#fff' : 'transparent', color: tab === t ? '#0F172A' : '#64748B', boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
              {t === 'build' ? '⚡ Build' : '⚙️ Worksheet'}
            </button>
          ))}
        </div>

        {tab === 'build' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            {/* mode */}
            <div style={{ display:'flex', gap:'4px', background:'#F1F5F9', padding:'4px', borderRadius:'10px' }}>
              {(['lesson', 'quick'] as const).map(m => (
                <button key={m} onClick={() => setMode(m)} style={{ flex:1, padding:'7px', border:'none', borderRadius:'7px', fontSize:'0.74rem', fontWeight:700, cursor:'pointer', background: mode === m ? '#fff' : 'transparent', color: mode === m ? '#4F46E5' : '#64748B', boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
                  {m === 'lesson' ? 'Full Lesson' : 'Quick Activity'}
                </button>
              ))}
            </div>

            <div><label style={lbl}>CEFR Level</label><select value={level} onChange={e => setLevel(e.target.value)} style={sel}>{['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(l => <option key={l}>{l}</option>)}</select></div>

            {/* ─── LESSON MODE ─────────────────────────────────────────────── */}
            {mode === 'lesson' && (
              <>
                <div style={{ borderTop:'1px solid #E2E8F0', paddingTop:'14px' }}>
                  <label style={lbl}>Step 1 — Passage</label>
                  <div style={{ display:'flex', gap:'4px', background:'#F1F5F9', padding:'4px', borderRadius:'10px', marginBottom:'10px' }}>
                    {(['topic', 'paste'] as const).map(sm => (
                      <button key={sm} onClick={() => setSource(sm)} style={{ flex:1, padding:'6px', border:'none', borderRadius:'7px', fontSize:'0.72rem', fontWeight:600, cursor:'pointer', background: source === sm ? '#fff' : 'transparent', color: source === sm ? '#4F46E5' : '#64748B', boxShadow: source === sm ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
                        {sm === 'topic' ? 'From Topic' : 'Paste Text'}
                      </button>
                    ))}
                  </div>

                  {source === 'topic' ? (
                    <>
                      <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g., the psychology of supermarkets" style={{ ...inp, marginBottom:'8px' }} />
                      <div style={{ marginBottom:'8px' }}><label style={lbl}>Length</label><select value={passageWords} onChange={e => setPassageWords(Number(e.target.value))} style={sel}>{[150, 200, 250, 300, 350].map(w => <option key={w} value={w}>{w} words</option>)}</select></div>
                      <button onClick={genPassage} disabled={!!busy} style={{ width:'100%', padding:'11px', background: busy === 'passage' ? '#6EE7B7' : '#10B981', color:'#fff', border:'none', borderRadius:'11px', fontWeight:700, fontSize:'0.85rem', cursor: busy ? 'wait' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
                        {busy === 'passage' ? <><IconSpinner /> Writing…</> : passage ? <><IconRefresh /> Regenerate Passage</> : '+ Generate Passage'}
                      </button>
                    </>
                  ) : (
                    <>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'5px' }}><label style={lbl}>Source text</label><span style={{ fontSize:'0.68rem', color: pasteText.length > 3600 ? '#EF4444' : '#94A3B8', fontWeight:600 }}>{pasteText.length}/4000</span></div>
                      <textarea maxLength={4000} value={pasteText} onChange={e => setPasteText(e.target.value)} placeholder="Paste any article or text here…" rows={5} style={{ ...inp, resize:'vertical', lineHeight:1.4, marginBottom:'8px' }} />
                      <button onClick={usePasted} style={{ width:'100%', padding:'10px', background:'#10B981', color:'#fff', border:'none', borderRadius:'11px', fontWeight:700, fontSize:'0.84rem', cursor:'pointer' }}>Use This Text</button>
                    </>
                  )}

                  {/* approval gate */}
                  {passage && (
                    passageApproved ? (
                      <div style={{ marginTop:'10px', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:'10px', padding:'8px 11px' }}>
                        <span style={{ fontSize:'0.76rem', fontWeight:700, color:'#16A34A', display:'flex', alignItems:'center', gap:'6px' }}><IconCheck /> Passage approved</span>
                        <button onClick={editPassage} style={{ ...btn, padding:'4px 8px' }}><IconEdit /> Edit</button>
                      </div>
                    ) : (
                      <button onClick={approvePassage} style={{ marginTop:'10px', width:'100%', padding:'10px', background:'#4F46E5', color:'#fff', border:'none', borderRadius:'11px', fontWeight:700, fontSize:'0.84rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'7px' }}><IconCheck /> Approve passage → build activities</button>
                    )
                  )}
                </div>

                {/* Step 2 — activities */}
                <div style={{ borderTop:'1px solid #E2E8F0', paddingTop:'14px' }}>
                  <label style={{ ...lbl, display:'flex', alignItems:'center', gap:'6px' }}>Step 2 — Activities {!passageApproved && <span style={{ color:'#94A3B8', display:'inline-flex', alignItems:'center', gap:'3px', textTransform:'none', letterSpacing:0, fontWeight:600 }}><IconLock /> approve passage first</span>}</label>
                  <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                    <SectionBtn kind="tf" label="Part 1A · True / False" onClick={genTF} />
                    <SectionBtn kind="comprehension" label="Part 1B · Comprehension" onClick={genComp} />
                    <SectionBtn kind="vocab" label="Part 2 · Vocabulary" onClick={genVocab} />
                    <SectionBtn kind="discussion" label="Part 3 · Discussion" onClick={genDisc} />
                    <div style={{ borderTop:'1px dashed #E2E8F0', paddingTop:'8px' }}>
                      <label style={lbl}>Part 4 · Grammar Noticing (optional)</label>
                      <input value={grammarPoint} onChange={e => setGrammarPoint(e.target.value)} placeholder="grammar point, e.g. present perfect" style={{ ...inp, marginBottom:'8px' }} />
                      <SectionBtn kind="grammar" label="Part 4 · Grammar Noticing" onClick={genGrammar} />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ─── QUICK MODE ──────────────────────────────────────────────── */}
            {mode === 'quick' && (
              <div style={{ borderTop:'1px solid #E2E8F0', paddingTop:'14px' }}>
                <div style={{ display:'flex', gap:'4px', background:'#F1F5F9', padding:'4px', borderRadius:'10px', marginBottom:'12px' }}>
                  {(['vocab', 'grammar'] as const).map(qt => (
                    <button key={qt} onClick={() => setQuickType(qt)} style={{ flex:1, padding:'6px', border:'none', borderRadius:'7px', fontSize:'0.72rem', fontWeight:600, cursor:'pointer', background: quickType === qt ? '#fff' : 'transparent', color: quickType === qt ? '#4F46E5' : '#64748B', boxShadow: quickType === qt ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
                      {qt === 'vocab' ? 'Vocabulary' : 'Grammar'}
                    </button>
                  ))}
                </div>
                {quickType === 'vocab' ? (
                  <>
                    <label style={lbl}>Theme</label>
                    <input value={quickTheme} onChange={e => setQuickTheme(e.target.value)} placeholder="e.g., travel and transport" style={{ ...inp, marginBottom:'10px' }} />
                    <button onClick={genQuickVocab} disabled={!!busy} style={{ width:'100%', padding:'11px', background: busy ? '#FDBA74' : '#EA580C', color:'#fff', border:'none', borderRadius:'11px', fontWeight:700, fontSize:'0.85rem', cursor: busy ? 'wait' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>{busy === 'quickVocab' ? <><IconSpinner /> Generating…</> : '+ Generate Vocabulary'}</button>
                  </>
                ) : (
                  <>
                    <label style={lbl}>Grammar point</label>
                    <input value={grammarPoint} onChange={e => setGrammarPoint(e.target.value)} placeholder="e.g., second conditional" style={{ ...inp, marginBottom:'10px' }} />
                    <button onClick={genQuickGrammar} disabled={!!busy} style={{ width:'100%', padding:'11px', background: busy ? '#FCA5A5' : '#DC2626', color:'#fff', border:'none', borderRadius:'11px', fontWeight:700, fontSize:'0.85rem', cursor: busy ? 'wait' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>{busy === 'quickGrammar' ? <><IconSpinner /> Generating…</> : '+ Generate Grammar'}</button>
                  </>
                )}
              </div>
            )}

            {hasContent && <button onClick={clearAll} style={{ width:'100%', padding:'7px', background:'transparent', color:'#EF4444', border:'none', fontWeight:600, cursor:'pointer', fontSize:'0.78rem' }}>✕ Clear Entire Worksheet</button>}
          </div>
        )}

        {tab === 'settings' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            <div><label style={lbl}>Worksheet Title</label><input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title shown at the top" style={inp} /></div>
            <div>
              <label style={lbl}>Header Fields</label>
              {[{ k:'name', l:'Name', v:showName, s:setShowName }, { k:'date', l:'Date', v:showDate, s:setShowDate }, { k:'class', l:'Class', v:showClass, s:setShowClass }, { k:'score', l:'Score / 100', v:showScore, s:setShowScore }].map(({ k, l, v, s }) => (
                <label key={k} style={{ display:'flex', alignItems:'center', gap:'10px', cursor:'pointer', fontSize:'0.83rem', color:'#475569', fontWeight:500, marginBottom:'8px' }}>
                  <input type="checkbox" checked={v} onChange={e => s(e.target.checked)} style={{ width:'15px', height:'15px', accentColor:'#4F46E5', cursor:'pointer' }} />{l}
                </label>
              ))}
            </div>
            <div style={{ fontSize:'0.74rem', color:'#94A3B8', lineHeight:1.5 }}>Tip: you can click any text in the preview (passage, questions, definitions) to edit it before exporting.</div>
          </div>
        )}
      </div>

      {/* ── PREVIEW ─────────────────────────────────────────────────────────── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', gap:'12px', minWidth:0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontSize:'0.78rem', color:'#94A3B8', fontWeight:600 }}>{sections.length > 0 && `${sections.length} section${sections.length !== 1 ? 's' : ''}`}</div>
          <div style={{ display:'flex', gap:'7px' }}>
            <button onClick={doWord} disabled={!hasContent} style={{ background:'#2563EB', color:'#fff', border:'none', padding:'9px 16px', borderRadius:'9999px', fontWeight:600, fontSize:'0.78rem', display:'flex', alignItems:'center', gap:'6px', cursor: hasContent ? 'pointer' : 'not-allowed', opacity: hasContent ? 1 : 0.45 }}><IconWord /> Export to Word</button>
            <button onClick={doPrint} disabled={!hasContent} style={{ background:'#4F46E5', color:'#fff', border:'none', padding:'9px 16px', borderRadius:'9999px', fontWeight:600, fontSize:'0.78rem', display:'flex', alignItems:'center', gap:'6px', cursor: hasContent ? 'pointer' : 'not-allowed', opacity: hasContent ? 1 : 0.45 }}><IconDownload /> Export to PDF</button>
          </div>
        </div>

        {restore && !hasContent && (
          <div style={{ background:'#EEF2FF', border:'1px solid #C7D2FE', borderRadius:'12px', padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:'0.83rem', color:'#4338CA', fontWeight:600 }}>📄 You have an unsaved worksheet — restore it?</span>
            <div style={{ display:'flex', gap:'8px' }}>
              <button onClick={doRestore} style={{ background:'#4F46E5', color:'#fff', border:'none', padding:'6px 14px', borderRadius:'8px', fontWeight:600, fontSize:'0.78rem', cursor:'pointer' }}>Restore</button>
              <button onClick={() => setRestore(null)} style={{ background:'transparent', color:'#64748B', border:'none', fontWeight:600, fontSize:'0.78rem', cursor:'pointer' }}>Dismiss</button>
            </div>
          </div>
        )}

        {/* paper */}
        <div style={{ background:'#fff', padding:'44px 52px', borderRadius:'18px', border:'1px solid #E2E8F0', boxShadow:'0 16px 40px rgba(0,0,0,0.04)', minHeight:'842px', maxWidth:'860px', width:'100%', margin:'0 auto', color:'#0F172A', position:'relative' }}>
          {!hasContent && (
            <div style={{ display:'flex', height:'560px', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'10px', color:'#CBD5E1', textAlign:'center' }}>
              <IconWand />
              <span style={{ fontSize:'0.9rem', fontWeight:500, maxWidth:'320px' }}>{mode === 'lesson' ? 'Start with Step 1 — generate or paste a passage, approve it, then build each activity.' : 'Choose a theme or grammar point and generate a standalone activity.'}</span>
            </div>
          )}

          {hasContent && (
            <div ref={printRef} style={{ fontFamily:'"Times New Roman", serif' }}>
              {/* header */}
              {(showName || showDate || showClass || showScore) && (
                <>
                  <div className="ws-fields" style={{ display:'flex', flexWrap:'wrap', gap:'28px', fontSize:'13.5px', marginBottom:'8px' }}>
                    {showName && <span>Name:&nbsp;______________________________</span>}
                    {showDate && <span>Date:&nbsp;______________</span>}
                    {showClass && <span>Class:&nbsp;____________</span>}
                    {showScore && <span>Score:&nbsp;___ / 100</span>}
                  </div>
                  <hr className="ws-divider" style={{ border:'none', borderTop:'1.5px solid #000', margin:'0 0 22px' }} />
                </>
              )}

              {/* title */}
              {title && <h1 className="ws-title" {...ed} style={{ textAlign:'center', fontSize:'21px', fontWeight:'bold', margin:'0 0 22px', outline:'none' }}>{title}</h1>}

              {/* passage */}
              {passage && (
                <p className="passage-text" {...ed} style={{ fontSize:'14px', lineHeight:1.85, textAlign:'justify', margin:'0 0 26px', outline:'none', whiteSpace:'pre-wrap' }}>{passage}</p>
              )}

              {/* PART 1 */}
              {(tf || comp) && (
                <div className={pbCls(tf || comp)}>
                  {partHead(p1, 'Comprehension Activities')}
                  {tf && (<>
                    <Tools kind="tf" id={tf.id} onRegen={genTF} />
                    {subHead('A. True or False?')}{instr(INSTR.tf)}{renderTF(tf)}
                  </>)}
                  {comp && (<>
                    <Tools kind="comprehension" id={comp.id} onRegen={genComp} />
                    {subHead('B. Comprehension Questions')}{instr(INSTR.comp)}{renderComp(comp)}
                  </>)}
                </div>
              )}

              {/* PART 2 */}
              {vocab && (
                <div className={pbCls(vocab)}>
                  {partHead(p2, 'Vocabulary Activities')}
                  <Tools kind="vocab" id={vocab.id} onRegen={genVocab} extra={
                    <>
                      <button onClick={() => reshuffleMatching(vocab.id)} disabled={!!busy} title="Shuffle matching columns" style={{ ...btn, padding:'4px 8px' }}><IconShuffle /> 2B</button>
                      <button onClick={() => reshuffleBank(vocab.id)} disabled={!!busy} title="Shuffle word bank" style={{ ...btn, padding:'4px 8px' }}><IconShuffle /> 2C</button>
                    </>
                  } />
                  {subHead('A. Vocabulary Hunt')}{instr(huntInstr)}{renderHunt(vocab.vp)}
                  {subHead('B. Matching Activity')}{instr(INSTR.matching)}{renderMatching(vocab)}
                  {subHead('C. Fill in the Gaps')}{instr(INSTR.gaps)}{renderGaps(vocab)}
                </div>
              )}

              {/* PART 3 */}
              {disc && (
                <div className={pbCls(disc)}>
                  {partHead(p3, 'Critical Thinking & Discussion')}
                  <Tools kind="discussion" id={disc.id} onRegen={genDisc} />
                  {instr(INSTR.discussion)}{renderDisc(disc)}
                </div>
              )}

              {/* PART 4 */}
              {gram && (
                <div className={pbCls(gram)}>
                  {partHead(p4, 'Grammar Noticing')}
                  <Tools kind="grammar" id={gram.id} onRegen={genGrammar} />
                  {renderGrammar(gram)}
                </div>
              )}

              {/* QUICK VOCABULARY (standalone, no passage) */}
              {qVocab && (
                <div className={pbCls(qVocab)}>
                  {partHead(0, 'Vocabulary')}
                  <Tools kind="quickVocab" id={qVocab.id} onRegen={genQuickVocab} extra={
                    <>
                      <button onClick={() => reshuffleQMatching(qVocab.id)} disabled={!!busy} title="Shuffle matching columns" style={{ ...btn, padding:'4px 8px' }}><IconShuffle /> B</button>
                      <button onClick={() => reshuffleQBank(qVocab.id)} disabled={!!busy} title="Shuffle word bank" style={{ ...btn, padding:'4px 8px' }}><IconShuffle /> C</button>
                    </>
                  } />
                  {subHead('A. Word Bank')}{instr(INSTR.glossary)}{renderGlossary(qVocab)}
                  {subHead('B. Matching')}{instr(INSTR.qMatching)}{renderQMatching(qVocab)}
                  {subHead('C. Fill in the Gaps')}{instr(INSTR.qGaps)}{renderQGaps(qVocab)}
                </div>
              )}

              {/* QUICK GRAMMAR (standalone, no passage) */}
              {qGram && (
                <div className={pbCls(qGram)}>
                  {partHead(0, 'Grammar Practice')}
                  <Tools kind="quickGrammar" id={qGram.id} onRegen={genQuickGrammar} />
                  {renderQuickGrammar(qGram)}
                </div>
              )}

              {renderAnswerKey()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};