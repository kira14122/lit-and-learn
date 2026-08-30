import React, { useEffect, useState } from 'react';
import { SKILLS } from './feedbackEngine';
import type { SkillKey } from './feedbackEngine';

// ─────────────────────────────────────────────────────────────────────────────
// TestLessons — what this test covered, per skill.
//
// Filled in once per term + level + test, then reused for every student sitting
// it. This is the data that stops the feedback being generic: a bullet can only
// appear in a student's email if it appears here first.
//
// Saves to the test_lessons table with an upsert on
// (teacher_email, term, course_level, assessment_name, skill), so saving twice
// updates rather than duplicating.
// ─────────────────────────────────────────────────────────────────────────────

export type LessonMap = Partial<Record<SkillKey, string[]>>;

// ─── Suggestions ─────────────────────────────────────────────────────────────
// Grammar and vocabulary has discrete items you teach. The other four are
// sub-skills you train, so a blank box is the wrong prompt for them — these are
// the things that actually go wrong, phrased to drop straight into the sentence
// "please focus your review on: • ...". Click to add, then edit freely.
const SUGGESTIONS: Record<SkillKey, string[]> = {
  listening: [
    'following natural-speed audio',
    'taking notes while listening',
    'catching specific details and figures',
    'getting the main idea on the first listen',
    'following conversations with several speakers',
    'hearing linking and weak forms',
    'picking up attitude and tone',
  ],
  reading: [
    'skimming for the main idea',
    'scanning for specific information',
    'working out meaning from context',
    'reference words such as it, this and which',
    'telling fact from opinion',
    'reading longer texts under time pressure',
    'following how a text is organised',
  ],
  writing: [
    'paragraph structure and topic sentences',
    'linking words and cohesion',
    'answering the whole question',
    'punctuation and capital letters',
    'varying sentence length',
    'formal and informal register',
    'planning before you write',
    'spelling of common words',
  ],
  speaking: [
    'speaking without long pauses',
    'extending answers beyond one sentence',
    'word and sentence stress',
    'pronunciation of individual sounds',
    'using a wider range of vocabulary',
    'staying accurate when speaking quickly',
    'asking for clarification',
  ],
  grammar: [
    'the passive voice',
    'the second and third conditionals',
    'phrasal verbs',
    'compound adjectives',
    'articles',
    'past simple and present perfect',
    'prepositions',
    'word formation',
  ],
};

const K = {
  ink: '#1B1F3B', ink2: '#5A6180', ink3: '#6C7391',
  line: '#DDE2EE', soft: '#EEF0F8', paper: '#FFFFFF', sunken: '#F7F8FD',
  indigo: '#4F46E5', indigoDeep: '#4038C7', red: '#E02424',
  fd: "'Fredoka', system-ui, sans-serif",
};

const btn = (kind: 'default' | 'primary' | 'ghost' = 'default', extra?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: K.fd, fontSize: '14px', lineHeight: 1.2, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
  padding: '9px 18px', borderRadius: '999px', whiteSpace: 'nowrap',
  background: kind === 'primary' ? K.indigo : kind === 'ghost' ? 'transparent' : K.paper,
  color: kind === 'primary' ? '#fff' : K.ink2,
  border: `1.5px solid ${kind === 'primary' ? K.indigo : kind === 'ghost' ? 'transparent' : K.line}`,
  fontWeight: kind === 'primary' ? 500 : 400,
  ...extra,
});

export function TestLessons({
  open, onClose, term, courseLevel, assessmentName, teacherEmail, getSupabase, onSaved,
}: {
  open: boolean;
  onClose: () => void;
  term: string;
  courseLevel: string;
  assessmentName: string;
  teacherEmail: string;
  getSupabase: () => Promise<any>;
  onSaved: (map: LessonMap) => void;
}) {
  const [map, setMap] = useState<LessonMap>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !courseLevel) return;
    let cancelled = false;
    (async () => {
      setLoading(true); setError(null);
      try {
        const supabase = await getSupabase();
        const { data, error } = await supabase
          .from('test_lessons').select('skill,lessons')
          .eq('teacher_email', teacherEmail).eq('term', term)
          .eq('course_level', courseLevel).eq('assessment_name', assessmentName);
        if (error) throw error;
        if (cancelled) return;
        const next: LessonMap = {};
        (data || []).forEach((r: any) => { next[r.skill as SkillKey] = r.lessons || []; });
        setMap(next);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Could not load the lessons for this test.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, term, courseLevel, assessmentName, teacherEmail, getSupabase]);

  const setLesson = (skill: SkillKey, i: number, v: string) =>
    setMap(m => { const list = [...(m[skill] || [])]; list[i] = v; return { ...m, [skill]: list }; });
  const addLesson = (skill: SkillKey) =>
    setMap(m => ({ ...m, [skill]: [...(m[skill] || []), ''] }));
  const removeLesson = (skill: SkillKey, i: number) =>
    setMap(m => ({ ...m, [skill]: (m[skill] || []).filter((_, x) => x !== i) }));

  const save = async () => {
    setSaving(true); setError(null);
    try {
      const supabase = await getSupabase();
      // one row per skill; empty lines dropped so a stray blank never becomes a bullet
      const rows = SKILLS.map(s => ({
        teacher_email: teacherEmail, term, course_level: courseLevel,
        assessment_name: assessmentName, skill: s.key,
        lessons: (map[s.key] || []).map(l => l.trim()).filter(Boolean),
      }));
      const { error } = await supabase.from('test_lessons')
        .upsert(rows, { onConflict: 'teacher_email,term,course_level,assessment_name,skill' });
      if (error) throw error;
      const clean: LessonMap = {};
      rows.forEach(r => { clean[r.skill as SkillKey] = r.lessons; });
      setMap(clean);
      onSaved(clean);
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Could not save. Your lessons have not been lost — try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const total = SKILLS.reduce((n, s) => n + (map[s.key] || []).filter(l => l.trim()).length, 0);

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(27,31,59,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 60 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: K.paper, borderRadius: '18px', width: 'min(720px, 100%)', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px -16px rgba(27,31,59,0.45)' }}>

        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${K.line}` }}>
          <div style={{ fontFamily: K.fd, fontSize: '20px', fontWeight: 500, color: K.ink }}>What this test covered</div>
          <div style={{ fontSize: '14px', color: K.ink2, marginTop: '2px' }}>
            {assessmentName} · {courseLevel} · {term}
          </div>
          <div style={{ fontSize: '13px', color: K.ink3, marginTop: '8px' }}>
            Entered once for this test and reused for every student who sat it. A lesson can only
            appear in a student's feedback if it is listed here.
          </div>
        </div>

        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ color: K.ink3, fontSize: '14px' }}>Loading…</div>
          ) : SKILLS.map(s => {
            const list = map[s.key] || [];
            return (
              <div key={s.key} style={{ marginBottom: '22px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: K.ink, marginBottom: '8px' }}>{s.label}</div>
                {list.length === 0 && (
                  <div style={{ fontSize: '13px', color: K.ink3, marginBottom: '8px' }}>
                    Nothing recorded yet.
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {list.map((lesson, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        value={lesson}
                        onChange={e => setLesson(s.key, i, e.target.value)}
                        placeholder="e.g. the second and third conditionals"
                        style={{ flex: 1, boxSizing: 'border-box', padding: '10px 12px', borderRadius: '12px', border: `1.5px solid ${K.line}`, fontSize: '14px', color: K.ink, outline: 'none' }}
                      />
                      <button onClick={() => removeLesson(s.key, i)} title="Remove this lesson"
                        style={{ flexShrink: 0, width: '32px', height: '32px', border: 'none', background: 'transparent', color: K.red, cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}>&times;</button>
                    </div>
                  ))}
                  <button onClick={() => addLesson(s.key)} style={btn('default', { alignSelf: 'flex-start', fontSize: '13px', padding: '7px 14px' })}>
                    + Write my own
                  </button>
                </div>

                {/* click to add; anything already on the list drops out */}
                {(() => {
                  const taken = new Set(list.map(l => l.trim().toLowerCase()));
                  const left = SUGGESTIONS[s.key].filter(x => !taken.has(x.toLowerCase()));
                  if (!left.length) return null;
                  return (
                    <div style={{ marginTop: '10px' }}>
                      <div style={{ fontSize: '12px', color: K.ink3, marginBottom: '6px' }}>Common for {s.label.toLowerCase()} — click to add</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {left.map(x => (
                          <button key={x} onClick={() => setMap(m => ({ ...m, [s.key]: [...(m[s.key] || []).filter(v => v.trim()), x] }))}
                            style={{ fontFamily: K.fd, fontSize: '12.5px', padding: '6px 12px', borderRadius: '999px',
                                     border: `1px dashed ${K.line}`, background: K.paper, color: K.ink2, cursor: 'pointer' }}>
                            + {x}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })}

          <div style={{ fontSize: '13px', color: K.ink3, background: K.sunken, borderRadius: '12px', padding: '12px 14px' }}>
            Write them as they should read inside a sentence — lowercase, no full stop.
            "the passive voice" becomes "please focus your review on: • the passive voice".
          </div>
        </div>

        <div style={{ padding: '16px 24px', borderTop: `1px solid ${K.line}`, background: K.sunken, display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {error && <span style={{ color: K.red, fontSize: '13px', flex: 1 }}>{error}</span>}
          {!error && <span style={{ color: K.ink3, fontSize: '13px', flex: 1 }}>{total} lesson{total === 1 ? '' : 's'} recorded</span>}
          <button onClick={onClose} style={btn('default')}>Cancel</button>
          <button onClick={save} disabled={saving || loading} style={btn('primary', saving ? { opacity: 0.6, cursor: 'wait' } : undefined)}>
            {saving ? 'Saving…' : 'Save lessons'}
          </button>
        </div>
      </div>
    </div>
  );
}