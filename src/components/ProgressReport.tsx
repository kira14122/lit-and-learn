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

const pctColor = (p: number) => (p >= 80 ? '#16a34a' : p >= 60 ? '#d97706' : '#dc2626');
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
  return `${start}\u2013${start + 1} \u00B7 Term 1`;
};

const ALL_TRAITS = [
  'hardworking', 'punctual', 'serious', 'brilliant', 'motivated',
  'participative', 'attentive', 'curious', 'disciplined', 'respectful',
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

  const handlePrint = () => window.print();

  // ── render ───────────────────────────────────────────────────────────────────
  const grad = 'linear-gradient(135deg,#4f46e5,#7c3aed)';

  return (
    <div style={S.overlay} className="pr-overlay">
      <style>{PR_CSS}</style>

      <div style={S.shell}>
        {/* toolbar (not printed) */}
        <div style={S.toolbar} className="pr-no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={onClose} style={S.ghostBtn}>← Back</button>
            <span style={{ fontWeight: 800, fontSize: 16 }}>Progress Report</span>
            {loadedExisting && <span style={S.savedTag}>editing saved report</span>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handlePrint} style={S.ghostBtn}>Export PDF</button>
            <button onClick={handleSave} disabled={saving} style={{ ...S.primaryBtn, background: saving ? '#a5b4fc' : grad }}>
              {saving ? 'Saving…' : 'Save to portal'}
            </button>
          </div>
        </div>

        <div style={S.body}>
          {/* ── controls column ── */}
          <div style={S.controls} className="pr-no-print">
            <div style={{ ...S.card, background: grad, color: '#fff', border: 'none' }}>
              <div style={S.eyebrowLight}>Writing report for</div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{student.full_name}</div>
              <div style={{ color: '#e0e7ff', fontSize: 13 }}>
                {student.course_level}{student.class_time ? ` \u00B7 ${student.class_time}` : ''}
              </div>
              <div style={S.standingRow}>
                <span style={{ color: '#e0e7ff', fontSize: 13 }}>Grade so far</span>
                <span style={{ fontSize: 22, fontWeight: 800 }}>{standing != null ? `${Math.round(standing)}%` : '—'}</span>
              </div>
            </div>

            <div style={S.card}>
              <label style={S.lbl}>Term</label>
              <input value={term} onChange={(e) => setTerm(e.target.value)} style={S.input} placeholder="e.g. 2025–2026 · Term 2" />
              <p style={S.hint}>Saving the same term again updates this report.</p>
            </div>

            <div style={S.card}>
              <div style={S.lbl}>Describe the student</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {ALL_TRAITS.map((t) => {
                  const on = traits.includes(t);
                  return (
                    <button key={t} onClick={() => toggleTrait(t)}
                      style={{ ...S.chip, ...(on ? S.chipOn : {}) }}>{t}</button>
                  );
                })}
              </div>
              <p style={S.hint}>You pick the traits; strengths and the focus area come from the results.</p>
            </div>

            <div style={S.card}>
              <div style={S.lblMuted}>Read from results</div>
              <div style={S.readRow}><span style={{ color: '#64748b' }}>Strengths</span>
                <span style={{ color: '#16a34a', fontWeight: 600 }}>{listWords(autoStrengths) || '—'}</span></div>
              <div style={S.readRow}><span style={{ color: '#64748b' }}>Focus area</span>
                <span style={{ color: '#d97706', fontWeight: 600 }}>
                  {weakSkill ? `${weakSkill.label}${weakSkill.trend === 'up' ? ' \u2191 improving' : weakSkill.trend === 'down' ? ' \u2193 slipping' : ''}` : '—'}
                </span></div>
            </div>

            <div style={S.card}>
              <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}>
                <span onClick={() => setIncludeProgression((v) => !v)}
                  style={{ ...S.toggle, background: includeProgression ? '#4f46e5' : '#cbd5e1' }}>
                  <span style={{ ...S.knob, left: includeProgression ? 18 : 2 }} />
                </span>
                <span style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>
                  Include a progression line. Off by default — movement is time-based (8 months), not results.
                </span>
              </label>
            </div>

            <button onClick={handleGenerate} disabled={generating}
              style={{ ...S.primaryBtn, width: '100%', padding: '13px', background: generating ? '#a5b4fc' : grad }}>
              {generating ? '✨ Writing…' : reportText ? '✨ Re-generate report' : '✨ Generate report'}
            </button>
            <p style={{ ...S.hint, textAlign: 'center' }}>Unique per student · you edit freely afterwards</p>
          </div>

          {/* ── the paper (printed) ── */}
          <div style={S.paperCol}>
            <div className="pr-print-area">
              {/* FRONT PAGE */}
              <div style={S.page}>
                <div style={{ ...S.pageHeader, background: grad }}>
                  <div>
                    <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 17 }}>
                      Lit <span style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', color: '#c7d2fe' }}>&amp;</span> Learn
                    </div>
                    <div style={{ color: '#c7d2fe', fontSize: 10, letterSpacing: 1 }}>TERM PROGRESS REPORT</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{student.full_name}</div>
                    <div style={{ color: '#c7d2fe', fontSize: 10 }}>
                      {student.course_level}{student.class_time ? ` \u00B7 ${student.class_time}` : ''} \u00B7 {term}
                    </div>
                  </div>
                </div>

                <div style={{ padding: 26 }}>
                  <div style={S.sectionLabel}>Test results &amp; remarks</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {tests.map((t, i) => {
                      const m = t.status === 'graded' ? Math.round(t.mastery || 0) : null;
                      const statusText = t.status === 'absent' ? 'Absent' : t.status === 'na' ? 'N/A' : t.status === 'pending' ? 'Not taken' : null;
                      return (
                        <div key={t.name} style={S.testRow}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                              <span style={{ fontWeight: 700 }}>{t.name}</span>
                              <span style={{ fontSize: 11, color: '#94a3b8' }}>{t.weight}%{t.maxPoints ? ` \u00B7 out of ${t.maxPoints}` : ''}</span>
                            </div>
                            {m != null ? (
                              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                <span style={{ fontSize: 17, fontWeight: 800, color: pctColor(m) }}>{m}%</span>
                                <span style={{ fontSize: 11, color: '#94a3b8' }}>earns {(t.earnedWeight || 0).toFixed(1)}/{t.weight}</span>
                              </div>
                            ) : <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>{statusText}</span>}
                          </div>

                          {t.status === 'graded' && (
                            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                              {t.skills!.map((s) => (
                                <div key={s.key} style={{ flex: 1 }} title={`${s.label}: ${s.pct}%`}>
                                  <div style={S.barTrack}><div style={{ ...S.barFill, width: `${s.pct}%`, background: pctColor(s.pct) }} /></div>
                                  <div style={S.barLabel}>{s.label.split(' ')[0]}</div>
                                </div>
                              ))}
                            </div>
                          )}

                          {t.status !== 'na' && (
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              <input value={notes[i]} onChange={(e) => setNoteAt(i, e.target.value)}
                                placeholder="Brief note for this test…" style={S.noteInput} className="pr-note-input" />
                              <button onClick={() => regenNote(i)} title="Draft from this test's result"
                                style={S.noteRegen} className="pr-no-print">↻</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* BACK PAGE */}
              <div style={{ ...S.page, marginTop: 20 }} className="pr-page-break">
                <div style={{ padding: '22px 26px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div style={S.sectionLabel}>Teacher's report</div>
                  <div style={{ fontSize: 10, color: '#cbd5e1' }}>{student.full_name} \u00B7 {term}</div>
                </div>
                <div style={{ padding: '0 26px 26px' }}>
                  <textarea
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                    placeholder="Pick the traits on the left and press Generate — the report appears here in three movements (who the student is and their strengths, the one area to focus on, and optionally a progression line). Edit freely."
                    style={S.reportBox}
                    className="pr-report-box"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── inline styles (matches the portal's inline-style idiom) ────────────────────
const S: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,.55)', zIndex: 60, overflowY: 'auto', padding: '24px 16px' },
  shell: { maxWidth: 1180, margin: '0 auto', background: '#eef0f7', borderRadius: 18, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,.35)' },
  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '12px 18px' },
  body: { display: 'flex', gap: 20, padding: 20, flexWrap: 'wrap', alignItems: 'flex-start' },
  controls: { flex: '1 1 320px', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 14 },
  paperCol: { flex: '2 1 520px', minWidth: 320 },
  card: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,.05)' },
  eyebrowLight: { fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: '#c7d2fe', marginBottom: 4 },
  standingRow: { marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,.12)', borderRadius: 12, padding: '8px 14px' },
  lbl: { display: 'block', fontWeight: 700, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: '#4338ca', marginBottom: 8 },
  lblMuted: { fontWeight: 700, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 10 },
  hint: { fontSize: 11, color: '#94a3b8', marginTop: 8, marginBottom: 0 },
  input: { width: '100%', boxSizing: 'border-box', border: '1px solid #d1d5db', borderRadius: 9, padding: '9px 12px', fontSize: 14, outline: 'none', color: '#1e293b' },
  chip: { fontSize: 13, lineHeight: 1, padding: '8px 12px', borderRadius: 99, border: '1px solid #e2e8f0', background: '#fff', color: '#475569', cursor: 'pointer' },
  chipOn: { background: '#4f46e5', borderColor: '#4f46e5', color: '#fff' },
  readRow: { display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '3px 0' },
  toggle: { position: 'relative', width: 36, height: 20, borderRadius: 99, flexShrink: 0, marginTop: 2, transition: 'background .15s', display: 'inline-block' },
  knob: { position: 'absolute', top: 2, width: 16, height: 16, borderRadius: 99, background: '#fff', transition: 'left .15s' },
  primaryBtn: { border: 'none', color: '#fff', borderRadius: 11, padding: '9px 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  ghostBtn: { border: '1px solid #e2e8f0', background: '#fff', color: '#475569', borderRadius: 9, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  savedTag: { fontSize: 11, color: '#4338ca', background: '#e0e7ff', borderRadius: 99, padding: '3px 10px' },
  page: { background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,.06)' },
  pageHeader: { padding: '16px 26px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' },
  sectionLabel: { fontSize: 11, fontWeight: 700, letterSpacing: 1.3, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 14 },
  testRow: { border: '1px solid #e5e7eb', borderRadius: 12, padding: 14 },
  barTrack: { height: 6, borderRadius: 99, background: '#f1f5f9', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 99 },
  barLabel: { fontSize: 9, color: '#94a3b8', textAlign: 'center', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  noteInput: { flex: 1, fontSize: 13, color: '#334155', background: '#f8fafc', border: '1px solid transparent', borderRadius: 8, padding: '8px 12px', outline: 'none' },
  noteRegen: { flexShrink: 0, border: 'none', background: 'transparent', color: '#4f46e5', fontSize: 15, cursor: 'pointer', padding: '6px 8px' },
  reportBox: { width: '100%', boxSizing: 'border-box', minHeight: 240, border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 18px', fontSize: 15, lineHeight: 1.9, color: '#334155', resize: 'vertical', outline: 'none', fontFamily: 'inherit', background: 'repeating-linear-gradient(transparent,transparent 29px,#eef2f7 29px,#eef2f7 30px)' },
};

const PR_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@600&family=Fraunces:ital@1&display=swap');
.pr-note-input:focus{ background:#fff !important; border-color:#c7d2fe !important; }
.pr-chip:hover{ border-color:#c7d2fe; }
@media print {
  body * { visibility: hidden !important; }
  .pr-print-area, .pr-print-area * { visibility: visible !important; }
  .pr-print-area { position: absolute; left: 0; top: 0; width: 100%; }
  .pr-print-area * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  .pr-no-print { display: none !important; }
  .pr-page-break { page-break-before: always; }
  .pr-note-input, .pr-report-box { border: none !important; background: #fff !important; }
  .pr-report-box { resize: none !important; }
  @page { size: A4; margin: 14mm; }
}
`;

export default ProgressReport;