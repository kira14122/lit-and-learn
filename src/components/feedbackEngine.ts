// ─────────────────────────────────────────────────────────────────────────────
// feedbackEngine — builds the student email from the marks and the lessons the
// test actually covered.
//
// There is no model call here, and that is the point. The old generator was
// asked to invent specific advice from five numbers, so it reached for the same
// plausible grammar list every time. Everything below is derived from data that
// exists: the scores you entered, and the lessons you recorded for this test.
// If a lesson is not in the list, it cannot appear in the email.
//
// Shape, fixed:
//   Hi <name>,
//   <total>/<max> on the <test> — <weight>% of your term grade. Your <best>
//   was <adverb> at <n>/<per>! <worst> (<n>/<per>) brought your score down, so
//   please focus your review on:
//   • lesson
//   • lesson
//   <closing line>
//
// Only the single weakest skill is ever named. A student with four weak skills
// gets one thing to work on, not four — negative feedback that arrives all at
// once stops being useful.
//
// Grammar & Vocab is ONE part of the exam, but from Fall 2026 it is marked in
// two halves. The engine looks inside it: if one half is below the line and the
// other is not, only that half is named ("Grammar (4/10)") and only its lessons
// are suggested. 10/10 vocabulary and 4/10 grammar is 70% combined — which used
// to pass the line unnoticed — but it is 40% grammar, and that is what the
// student needs to hear. When both halves are weak, the part is named whole.
// A half can also be the student's best area ("Your vocabulary was perfect").
// ─────────────────────────────────────────────────────────────────────────────

export const REVIEW_THRESHOLD = 0.70;   // a skill flags below 70% of its maximum
export const MAX_BULLETS = 3;

export type SkillKey = 'listening' | 'grammar' | 'reading' | 'writing' | 'speaking';
// Lessons are recorded per skill, with Grammar & Vocab split into its two
// halves: 'grammar' holds grammar lessons (and any recorded before the split),
// 'vocab' holds vocabulary lessons.
export type LessonKey = SkillKey | 'vocab';

export const SKILLS: { key: SkillKey; label: string; short: string }[] = [
  { key: 'listening', label: 'Listening',               short: 'listening' },
  { key: 'grammar',   label: 'Grammar and vocabulary',  short: 'grammar and vocabulary' },
  { key: 'reading',   label: 'Reading',                 short: 'reading' },
  { key: 'writing',   label: 'Writing',                 short: 'writing' },
  { key: 'speaking',  label: 'Speaking',                short: 'speaking' },
];

export interface FeedbackInput {
  studentName: string;
  assessmentName: string;                  // 'Midterm'
  maxPoints: number;                       // 50 or 100
  earnedWeight: number;                    // 23.4
  formative?: boolean;                     // First/Third Test from Fall 2026: no weight, so no "% of your term grade"
  // grammar = the combined Grammar & Vocab mark; grammarOnly / vocab are its two
  // halves (each out of a tenth of the test), present on records after the split.
  scores: Record<SkillKey, number> & { grammarOnly?: number; vocab?: number };
  lessonsBySkill: Partial<Record<LessonKey, string[]>>;  // from test_lessons
  selectedLessons?: string[] | null;       // what the teacher ticked; null = use the auto pick
  absent?: boolean;
  notApplicable?: boolean;
  movingUpTo?: string | null;              // 'Level 5' on a final, if you say so
  teacherNote?: string | null;             // one line of your own, used verbatim
  previous?: {                             // the student's last graded test this term
    assessmentName: string;
    maxPoints: number;
    scores: Record<SkillKey, number>;
  } | null;
}

export interface PlanSkill {
  key: SkillKey; label: string; short: string; value: number; pct: number;
  max: number;                             // what `value` is out of (a half is out of perSkill / 2)
  lessonKeys: LessonKey[];                 // where this area's lessons are recorded
}

export interface FeedbackPlan {
  total: number;
  perSkill: number;
  strongest: PlanSkill;
  weakest:   PlanSkill | null;
  flaggedCount: number;                    // how many fell below the line, for the UI
  suggestedLessons: string[];              // pre-ticked for the teacher
  lessonPool: string[];                    // every lesson recorded for the named area(s), for ticking
  text: string;
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const fmt = (n: number) => String(round1(n));
// The weight always carries one decimal — "49.0%", never "49%" — matching how
// it is written everywhere else in the portal and in the emails already sent.
const pct1 = (n: number) => (Math.round(n * 10) / 10).toFixed(1);

// How the test is named in a sentence. "on the final", not "on the final test".
const testPhrase = (name: string) =>
  name === 'Final Test' ? 'final'
: name === 'Midterm'    ? 'midterm'
: name.toLowerCase();

// How to describe the best skill, by how good it actually was.
const adverbFor = (pct: number): string =>
  pct >= 1     ? 'perfect'
: pct >= 0.925 ? 'excellent'
: pct >= 0.85  ? 'strong'
: pct >= 0.70  ? 'solid'
:                'your best area';

// Closing lines, chosen by band and then by name, so the same student always
// gets the same one and consecutive students in a sitting do not.
const CLOSERS = {
  high:   ['Outstanding work!', 'Excellent work!', 'Superb work — well done!'],
  mid:    ['Well done overall!', 'Good work — keep it going!', 'Nice work this time!'],
  low:    ['Keep putting in the hard work!', 'Keep at it — you will get there!', 'Keep going, the effort shows!'],
};
// The biggest genuine improvement since the last test. A point either way is
// rounding, not progress, so a move has to be worth reporting. Only gains: this
// line exists to tell a strong student something they could not see themselves.
const MOVEMENT_MIN_PTS = 10;   // percentage points

function biggestGain(
  scores: Record<SkillKey, number>, perSkill: number,
  previous: FeedbackInput['previous'],
): { short: string; from: number; to: number; test: string; sameScale: boolean } | null {
  if (!previous || !previous.maxPoints || !perSkill) return null;
  const prevPer = previous.maxPoints / 5;
  if (!prevPer) return null;

  let best: { short: string; from: number; to: number; test: string; gain: number } | null = null;
  for (const s of SKILLS) {
    const now  = Number(scores[s.key]) || 0;
    const then = Number(previous.scores?.[s.key]) || 0;
    const gain = (now / perSkill) * 100 - (then / prevPer) * 100;
    if (gain >= MOVEMENT_MIN_PTS && (!best || gain > best.gain)) {
      best = { short: s.short, from: then, to: now, test: previous.assessmentName, gain,
               fromPct: (then / prevPer) * 100, toPct: (now / perSkill) * 100 } as any;
    }
  }
  if (!best) return null;
  // A 50-point test and a 100-point test do not share a scale, so "from 6 to 18"
  // would be nonsense. Fall back to percentages when the totals differ.
  const sameScale = prevPer === perSkill;
  return sameScale
    ? { short: best.short, from: best.from, to: best.to, test: best.test, sameScale: true }
    : { short: best.short, from: Math.round((best as any).fromPct), to: Math.round((best as any).toPct), test: best.test, sameScale: false };
}

const pickClosing = (band: keyof typeof CLOSERS, seed: string): string => {
  const list = CLOSERS[band];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return list[h % list.length];
};

export function buildFeedback(input: FeedbackInput): FeedbackPlan {
  const {
    studentName, assessmentName, maxPoints, earnedWeight, scores,
    lessonsBySkill, selectedLessons, absent, notApplicable, movingUpTo, teacherNote,
  } = input;

  const perSkill = maxPoints / 5;
  const half = perSkill / 2;
  const hasSplit = scores.grammarOnly != null || scores.vocab != null;
  const ratio = (v: number, m: number) => (m > 0 ? v / m : 0);
  const gRow: PlanSkill = { key: 'grammar', label: 'Grammar',    short: 'grammar',    value: Number(scores.grammarOnly) || 0, max: half, pct: ratio(Number(scores.grammarOnly) || 0, half), lessonKeys: ['grammar'] };
  const vRow: PlanSkill = { key: 'grammar', label: 'Vocabulary', short: 'vocabulary', value: Number(scores.vocab) || 0,       max: half, pct: ratio(Number(scores.vocab) || 0, half),       lessonKeys: ['vocab'] };

  // Every part as a whole — the total and the improvement line use these.
  const parts: PlanSkill[] = SKILLS.map(s => ({
    ...s,
    value: Number(scores[s.key]) || 0,
    max: perSkill,
    pct: ratio(Number(scores[s.key]) || 0, perSkill),
    lessonKeys: s.key === 'grammar' ? ['grammar', 'vocab'] as LessonKey[] : [s.key] as LessonKey[],
  }));
  const total = parts.reduce((a, r) => a + r.value, 0);

  // What is judged. Grammar & Vocab with its halves recorded is judged by what
  // is actually weak inside it: one weak half stands in for the part; both weak
  // (or neither) leaves the part whole.
  const judged: PlanSkill[] = parts.map(r => {
    if (r.key !== 'grammar' || !hasSplit) return r;
    const gWeak = gRow.pct < REVIEW_THRESHOLD, vWeak = vRow.pct < REVIEW_THRESHOLD;
    return gWeak && !vWeak ? gRow : vWeak && !gWeak ? vRow : r;
  });

  // Best area: a half may be it — "your vocabulary was perfect" is worth saying
  // even when grammar pulled the part down.
  const praiseable: PlanSkill[] = parts.map(r =>
    r.key === 'grammar' && hasSplit ? (gRow.pct >= vRow.pct ? gRow : vRow) : r);
  const strongest = [...praiseable].sort((a, b) => b.pct - a.pct)[0];
  const flagged = judged.filter(r => r.pct < REVIEW_THRESHOLD).sort((a, b) => a.pct - b.pct);
  const weakest = flagged[0] ?? null;

  // Ties are real: writing and speaking both at 10/20 is not "writing".
  // Naming whichever happens to sit first in the list is arbitrary, so name
  // both, capped at two so the sentence stays a sentence.
  const tied = weakest ? flagged.filter(r => Math.abs(r.pct - weakest.pct) < 1e-9).slice(0, 2) : [];

  // Bullets come from every tied skill, in order, capped at three. A named half
  // offers only its own lessons.
  const lessonPool = Array.from(new Set(
    tied.flatMap(t => t.lessonKeys.flatMap(k => lessonsBySkill[k] ?? [])).filter(l => l && l.trim())));
  const auto = lessonPool.slice(0, MAX_BULLETS);
  const bullets = (selectedLessons ?? auto).filter(l => l && l.trim()).slice(0, MAX_BULLETS);

  // ── the exceptional cases first ────────────────────────────────────────────
  if (notApplicable) {
    return plan({
      total, perSkill, strongest, weakest, flagged, auto, lessonPool,
      text: `Hi ${studentName},\nThe ${assessmentName} has been recorded as not applicable for you, so it does not count toward your term grade.`,
    });
  }
  if (absent) {
    return plan({
      total: 0, perSkill, strongest, weakest, flagged, auto, lessonPool,
      text: input.formative
        ? `Hi ${studentName},\nYou were absent for the ${assessmentName}. It doesn't count toward your term grade, but it is useful practice, so please come and see me if you would like to go over it.`
        : `Hi ${studentName},\nYou were absent for the ${assessmentName}, so it is recorded as 0 for this test. Please come and see me so we can talk about making the work up.`,
    });
  }

  // ── the normal email ───────────────────────────────────────────────────────
  const lines: string[] = [`Hi ${studentName},`];

  let opening = input.formative
    ? `${fmt(total)}/${maxPoints} on the ${testPhrase(assessmentName)}.`
    : `${fmt(total)}/${maxPoints} on the ${testPhrase(assessmentName)} — ${pct1(earnedWeight)}% of your term grade.`;
  if (teacherNote && teacherNote.trim()) opening += ` ${teacherNote.trim()}`;

  const adv = adverbFor(strongest.pct);
  opening += adv === 'your best area'
    ? ` Your ${strongest.short} was your strongest at ${fmt(strongest.value)}/${fmt(strongest.max)}.`
    : ` Your ${strongest.short} was ${adv} at ${fmt(strongest.value)}/${fmt(strongest.max)}!`;

  if (!weakest) {
    // Nothing to review, so say the one thing they could not work out alone:
    // what has actually improved since last time.
    const gain = biggestGain(scores, perSkill, input.previous);
    lines.push(opening + ' Nothing from this test needs reviewing.'
      + (gain ? ` Your ${gain.short} has come up from ${fmt(gain.from)}${gain.sameScale ? '' : '%'} to ${fmt(gain.to)}${gain.sameScale ? '' : '%'} since the ${testPhrase(gain.test)}.` : ''));
    if (movingUpTo) lines.push(`You are moving up to ${movingUpTo} — well earned!`);
    lines.push(pickClosing('high', studentName));
    return plan({ total, perSkill, strongest, weakest, flagged, auto, lessonPool, text: lines.join('\n') });
  }

  // Only the weakest is ever named, however many fell below the line — but when
  // several did, say so, or a student fixes one thing and is surprised later.
  // "(4/10 each)" only when both really are the same mark out of the same number.
  const names = tied.length > 1
    ? (tied[0].max === tied[1].max && tied[0].value === tied[1].value
        ? `${tied[0].label} and ${tied[1].short} (${fmt(tied[0].value)}/${fmt(tied[0].max)} each)`
        : `${tied[0].label} (${fmt(tied[0].value)}/${fmt(tied[0].max)}) and ${tied[1].short} (${fmt(tied[1].value)}/${fmt(tied[1].max)})`)
    : `${weakest.label} (${fmt(weakest.value)}/${fmt(weakest.max)})`;
  const most = flagged.length > 1 ? ' the most' : '';
  opening += ` ${names} brought your score down${most}`;
  opening += bullets.length ? ', so please focus your review on:' : '. That is the place to put your effort next.';
  lines.push(opening);
  bullets.forEach(b => lines.push('• ' + b));

  // More than one skill below the line: name the scale, and say why the email
  // gives one thing rather than five.
  if (flagged.length > tied.length) {
    lines.push('There is more to work on, but start here — one thing at a time is how it improves.');
  }

  if (movingUpTo) lines.push(`You are moving up to ${movingUpTo} — well earned!`);

  const overall = perSkill > 0 ? total / (perSkill * 5) : 0;
  const band = overall >= 0.85 ? 'high' : overall >= 0.65 ? 'mid' : 'low';
  lines.push(pickClosing(band, studentName));

  return plan({ total, perSkill, strongest, weakest, flagged, auto, lessonPool, text: lines.join('\n') });
}

function plan(a: any): FeedbackPlan {
  return {
    total: a.total,
    perSkill: a.perSkill,
    strongest: { ...a.strongest },
    weakest: a.weakest ? { ...a.weakest } : null,
    flaggedCount: a.flagged.length,
    suggestedLessons: a.auto,
    lessonPool: a.lessonPool || [],
    text: a.text,
  };
}