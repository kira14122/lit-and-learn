// src/components/ProgressReport.tsx
// ─────────────────────────────────────────────────────────────────────────────
// End-of-term paper progress report for one student.
//
// Front page: the four tests with their %, a per-skill mini-bar, and a brief
//   editable note in front of each test. Notes appear INSTANTLY (deterministic,
//   marks-only) so navigating students is snappy.
// Back page: the teacher's report box. Held until you pick traits and press
//   Generate — then generateProgressReport() (Gemini → Groq) writes a unique,
//   non-repetitive report AND upgrades the front-page notes to their AI versions
//   (any note you've hand-edited is preserved).
//
// Reads marks the same way GradingPortal.termSummary does (the score JSON:
// { weight, maxPoints, listening, grammar, reading, writing, speaking,
//   totalPoints, earnedWeight, isAbsent, notApplicable }). No new grading logic.
//
// Saves to public.progress_reports (upsert on student_id,term). RLS keys off the
// admin sign-in email, so no author check is needed here.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { getSupabaseClient } from '../supabaseClient';
import { generateProgressReport } from '../aiGenerator';
import type { ProgressReportInput } from '../aiGenerator';
import { C, S as SP, R, T, NUM, btn } from './portalTokens';
import { buildReport, PASS_MARK, STRUCTURE_COUNT } from './reportEngine';
import { refineReport } from './reportRefine';
import type { Pronoun } from './reportEngine';
import { IconChevronLeft, IconSparkle, IconRefresh, IconFile, IconSave, IconTrendUp, IconTrendDown } from './portalIcons';

type Trend = 'up' | 'down' | 'flat';
type TestStatus = 'graded' | 'absent' | 'na' | 'pending';

interface ProgressReportProps {
  student: any;                          // profiles row
  grades: any[];                         // studentHistory (student_grades rows)
  onClose: () => void;
  showToast: (t: string, ty: 'success' | 'error') => void;
  getToken: (opts?: any) => Promise<string | null>;
}

const SKILLS = [
  { key: 'listening', label: 'Listening' },
  { key: 'grammar',   label: 'Grammar & Vocab' },
  { key: 'reading',   label: 'Reading' },
  { key: 'writing',   label: 'Writing' },
  { key: 'speaking',  label: 'Speaking' },
] as const;

const CANON = ['First Test', 'Midterm', 'Third Test', 'Final Test'] as const;
const DEFAULT_WEIGHT: Record<string, number> = { 'First Test': 10, 'Midterm': 30, 'Third Test': 10, 'Final Test': 50 };
const PASS_THRESHOLD = 70;

// Colour marks the exception. At or above the pass line a mark is simply ink —
// a report where every figure is coloured teaches the reader to ignore colour.
// The percentage is always printed, so the signal survives a black-and-white printer.
// Three bands, said in colour: at or above the pass line, near it, below it.
// Deliberately saturated — this page is printed and read at arm's length, and
// a near-black bar for a good mark reads as "no information" rather than "good".
// Bars are large areas, so they can carry the saturated colour. The small
// percentage figures beside them cannot: bright orange on white is 2.6:1, well
// under the readable threshold, so the text uses a darker shade of the same
// hue. Same three bands, two weights of the same colour.
const BAR = { good: '#16A34A', mid: '#EA8C00', low: '#DC2626' };
const TXT = { good: '#15803D', mid: '#A85B00', low: '#C81E1E' };
const band = (p: number): 'good' | 'mid' | 'low' =>
  p >= PASS_THRESHOLD ? 'good' : p >= 55 ? 'mid' : 'low';
const pctColor  = (p: number) => TXT[band(p)];
const barColor  = (p: number) => BAR[band(p)];
const listWords = (a: string[]) => {
  const x = a.filter(Boolean);
  if (x.length <= 1) return x[0] || '';
  return x.slice(0, -1).join(', ') + ' and ' + x[x.length - 1];
};
const pick = <T,>(arr: T[], seed: number) => arr[((seed % arr.length) + arr.length) % arr.length];

interface SkillPct { key: string; label: string; raw: number; pct: number }
interface AnalyzedTest {
  name: string; weight: number; status: TestStatus;
  maxPoints?: number; per?: number; skills?: SkillPct[];
  totalPoints?: number; mastery?: number; earnedWeight?: number;
}

// Parse the four canonical tests from the grade records (mirrors termSummary).
function analyzeTests(grades: any[]): AnalyzedTest[] {
  return CANON.map((name) => {
    const rec = grades.find((h: any) => h.assessment_name === name);
    if (!rec) return { name, status: 'pending', weight: DEFAULT_WEIGHT[name] };
    let p: any = {};
    try { p = JSON.parse(rec.score) || {}; } catch { /* old plain-text record */ }
    const weight = Number(p.weight) || DEFAULT_WEIGHT[name];
    if (p.notApplicable) return { name, status: 'na', weight };
    const maxPoints = Number(p.maxPoints) || 0;
    if (p.isAbsent) return { name, status: 'absent', weight, maxPoints };
    const per = maxPoints / 5;
    const skills: SkillPct[] = SKILLS.map((sk) => {
      const raw = Number(p[sk.key]) || 0;
      return { key: sk.key, label: sk.label, raw, pct: per ? Math.round((raw / per) * 100) : 0 };
    });
    const totalPoints = p.totalPoints != null ? Number(p.totalPoints) : skills.reduce((s, x) => s + x.raw, 0);
    const mastery = maxPoints ? (totalPoints / maxPoints) * 100 : 0;
    const earnedWeight = p.earnedWeight != null ? Number(p.earnedWeight) : (maxPoints ? (totalPoints / maxPoints) * weight : 0);
    return { name, status: 'graded', weight, maxPoints, per, skills, totalPoints, mastery, earnedWeight };
  });
}

// Instant, deterministic note for one test. STRUCTURE the teacher asked for:
// overall performance first, then the strength(s), then the area to build on.
// No raw percentage (it's printed beside the note); wording is varied by seed so
// notes don't read word-for-word alike, and the ↻ button re-rolls a single note.
// These deterministic notes are what print and save — the AI writes only the
// back-page report, so the note structure never drifts.
function detNote(t: AnalyzedTest, seed: number): string {
  if (t.status === 'na') return '';
  if (t.status === 'pending') return 'Not yet taken.';
  if (t.status === 'absent') return 'Absent — no marks recorded.';
  const m = Math.round(t.mastery || 0);
  const sk = [...(t.skills || [])].sort((a, b) => b.pct - a.pct);
  const first = (l?: string) => (l || '').split(' ')[0].toLowerCase();
  const s1 = first(sk[0]?.label);
  const s2 = first(sk[1]?.label);
  const w1 = first(sk[sk.length - 1]?.label);
  const p0 = sk[0]?.pct || 0;
  const p1 = sk[1]?.pct || 0;
  const gap = p0 - (sk[sk.length - 1]?.pct || 0);

  // 1) OVERALL performance — qualitative, no number
  const overall = pick(
    m >= 90 ? ['An outstanding test overall', 'Exceptional work here', 'A superb result overall'] :
    m >= 80 ? ['A strong test overall', 'A very good showing', 'Performed really well here'] :
    m >= 70 ? ['A solid test overall', 'A good, steady result', 'Did well overall'] :
    m >= 60 ? ['A fair result overall', 'A mixed showing', 'A middling test'] :
    m >= 50 ? ['A challenging test', 'Found this one tough', 'A hard test overall'] :
              ['A difficult test', 'A tough result overall', 'Struggled here'],
    seed,
  );

  // Balanced profile: overall, then note the evenness — no forced weakness.
  if (gap < 10) {
    return `${overall}, ` + pick([
      'with even, consistent work across the skills.',
      'strong right across the board.',
      'with no real weak spots to flag.',
    ], seed + 1);
  }

  // 2) STRENGTH(S) — one, or two when the top pair are close and both high
  const twoStrong = !!sk[1] && (p0 - p1) <= 6 && p1 >= 75;
  const strength = twoStrong
    ? pick([`${s1} and ${s2} the clear strengths`, `led by ${s1} and ${s2}`, `strongest in ${s1} and ${s2}`], seed + 2)
    : pick([`${s1} the clear strength`, `with ${s1} the standout`, `strongest in ${s1}`, `${s1} particularly good`], seed + 2);

  // 3) WEAKNESS — the area to build on
  const weakness = pick([
    `${w1} the area to build on`,
    `${w1} needs the most work`,
    `${w1} is where to focus next`,
    `with ${w1} still to lift`,
    `${w1} trailing the rest`,
  ], seed + 3);

  const join = pick([`, ${strength}; `, `, ${strength}, while `, ` \u2014 ${strength}, though `], seed + 4);
  return `${overall}${join}${weakness}.`;
}

const currentAcademicTerm = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const start = now.getMonth() >= 7 ? y : y - 1; // academic year rolls in August
  return `${start}–${start + 1} · Term 1`;
};

const ALL_TRAITS = [
  'hardworking', 'punctual', 'serious', 'brilliant', 'motivated',
  'participative', 'attentive', 'curious', 'disciplined', 'respectful',
  'enthusiastic', 'exceptional',
];

export const ProgressReport: React.FC<ProgressReportProps> = ({ student, grades, onClose, showToast, getToken }) => {
  const { user } = useUser();

  const tests = useMemo(() => analyzeTests(grades), [grades]);
  const graded = useMemo(() => tests.filter((t) => t.status === 'graded'), [tests]);

  const profile = useMemo(() => {
    return SKILLS.map((sk) => {
      const pcts = graded.map((t) => t.skills!.find((s) => s.key === sk.key)!.pct);
      const avg = pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0;
      const delta = pcts.length >= 2 ? pcts[pcts.length - 1] - pcts[0] : 0;
      const trend: Trend = delta >= 8 ? 'up' : delta <= -8 ? 'down' : 'flat';
      return { key: sk.key, label: sk.label, avg, trend };
    });
  }, [graded]);

  const autoStrengths = useMemo(
    () => [...profile].filter((s) => s.avg >= 80).sort((a, b) => b.avg - a.avg).slice(0, 3).map((s) => s.label),
    [profile]
  );
  const weakSkill = useMemo(() => {
    if (!graded.length) return null;
    return [...profile].sort((a, b) => a.avg - b.avg)[0];
  }, [profile, graded.length]);

  const standing = useMemo(() => {
    const taken = tests.filter((t) => t.status === 'graded' || t.status === 'absent');
    const assessed = taken.reduce((s, t) => s + (t.weight || 0), 0);
    const earned = taken.reduce((s, t) => s + (t.earnedWeight || 0), 0);
    return assessed > 0 ? (earned / assessed) * 100 : null;
  }, [tests]);

  // ── state ──────────────────────────────────────────────────────────────────
  const [term, setTerm] = useState(currentAcademicTerm());
  const [traits, setTraits] = useState<string[]>([]);
  const [includeProgression, setIncludeProgression] = useState(false);
  const [notes, setNotes] = useState<string[]>(() => tests.map((t, i) => detNote(t, i + 1)));
  const [reportText, setReportText] = useState('');
  const [noteSeed, setNoteSeed] = useState(1);

  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadedExisting, setLoadedExisting] = useState(false);

  // ── Report inputs the marks cannot supply ────────────────────────────────
  // Pronoun is stored on the profile so it is set once per student. Attendance
  // is a tick for now: the attendance module keeps its own roster, and only 25
  // of 68 students match by name, so reading it automatically would silently
  // miss the rest.
  const [pronoun, setPronoun] = useState<Pronoun | null>(
    (student?.pronoun as Pronoun) || null
  );
  const [attendanceConcern, setAttendanceConcern] = useState(false);
  // Each press of the button moves to the next sentence structure, so a report
  // you do not like can simply be written again rather than edited by hand.
  const [variant, setVariant] = useState(0);
  const [refining, setRefining] = useState(false);
  // Which version is on screen, so it is never ambiguous whether a model has
  // touched the wording.
  const [source, setSource] = useState<'none' | 'engine' | 'ai'>('none');

  // Gathers exactly what the engine needs, in one place, so the plain and the
  // refined paths can never be built from different facts.
  const reportInput = () => {
    const skillPct: any = {};
    profile.forEach((sk: any) => { skillPct[sk.key] = sk.avg; });
    return {
      studentName: student.full_name,
      pronoun: pronoun!,
      traits,
      skillPct,
      standing: passStanding,
      missedAllTests,
      attendanceConcern,
      effortClause,
      variant,
    };
  };

  const refine = async () => {
    if (!pronoun) { showToast('Set the pronoun first.', 'error'); return; }
    setRefining(true);
    try {
      const input = reportInput();
      const plan = buildReport(input);
      const out = await refineReport(input, plan);
      setReportText(out.text);
      setSource(out.usedAI ? 'ai' : 'engine');
      showToast(
        out.usedAI ? 'Reworded' : `Kept the plain version — ${out.reason}`,
        out.usedAI ? 'success' : 'error'
      );
    } finally { setRefining(false); }
  };
  const [effortClause, setEffortClause] = useState(true);

  const savePronoun = async (v: Pronoun) => {
    setPronoun(v);
    try {
      const supabase = getSupabaseClient((await getToken({ template: 'supabase' })) || '');
      await supabase.from('profiles').update({ pronoun: v }).eq('id', student.id);
    } catch { showToast('Pronoun set for this report, but could not be saved.', 'error'); }
  };

  // The pass verdict runs over the WHOLE term: a test never sat scores zero and
  // still occupies its weight. Deliberately different from `standing` above,
  // which divides by the tests taken and answers "grade so far".
  const passStanding = useMemo(() => {
    const counted = tests.filter((t: any) => t.status !== 'na');
    const denom = counted.reduce((sum: number, t: any) => sum + (t.weight || 0), 0);
    const earned = counted.reduce((sum: number, t: any) => sum + (t.earnedWeight || 0), 0);
    return denom > 0 ? (earned / denom) * 100 : 0;
  }, [tests]);

  const missedAllTests = useMemo(
    () => tests.length > 0 && tests.every((t: any) => t.status === 'pending' || t.status === 'absent'),
    [tests]
  );

  const writeReport = (nextShape = false) => {
    if (!pronoun) { showToast('Set the pronoun first.', 'error'); return; }
    const v = nextShape ? variant + 1 : variant;
    if (nextShape) setVariant(v);
    const out = buildReport({ ...reportInput(), variant: v });
    setReportText(out.text);
    setSource('engine');
    showToast(nextShape ? `Rewritten — ${out.structure}` : (out.passes ? 'Report written — this student passes' : 'Report written'), 'success');
  };

  // Load a previously saved report for this student (most recent), if any.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = getSupabaseClient((await getToken({ template: 'supabase' })) || '');
        const { data } = await supabase
          .from('progress_reports').select('*')
          .eq('student_id', student.id).order('updated_at', { ascending: false }).limit(1);
        if (cancelled || !data || !data[0]) return;
        const r = data[0];
        setTerm(r.term || currentAcademicTerm());
        setTraits(Array.isArray(r.traits) ? r.traits : []);
        setIncludeProgression(!!r.include_progression);
        const savedNotes: { name: string; note: string }[] = Array.isArray(r.test_notes) ? r.test_notes : [];
        setNotes(tests.map((t) => savedNotes.find((n) => n.name === t.name)?.note ?? detNote(t, 1)));
        setReportText(Array.isArray(r.report_paragraphs) ? r.report_paragraphs.join('\n\n') : '');
        setLoadedExisting(true);
      } catch { /* no saved report yet — keep deterministic defaults */ }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student.id]);

  // ── actions ──────────────────────────────────────────────────────────────────
  const toggleTrait = (t: string) =>
    setTraits((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const setNoteAt = (i: number, val: string) => {
    setNotes((prev) => prev.map((n, j) => (j === i ? val : n)));
  };
  const regenNote = (i: number) => {
    const s = noteSeed + 1 + i;
    setNoteSeed(s);
    setNotes((prev) => prev.map((n, j) => (j === i ? detNote(tests[i], s) : n)));
  };

  const buildInput = (): ProgressReportInput => ({
    studentName: student.full_name || 'Student',
    level: student.course_level || '',
    tests: tests.map((t) => ({
      name: t.name,
      weight: t.weight,
      status: t.status,
      mastery: t.status === 'graded' ? Math.round(t.mastery || 0) : undefined,
      skills: t.status === 'graded' ? t.skills!.map((s) => ({ label: s.label, pct: s.pct })) : undefined,
    })),
    profile: profile.map((s) => ({ label: s.label, avg: s.avg, trend: s.trend })),
    traits,
    strengths: autoStrengths,
    focusSkill: weakSkill ? { label: weakSkill.label, trend: weakSkill.trend } : null,
    includeProgression,
    meetsRequirements: standing != null ? standing >= PASS_THRESHOLD : undefined,
  });

  const handleGenerate = async () => {
    if (!graded.length) { showToast('No graded tests yet — nothing to report on.', 'error'); return; }
    setGenerating(true);
    try {
      const out = await generateProgressReport(buildInput());
      setReportText(out.reportParagraphs.join('\n\n'));
      // Notes stay deterministic (fixed overall → strength → weakness structure);
      // the model only writes the back-page report, so notes never drift.
    } catch (e) {
      console.error('generateProgressReport failed:', e);
      showToast('Could not generate the report. Please try again.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!reportText.trim()) { showToast('Write or generate the report before saving.', 'error'); return; }
    if (!term.trim()) { showToast('Add a term label before saving.', 'error'); return; }
    setSaving(true);
    try {
      const supabase = getSupabaseClient((await getToken({ template: 'supabase' })) || '');
      const { error } = await supabase.from('progress_reports').upsert({
        student_id: student.id,
        student_name: student.full_name,
        student_email: student.email,
        level: student.course_level,
        class_time: student.class_time,
        term: term.trim(),
        test_notes: tests.map((t, i) => ({ name: t.name, note: notes[i] || '' })),
        report_paragraphs: reportText.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean),
        traits,
        strengths: autoStrengths,
        focus_skill: weakSkill?.label ?? null,
        include_progression: includeProgression,
        results_snapshot: { tests, profile, standing },
        standing: standing != null ? Number(standing.toFixed(2)) : null,
        author_email: user?.primaryEmailAddress?.emailAddress ?? null,
      }, { onConflict: 'student_id,term' });
      if (error) throw error;
      showToast('Progress report saved.', 'success');
    } catch (e: any) {
      console.error('save progress report failed:', e);
      showToast(e?.message ? `Save failed: ${e.message}` : 'Save failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Printing a node that lives inside a fixed, scrolling overlay cannot be made
  // to work with CSS alone. Two rules fight each other: leaving the report in
  // normal flow makes the browser repeat the fixed overlay on every sheet, and
  // taking it out of flow with position:absolute makes the browser IGNORE every
  // page-break rule inside it, slicing the content wherever the page edge lands.
  //
  // So the report is copied into a plain container attached straight to <body>
  // for the duration of the print. There it is ordinary flowing content with
  // nothing around it, page-break rules work normally, and the copy is thrown
  // away afterwards. Nothing on screen changes.
  const handlePrint = () => {
    const source = document.querySelector('.pr-print-area');
    if (!source) { window.print(); return; }

    const holder = document.createElement('div');
    holder.id = 'pr-print-root';
    holder.innerHTML = (source as HTMLElement).innerHTML;
    document.body.appendChild(holder);
    document.body.classList.add('pr-printing');

    const cleanup = () => {
      document.body.classList.remove('pr-printing');
      holder.remove();
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);

    window.print();
    // Safari does not always fire afterprint; this is the backstop.
    setTimeout(() => { if (document.getElementById('pr-print-root')) cleanup(); }, 1500);
  };
  // ── render ───────────────────────────────────────────────────────────────────
  // Two surfaces, two rulebooks.
  //
  // The chrome (toolbar, controls column) is portal UI and uses portalTokens.
  // The two pages inside .pr-print-area are a *document*: it goes home in a bag,
  // gets read by a parent, and gets filed. So it is typeset rather than styled —
  // rules and space instead of filled panels, and it has to survive a black-and-
  // white printer, which is why every signal that used to be carried by colour
  // is now also carried by a number or a rule.

  return (
    <div style={PR.overlay} className="pr-overlay">
      <style>{PR_CSS}</style>

      <div style={PR.shell}>
        {/* toolbar (not printed) */}
        <div style={PR.toolbar} className="pr-no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: SP.md }}>
            <button onClick={onClose} style={btn('default')}><IconChevronLeft /> Back</button>
            <span style={T.title}>Progress report</span>
            {loadedExisting && <span style={PR.savedTag}>Editing saved report</span>}
          </div>
          <div style={{ display: 'flex', gap: SP.sm }}>
            <button onClick={handlePrint} style={btn('default')}><IconFile /> Export PDF</button>
            <button onClick={handleSave} disabled={saving} style={btn('primary', saving ? { opacity: 0.6, cursor: 'wait' } : undefined)}>
              <IconSave /> {saving ? 'Saving…' : 'Save to portal'}
            </button>
          </div>
        </div>

        <div style={PR.body}>
          {/* ── controls column ── */}
          <div style={PR.controls} className="pr-no-print">

            <div style={PR.card}>
              <div style={{ ...T.micro, marginBottom: SP.xs }}>Writing report for</div>
              <div style={T.display}>{student.full_name}</div>
              <div style={{ ...T.meta, color: C.ink3, marginTop: SP.xs }}>
                {student.course_level}{student.class_time ? ` · ${student.class_time}` : ''}
              </div>
              <div style={{ ...PR.standingRow, borderBottom: `1px solid ${C.lineSoft}`, paddingBottom: SP.md, marginBottom: SP.md }}>
                <div>
                  <span style={{ ...T.micro, marginBottom: 0 }}>Verdict</span>
                  <div style={{ ...T.meta, ...NUM, color: C.ink3 }}>{Math.round(passStanding)}% of the whole term</div>
                </div>
                <span style={{ ...T.title, color: passStanding >= PASS_MARK ? C.good : C.bad }}>
                  {passStanding >= PASS_MARK ? 'Passes' : 'Does not pass'}
                </span>
              </div>
              <div style={PR.standingRow}>
                <span style={{ ...T.micro, marginBottom: 0 }}>Grade so far</span>
                <span style={{ ...T.displayLg, ...NUM, color: C.accent }}>
                  {standing != null ? `${Math.round(standing)}%` : '—'}
                </span>
              </div>
            </div>

            <div style={PR.card}>
              <label style={PR.lbl}>Term</label>
              <input value={term} onChange={(e) => setTerm(e.target.value)} style={PR.input} placeholder="2025–2026 · Term 2" />
              <p style={PR.hint}>Saving the same term again updates this report.</p>
            </div>

            <div style={PR.card}>
              <div style={PR.lbl}>Pronoun</div>
              <div style={{ display: 'flex', gap: SP.sm, marginBottom: SP.md }}>
                {(['she','he','they'] as Pronoun[]).map(v => (
                  <button key={v} onClick={() => savePronoun(v)}
                    style={{ ...PR.chip, ...(pronoun === v ? PR.chipOn : {}) }}>{v}</button>
                ))}
              </div>
              {!pronoun && <p style={{ ...PR.hint, color: C.warn, marginTop: 0 }}>Set this before writing the report — it is saved to the student's profile.</p>}

              <label className="pr-chip" style={{ display: 'flex', gap: SP.md, alignItems: 'flex-start', cursor: 'pointer', marginTop: SP.md, border: 'none', background: 'transparent', padding: 0 }}>
                <input type="checkbox" checked={attendanceConcern} onChange={e => setAttendanceConcern(e.target.checked)} style={{ width: 17, height: 17, marginTop: 2, accentColor: C.accent }} />
                <span style={{ ...T.meta, color: C.ink2 }}>Attendance needs improving</span>
              </label>
              <label className="pr-chip" style={{ display: 'flex', gap: SP.md, alignItems: 'flex-start', cursor: 'pointer', marginTop: SP.sm, border: 'none', background: 'transparent', padding: 0 }}>
                <input type="checkbox" checked={effortClause} onChange={e => setEffortClause(e.target.checked)} style={{ width: 17, height: 17, marginTop: 2, accentColor: C.accent }} />
                <span style={{ ...T.meta, color: C.ink2 }}>Include a line about effort and attitude</span>
              </label>
            </div>

            <div style={PR.card}>
              <div style={PR.lbl}>Describe the student</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: SP.sm }}>
                {ALL_TRAITS.map((t) => {
                  const on = traits.includes(t);
                  return (
                    <button key={t} onClick={() => toggleTrait(t)} className="pr-chip"
                      style={{ ...PR.chip, ...(on ? PR.chipOn : {}) }}>{t}</button>
                  );
                })}
              </div>
              <p style={PR.hint}>You pick the traits; strengths and the focus area come from the results.</p>
            </div>

            <div style={PR.card}>
              <div style={PR.lbl}>Read from results</div>
              <div style={PR.readRow}>
                <span style={{ color: C.ink3 }}>Strengths</span>
                <span style={{ color: C.ink, fontWeight: 500 }}>{listWords(autoStrengths) || '—'}</span>
              </div>
              <div style={PR.readRow}>
                <span style={{ color: C.ink3 }}>Focus area</span>
                <span style={{ color: C.warn, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: SP.xs }}>
                  {weakSkill ? weakSkill.label : '—'}
                  {weakSkill?.trend === 'up' && <><IconTrendUp size={13} /> improving</>}
                  {weakSkill?.trend === 'down' && <><IconTrendDown size={13} /> slipping</>}
                </span>
              </div>
            </div>

            <div style={PR.card}>
              <label style={{ display: 'flex', gap: SP.md, alignItems: 'flex-start', cursor: 'pointer' }}>
                <span onClick={() => setIncludeProgression((v) => !v)}
                  style={{ ...PR.toggle, background: includeProgression ? C.accent : C.line }}>
                  <span style={{ ...PR.knob, left: includeProgression ? 18 : 2 }} />
                </span>
                <span style={{ ...T.meta, color: C.ink3 }}>
                  Include a progression line. Off by default — movement is time-based (8 months), not results.
                </span>
              </label>
            </div>

            <button onClick={() => writeReport(false)} disabled={!pronoun}
              style={btn('primary', { width: '100%', padding: '13px', fontSize: '15px', ...(!pronoun ? { opacity: 0.5, cursor: 'not-allowed' } : null) })}>
              Write the report
            </button>
            <button onClick={() => writeReport(true)} disabled={!pronoun || !reportText}
              style={btn('default', { width: '100%', marginTop: SP.sm, ...(!pronoun || !reportText ? { opacity: 0.5, cursor: 'not-allowed' } : null) })}>
              Try a different wording
            </button>
            <button onClick={refine} disabled={!pronoun || refining}
              style={btn('default', { width: '100%', marginTop: SP.sm, ...(!pronoun || refining ? { opacity: 0.5, cursor: 'wait' } : null) })}>
              {refining ? 'Rewording…' : 'Reword with AI'}
            </button>
            <p style={{ ...PR.hint, textAlign: 'center', marginTop: SP.sm }}>
              {STRUCTURE_COUNT} sentence structures. The AI only rewords — the marks, the skills and the
              verdict are checked afterwards, and a bad rewrite is discarded.
              {source === 'ai' && <><br/><span style={{ color: C.accent }}>Showing the AI wording.</span></>}
              {source === 'engine' && <><br/>Showing the plain wording.</>}
            </p>

            <button onClick={handleGenerate} disabled={generating}
              style={btn('primary', { width: '100%', padding: '13px', fontSize: '15px', ...(generating ? { opacity: 0.6, cursor: 'wait' } : null) })}>
              <IconSparkle /> {generating ? 'Writing…' : reportText ? 'Re-generate report' : 'Generate report'}
            </button>
            <p style={{ ...PR.hint, textAlign: 'center', marginTop: 0 }}>Unique per student · you edit freely afterwards</p>
          </div>

          {/* ── the paper (printed) ── */}
          <div style={PR.paperCol}>
            <div className="pr-print-area">

              {/* FRONT PAGE */}
              <div style={PR.page}>
                <div style={PR.masthead}>
                  <div>
                    <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 18, color: C.ink }}>
                      Lit <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontStyle: 'italic', color: C.accent }}>&amp;</span> Learn
                    </div>
                    <div style={{ ...T.micro, marginTop: 2 }}>Term progress report</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 18, color: C.ink }}>{student.full_name}</div>
                    <div style={{ ...T.micro, textTransform: 'none', letterSpacing: 0, marginTop: 2 }}>
                      {student.course_level}{student.class_time ? ` · ${student.class_time}` : ''} · {term}
                    </div>
                  </div>
                </div>

                <div style={PR.pagePad}>
                  <div style={PR.sectionLabel}>Test results and remarks</div>

                  <div>
                    {tests.map((t, i) => {
                      const m = t.status === 'graded' ? Math.round(t.mastery || 0) : null;
                      const statusText = t.status === 'absent' ? 'Absent' : t.status === 'na' ? 'N/A' : t.status === 'pending' ? 'Not taken' : null;
                      return (
                        <div key={t.name} style={PR.testRow} className="pr-test-row">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: SP.md, marginBottom: SP.sm }}>
                            <div style={{ display: 'flex', gap: SP.sm, alignItems: 'baseline' }}>
                              <span style={{ fontSize: 15, fontWeight: 500, color: C.ink }}>{t.name}</span>
                              <span style={{ ...NUM, fontSize: 11, color: C.ink3 }}>
                                {t.weight}%{t.maxPoints ? ` · out of ${t.maxPoints}` : ''}
                              </span>
                            </div>
                            {m != null ? (
                              <div style={{ display: 'flex', gap: SP.md, alignItems: 'baseline' }}>
                                <span style={{ ...NUM, fontSize: 18, fontWeight: 600, color: pctColor(m) }}>{m}%</span>
                                <span style={{ ...NUM, fontSize: 11, color: C.ink3 }}>earns {(t.earnedWeight || 0).toFixed(1)}/{t.weight}</span>
                              </div>
                            ) : (
                              <span style={{ fontSize: 11, fontWeight: 500, color: C.ink3, textTransform: 'uppercase', letterSpacing: '0.09em' }}>{statusText}</span>
                            )}
                          </div>

                          {t.status === 'graded' && (
                            <div style={{ display: 'flex', gap: SP.sm, marginBottom: SP.md }}>
                              {t.skills!.map((s) => (
                                <div key={s.key} style={{ flex: 1, minWidth: 0 }} title={`${s.label}: ${s.pct}%`}>
                                  <div style={PR.barTrack}>
                                    <div style={{ ...PR.barFill, width: `${s.pct}%`, background: barColor(s.pct) }} />
                                  </div>
                                  <div style={PR.barLabel}>
                                    <span>{s.label.split(' ')[0]}</span>
                                    <span style={{ ...NUM, color: pctColor(s.pct), fontWeight: 600 }}>{s.pct}%</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {t.status !== 'na' && (
                            <div style={{ display: 'flex', gap: SP.xs, alignItems: 'center' }}>
                              <input value={notes[i]} onChange={(e) => setNoteAt(i, e.target.value)}
                                placeholder="Brief note for this test…" style={PR.noteInput} className="pr-note-input pr-screen-only" />
                              {/* An input prints only the sliver you can see, and brings its
                                  scrollbar with it. On paper the same text is a plain block. */}
                              <div className="pr-print-only" style={{ ...PR.noteInput, background: 'transparent', border: 'none', padding: '2px 0', whiteSpace: 'pre-wrap' }}>{notes[i]}</div>
                              <button onClick={() => regenNote(i)} title="Draft from this test's result"
                                aria-label="Draft this note from the result"
                                style={PR.noteRegen} className="pr-no-print"><IconRefresh size={14} /></button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* BACK PAGE */}
              <div style={{ ...PR.page, marginTop: 20 }} className="pr-page-break">
                <div style={{ ...PR.pagePad, paddingBottom: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: SP.md }}>
                  <div style={{ ...PR.sectionLabel, marginBottom: 0 }}>Teacher's report</div>
                  <div style={{ ...T.micro, textTransform: 'none', letterSpacing: 0 }}>{student.full_name} · {term}</div>
                </div>
                <div style={{ ...PR.pagePad, paddingTop: SP.lg }}>
                  <textarea
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                    placeholder="Pick the traits on the left and press Generate — the report appears here in three movements (who the student is and their strengths, the one area to focus on, and optionally a progression line). Edit freely."
                    style={PR.reportBox}
                    className="pr-report-box pr-screen-only"
                  />
                  <div className="pr-print-only" style={{ ...PR.reportBox, background: 'transparent', border: 'none', minHeight: 0, padding: 0, whiteSpace: 'pre-wrap' }}>{reportText}</div>
                  <div style={PR.signature} className="pr-signature">
                    <div style={{ ...T.micro, marginBottom: SP.sm }}>Instructor</div>
                    <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 15, color: C.ink }}>Dr. Chouit Abderraouf</div>
                    <div style={{ ...T.micro, textTransform: 'none', letterSpacing: 0, marginTop: 2 }}>Lit &amp; Learn · litnlearn.com</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── styles ────────────────────────────────────────────────────────────────────
// Screen chrome resolves through portalTokens. The two `page` surfaces and
// everything inside them are document typography and use point-friendly sizes,
// because they are measured on paper rather than on a display.
const PR: Record<string, React.CSSProperties> = {
  overlay:   { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 60, overflowY: 'auto', padding: `${SP.xl} ${SP.lg}` },
  shell:     { maxWidth: 1180, margin: '0 auto', background: C.canvas, borderRadius: R.card, overflow: 'hidden', boxShadow: '0 24px 64px -16px rgba(15,23,42,0.45)' },
  toolbar:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: SP.md, flexWrap: 'wrap', background: C.paper, borderBottom: `1px solid ${C.line}`, padding: `${SP.md} ${SP.lg}` },
  body:      { display: 'flex', gap: SP.xl, padding: SP.xl, flexWrap: 'wrap', alignItems: 'flex-start' },
  controls:  { flex: '1 1 320px', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: SP.md },
  paperCol:  { flex: '2 1 520px', minWidth: 320 },

  card:      { background: C.paper, border: `1px solid ${C.line}`, borderRadius: R.card, padding: SP.lg, boxShadow: '0 1px 2px rgba(15,23,42,0.04)' },
  standingRow: { marginTop: SP.lg, paddingTop: SP.md, borderTop: `1px solid ${C.lineSoft}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' },

  lbl:       { display: 'block', fontSize: 11, fontWeight: 500, letterSpacing: '0.09em', textTransform: 'uppercase', color: C.ink3, marginBottom: SP.md },
  hint:      { fontSize: 11, color: C.ink3, marginTop: SP.sm, marginBottom: 0, lineHeight: 1.5 },
  input:     { width: '100%', boxSizing: 'border-box', border: `1px solid ${C.line}`, borderRadius: R.control, padding: '9px 11px', fontSize: 15, outline: 'none', color: C.ink, background: C.paper, font: 'inherit' },

  chip:      { fontSize: 13, lineHeight: 1, padding: '8px 12px', borderRadius: R.pill, border: `1px solid ${C.line}`, background: C.paper, color: C.ink2, cursor: 'pointer', font: 'inherit' },
  chipOn:    { background: C.accent, borderColor: C.accent, color: C.paper },
  readRow:   { display: 'flex', justifyContent: 'space-between', gap: SP.md, fontSize: 13, padding: '5px 0' },
  toggle:    { position: 'relative', width: 36, height: 20, borderRadius: R.pill, flexShrink: 0, marginTop: 2, transition: 'background .15s', display: 'inline-block' },
  knob:      { position: 'absolute', top: 2, width: 16, height: 16, borderRadius: R.pill, background: C.paper, transition: 'left .15s', boxShadow: '0 1px 2px rgba(15,23,42,0.2)' },
  savedTag:  { fontSize: 11, fontWeight: 500, color: C.ink2, background: C.lineSoft, borderRadius: R.pill, padding: '3px 10px' },

  // ── the document ──
  page:      { background: C.paper, borderRadius: R.card, border: `1px solid ${C.line}`, overflow: 'hidden', boxShadow: '0 1px 2px rgba(15,23,42,0.04)' },
  // A typeset masthead, not a filled banner. The old one was a full-bleed
  // gradient: on paper that is a solid block of ink across the top of every
  // report, and it is the first thing a parent sees.
  masthead:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: SP.lg, padding: `${SP.xl} ${SP.xl} ${SP.lg}`, borderBottom: `2px solid ${C.ink}` },
  pagePad:   { padding: SP.xl },
  sectionLabel: { fontSize: 11, fontWeight: 500, letterSpacing: '0.09em', textTransform: 'uppercase', color: C.ink3, marginBottom: SP.lg },

  // Rows separated by rules rather than boxed in cards — four rounded rectangles
  // stacked on a page read as a web layout printed out.
  testRow:   { padding: `${SP.lg} 0`, borderTop: `1px solid ${C.lineSoft}` },
  barTrack:  { height: 8, borderRadius: R.pill, background: '#E8ECF4', overflow: 'hidden' },
  barFill:   { height: '100%', borderRadius: R.pill },
  barLabel:  { display: 'flex', justifyContent: 'space-between', gap: SP.xs, fontSize: 11, color: C.ink3, marginTop: 5, whiteSpace: 'nowrap', overflow: 'hidden' },

  noteInput: { flex: 1, fontSize: 13, color: C.ink2, background: C.sunken, border: '1px solid transparent', borderRadius: R.control, padding: '9px 12px', outline: 'none', font: 'inherit' },
  noteRegen: { flexShrink: 0, border: 'none', background: 'transparent', color: C.ink3, cursor: 'pointer', padding: '6px 8px', display: 'inline-flex', alignItems: 'center' },

  reportBox: { width: '100%', boxSizing: 'border-box', minHeight: 260, border: `1px solid ${C.line}`, borderRadius: R.control, padding: SP.lg, fontSize: 15, lineHeight: '30px', color: C.ink, resize: 'vertical', outline: 'none', fontFamily: 'Fraunces, Georgia, serif', background: `repeating-linear-gradient(transparent, transparent 29px, ${C.lineSoft} 29px, ${C.lineSoft} 30px)` },
  signature: { marginTop: SP.xxl, paddingTop: SP.lg, borderTop: `1px solid ${C.line}` },
};

const PR_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@600&family=Fraunces:ital,opsz,wght@0,9..144,400;1,9..144,400&display=swap');
.pr-note-input:focus{ background:${C.paper} !important; border-color:${C.line} !important; box-shadow:0 0 0 3px rgba(79,70,229,0.12); }
.pr-chip:hover{ border-color:${C.ink3}; }
.pr-report-box:focus{ border-color:${C.accent}; box-shadow:0 0 0 3px rgba(79,70,229,0.12); }

.pr-print-only { display: none; }

@media print {
  /* The report is copied to #pr-print-root, a direct child of body, so hiding
     is simple and nothing is left occupying space. No visibility tricks, no
     absolute positioning — the copy is ordinary flowing content, which is the
     only way page-break rules are honoured. */
  body.pr-printing > *:not(#pr-print-root) { display: none !important; }

  #pr-print-root {
    display: block !important;
    position: static !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
    color: #000 !important;
    font-size: 10.5pt;
  }
  #pr-print-root * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* the two sheets are the paper itself */
  #pr-print-root > div {
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    margin: 0 !important;
    background: #fff !important;
  }

  /* form fields print only what is visible; the mirrors print in full */
  #pr-print-root .pr-screen-only { display: none !important; }
  #pr-print-root .pr-print-only  { display: block !important; }
  #pr-print-root .pr-no-print    { display: none !important; }

  /* a test and its remark are one thing and must not be split */
  #pr-print-root .pr-test-row { page-break-inside: avoid !important; break-inside: avoid !important; }
  #pr-print-root .pr-page-break { page-break-before: always !important; margin-top: 0 !important; }

  html, body {
    height: auto !important;
    overflow: visible !important;
    background: #fff !important;
    margin: 0 !important;
  }

  @page { size: A4; margin: 16mm 18mm; }
}
`;