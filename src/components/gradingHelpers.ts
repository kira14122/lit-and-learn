// gradingHelpers.ts
// Pure, state-free helpers extracted from TeacherDashboard (Stage 0 of the
// grading modularization). No component state, no icons, no supabase — safe to
// share. Imported by TeacherDashboard now, and by GradingPortal next.

// A draft only "counts" if it actually holds marks — at least one score, or an
// explicit Absent flag. This keeps the Draft badge / banner honest and ignores
// blank or stale localStorage entries that have no real content.
export const draftHasContent = (d: any): boolean =>
  !!d && (!!d.isAbsent || !!d.scoreListening || !!d.scoreGrammar || !!d.scoreReading || !!d.scoreWriting || !!d.scoreSpeaking);

// ── Performance insights ────────────────────────────────────────────────────
// Pure, weight-independent analysis of a student's grade history. Each skill is
// converted to a percentage of that test's own max (so /50 and /100 tests are
// comparable), and the WEIGHT is intentionally ignored — weight is about grade
// contribution, not learning. Absent tests are excluded so they don't distort
// the trend. Old plain-text records (pre-JSON) are skipped safely.
export const INSIGHT_SKILLS = [
  { key: 'listening', label: 'Listening' },
  { key: 'grammar',   label: 'Grammar & Vocab' },
  { key: 'reading',   label: 'Reading' },
  { key: 'writing',   label: 'Writing' },
  { key: 'speaking',  label: 'Speaking' },
];

export const computeInsights = (history: any[]) => {
  const points = (history || []).map((h:any) => {
    let s:any = null;
    try { s = typeof h.score === 'string' ? JSON.parse(h.score) : h.score; } catch { return null; }
    if (!s || typeof s !== 'object' || !('listening' in s)) return null;
    if (s.isAbsent || s.notApplicable) return null;
    const max = Number(s.maxPoints) || 0;
    const per = max / 5;
    if (!per) return null;
    const pct = (k:string) => Math.round(((Number(s[k]) || 0) / per) * 100);
    return {
      name: h.assessment_name,
      date: h.date_recorded ? new Date(h.date_recorded).getTime() : 0,
      overall: Math.round(((Number(s.totalPoints) || 0) / max) * 100),
      listening: pct('listening'), grammar: pct('grammar'), reading: pct('reading'),
      writing: pct('writing'), speaking: pct('speaking'),
    };
  }).filter(Boolean) as any[];

  const _ORDER: any = { 'First Test': 0, 'Midterm': 1, 'Third Test': 2, 'Final Test': 3 };
  points.sort((a,b) => {
    const oa = a.name in _ORDER ? _ORDER[a.name] : 99;
    const ob = b.name in _ORDER ? _ORDER[b.name] : 99;
    return oa !== ob ? oa - ob : a.date - b.date;
  });
  if (points.length === 0) return null;

  const skills = INSIGHT_SKILLS.map(sk => {
    const series = points.map(p => p[sk.key as keyof typeof p] as number);
    const latest = series[series.length - 1];
    const first  = series[0];
    const prev   = series.length > 1 ? series[series.length - 2] : latest;
    const avg    = Math.round(series.reduce((a,b) => a + b, 0) / series.length);
    return { ...sk, series, latest, first, prev, avg, delta: latest - prev, trend: latest - first };
  });

  const weakest   = skills.reduce((m,s) => (s.avg < m.avg ? s : m), skills[0]);
  const strongest = skills.reduce((m,s) => (s.avg > m.avg ? s : m), skills[0]);
  const multi = points.length > 1;

  const withStatus = skills.map(s => {
    let status = 'Steady', tone = 'gray';
    const recent = multi ? s.delta : 0; // change since the previous test (matches the on-screen arrow)
    if (s.avg < 55) { status = 'Needs work'; tone = 'amber'; }            // still failing regardless of movement
    else if (recent <= -8 && s.avg >= 80) { status = 'Dipped last test'; tone = 'amber'; } // one-off drop from a strong record — flag it, but don't call a strength "slipping"
    else if (recent <= -8) { status = 'Slipping'; tone = 'amber'; }       // notable recent drop → agrees with the red arrow
    else if (recent >= 8) { status = 'Improving'; tone = 'green'; }       // notable recent rise → agrees with the green arrow
    else if (s.avg >= 80) { status = 'Strong'; tone = 'green'; }
    else if (s.avg < 60 || (s.key === weakest.key && s.avg < 70)) { status = 'Needs work'; tone = 'amber'; }
    else { status = 'Steady'; tone = 'gray'; }
    return { ...s, status, tone };
  });

  const overallFirst = points[0].overall;
  const overallLast  = points[points.length - 1].overall;
  const overallPrev  = multi ? points[points.length - 2].overall : overallLast;
  const overallTrend = overallLast - overallFirst;              // arc since the first test — context, not the headline
  const overallDelta = overallLast - overallPrev;               // movement since the PREVIOUS test — this drives the headline
  const direction = !multi ? 'single' : overallDelta >= 3 ? 'up' : overallDelta <= -3 ? 'down' : 'steady';

  // Human word for the headline. "Trending" is reserved for movement the
  // trajectory agrees with: a drop only counts as "Trending down" if the score
  // was already at or below the first test BEFORE this drop (i.e. the decline
  // isn't just one bad day after a rise). Symmetrically, a rise is only
  // "Trending up" if they were already at or above where they started —
  // otherwise it's a recovery ("Improving").
  const directionWord = !multi ? 'Single test'
    : direction === 'up'   ? (overallPrev >= overallFirst ? 'Trending up'   : 'Improving')
    : direction === 'down' ? (overallPrev <= overallFirst ? 'Trending down' : 'Dipped last test')
    : 'Holding steady';

  return { count: points.length, points, skills: withStatus, weakest, strongest, overallFirst, overallLast, overallPrev, overallTrend, overallDelta, direction, directionWord };
};

// One-line summary, reused for the on-screen banner and the AI feedback prompt.
export const insightsSummaryText = (ins:any): string => {
  if (!ins) return '';
  if (ins.count < 2) return `One test so far — overall ${ins.overallLast}%. Strongest: ${ins.strongest.label} (${ins.strongest.avg}%). Weakest: ${ins.weakest.label} (${ins.weakest.avg}%).`;
  return `${ins.directionWord} — overall ${ins.overallPrev}% → ${ins.overallLast}% since the last test (first test: ${ins.overallFirst}%). Recurring soft spot: ${ins.weakest.label} (avg ${ins.weakest.avg}%). Consistent strength: ${ins.strongest.label} (avg ${ins.strongest.avg}%).`;
};

// Compact context appended to the AI feedback prompt so drafts reference the real trend.
// Pass isFinal=true when grading the Final Test so the generated feedback closes out
// the term instead of pointing the student at a next test that doesn't exist.
export const insightsForAI = (ins:any, isFinal:boolean = false): string => {
  if (!ins) return '';
  const lines = ins.skills.map((s:any) => `${s.label} ${s.latest}% (${s.status})`).join('; ');
  const finalNote = isFinal
    ? ' IMPORTANT: this was the FINAL test of the term. Write feedback that closes the term — acknowledge the full arc of their results, recognize consistent strengths and real growth, and give advice the student can act on independently going forward. Do not mention the next test, upcoming lessons, or future classwork.'
    : '';
  return `\n\nPERFORMANCE CONTEXT (use to inform the feedback naturally; do not list these raw numbers): ${insightsSummaryText(ins)} Per-skill latest: ${lines}.${finalNote}`;
};

// Student-facing wording for the per-skill line in the email (gentle, never harsh).
export const studentSkillWord = (s:any): string => {
  if (s.status === 'Strong')           return 'a real strength';
  if (s.status === 'Improving')        return 'improving';
  if (s.status === 'Dipped last test') return 'dipped a little this time';
  if (s.status === 'Slipping')         return 'slipping a little — let\'s give it some attention';
  if (s.status === 'Needs work')       return 'worth more practice';
  return 'holding steady';
};

// Builds the plain-text "Your Progress So Far" block for the email body.
// Returns '' (nothing added) unless there are at least two non-absent tests.
export const buildProgressEmailText = (ins:any): string => {
  if (!ins || ins.count < 2) return '';
  const lead = ins.direction === 'up'
    ? `Overall, your score improved from ${ins.overallPrev}% to ${ins.overallLast}% since your last test — nice work.`
    : ins.direction === 'down'
    ? `Overall, your score moved from ${ins.overallPrev}% to ${ins.overallLast}% since your last test. Let's work on bringing that back up — you can do it.`
    : `Overall, your score has held steady at around ${ins.overallLast}% across your tests.`;
  const skillLines = ins.skills.map((s:any) => `• ${s.label} — ${s.latest}% · ${studentSkillWord(s)}`).join('\n');
  return `\n\n**Your Progress So Far**\n${lead} Here's how each skill is tracking:\n\n${skillLines}\n\nThe best area to focus on next is ${ins.weakest.label}.`;
};

// ── Term in Review (final-test email block) ─────────────────────────────────
// Replaces "Your Progress So Far" when the assessment being emailed is the
// Final Test. Written for adult learners: direct and warm, no pep-talk. Adapts
// to however many tests the student actually sat — skipped tests and late
// enrollment are described neutrally ("the three tests you took"), never
// explained or apologized for.
//
// `termGrade` is the weighted grade computed by GradingPortal (grading policy
// lives there, not here); pass null/undefined to omit the grade line entirely.
// `tips` is the teacher's feedback tip bank including their in-app edits;
// falls back to DEFAULT_TIPS.
export const buildTermReviewEmailText = (ins:any, termGrade?: number|null, tips?: Record<string,string[]>): string => {
  if (!ins) return '';
  const bank = tips || DEFAULT_TIPS;
  const tipFor = (key:string) => (bank[key] && bank[key][0]) || '';
  const gradeLine = (termGrade != null && !Number.isNaN(termGrade)) ? ` Your final term grade is **${Math.round(termGrade)}%**.` : '';

  // Only the final on record — no arc to tell, keep it clean and honest.
  if (ins.count < 2) {
    const tip = tipFor(ins.weakest.key);
    const carry = tip ? ` A habit worth keeping: ${tip}.` : '';
    return `\n\n**Your Term in Review**\nYou finished the term with ${ins.overallLast}% on the final.${gradeLine} Your strongest area was **${ins.strongest.label}** (${ins.strongest.latest}%); the one with the most room to grow is **${ins.weakest.label}** (${ins.weakest.latest}%).${carry}`;
  }

  // Two or more tests — a real arc exists.
  const arc = ins.points.map((p:any) => `${p.overall}%`).join(' → ');
  const testsPhrase = ins.count === 4 ? 'all four tests' : `the ${ins.count === 2 ? 'two' : 'three'} tests you took`;
  const earlierMax = Math.max(...ins.points.slice(0, -1).map((p:any) => p.overall));
  const flourish = ins.overallLast >= earlierMax
    ? ', finishing on your strongest result of the term'
    : ins.overallLast > ins.overallPrev
    ? ', ending with an improvement on your previous test'
    : '';
  const opener = `You've completed the term — here is the full picture. Across ${testsPhrase}, your scores went ${arc}${flourish}.${gradeLine}`;

  const strength = `Your most consistent strength this term was **${ins.strongest.label}** (average ${ins.strongest.avg}%).`;

  // "Biggest growth" only when it's a real signal (≥8 points first → last) and
  // not the same skill we just named the strength.
  const grown = ins.skills.reduce((m:any, s:any) => (s.trend > m.trend ? s : m), ins.skills[0]);
  const growth = (grown.trend >= 8 && grown.key !== ins.strongest.key)
    ? ` Your biggest growth was in **${grown.label}**, which climbed from ${grown.first}% to ${grown.latest}% — that improvement came from your work, and it shows.`
    : '';

  const tip = tipFor(ins.weakest.key);
  const carry = `If you continue with one thing going forward, make it **${ins.weakest.label}**.` + (tip ? ` A habit worth keeping: ${tip}.` : '');

  return `\n\n**Your Term in Review**\n${opener}\n\n${strength}${growth}\n\n${carry}`;
};

// ── Quick feedback builder bank ─────────────────────────────────────────────
// Starter recommendation phrases per skill (lowercase imperative fragments, so
// they read naturally inside "for reading, <tip>, and <tip>").
// Editable in-app; the teacher's edits are saved to localStorage.
export const FEEDBACK_TIPS_KEY = 'll_feedback_tips_v1';
export const DEFAULT_TIPS: Record<string,string[]> = {
  listening: [
    'watch a short English clip with subtitles, then again without',
    'listen to a podcast and summarise it aloud afterwards',
    'notice how words link together in natural speech',
    'do a short daily listening at your level on News in Levels',
  ],
  grammar: [
    'keep a personal error log and review it each week',
    'practise the target structures on Perfect English Grammar',
    'learn new words in chunks and collocations, not one by one',
    'review new vocabulary with spaced repetition on Anki',
  ],
  reading: [
    'skim for the main idea before reading for detail',
    'read a short passage on ReadTheory each day',
    'underline unknown words, guess from context, then check',
    'summarise each paragraph in one sentence',
  ],
  writing: [
    'plan with a quick outline before you start',
    'self-edit for one target error type each time',
    'rewrite one paragraph after reading my feedback',
    'read your writing aloud to catch awkward sentences',
  ],
  speaking: [
    'record a one-minute answer and listen back',
    'shadow a short audio clip a little each day',
    'answer in full sentences, not single words',
    'prepare three example sentences for each new structure',
  ],
};