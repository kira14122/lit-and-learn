// ─────────────────────────────────────────────────────────────────────────────
// reportEngine — the end-of-term progress report.
//
// Built from fourteen reports written by hand.
//
// The first version had ONE skeleton with interchangeable words, which read as
// repetitive across a class — the same fault the old AI feedback had. The
// samples do not work that way: they use genuinely different sentence
// architecture. Strengths and needs are sometimes separate sentences, sometimes
// joined with "but". Traits sometimes split over two sentences. The name
// sometimes repeats where a pronoun would do. "However" sometimes carries the
// turn.
//
// So there are eight shapes below, each lifted from a real sample, chosen by
// the student's name — stable between regenerations, different from the student
// above and below in the stack. `variant` cycles them when a particular report
// wants a different shape. Only the arrangement varies; every fact still comes
// from the marks and your ticks.
//
// The original single shape was:
//
//   1. <Name> is a <traits> student[, <optional clause about effort>].
//   2. <Strengths>  — "tends to excel at" / "is excellent at" / "is good at",
//      always followed by "tasks".
//   3. <Needs>      — "just needs to focus on" when one, "needs to work on
//      improving" when several, always followed by "skills"; attendance added
//      when it applies.
//   4. <Name> meets / does not meet the requirements to pass.
//
// 39–51 words, mean 44. The verdict is always the last sentence and always uses
// the full name.
//
// Strengths and needs come from the term's scores. Traits come from you — no
// amount of marking reveals whether someone is respectful or punctual, so the
// system does not pretend to know.
//
// The pass rule is the weighted standing over the WHOLE term: a test never sat
// scores zero and still occupies its weight. That is a different number from
// the "grade so far" the portal shows, which divides by the tests taken.
// ─────────────────────────────────────────────────────────────────────────────

export type Pronoun = 'she' | 'he' | 'they';
export type ReportSkill = 'listening' | 'grammar' | 'reading' | 'writing' | 'speaking';

export const PASS_MARK = 70;
const STRONG = 85;   // "excels at"
const GOOD   = 70;   // "is good at"

export const REPORT_SKILLS: { key: ReportSkill; label: string }[] = [
  { key: 'listening', label: 'listening' },
  { key: 'grammar',   label: 'grammar' },
  { key: 'reading',   label: 'reading' },
  { key: 'writing',   label: 'writing' },
  { key: 'speaking',  label: 'speaking' },
];

export const TRAITS = [
  'hardworking', 'brilliant', 'disciplined', 'attentive', 'respectful',
  'motivated', 'participative', 'punctual', 'enthusiastic', 'serious', 'exceptional',
];

export const STRUCTURE_COUNT = 8;

export interface ReportInput {
  studentName: string;
  pronoun: Pronoun | null;
  traits: string[];                          // ticked by the teacher
  skillPct: Partial<Record<ReportSkill, number>>;  // term average per skill, 0–100
  standing: number;                          // weighted over the whole term, 0–100
  missedAllTests?: boolean;
  attendanceConcern?: boolean;
  effortClause?: boolean;                    // the optional second half of sentence one
  variant?: number;                          // cycles the structure; omit for the default
}

const subj = (p: Pronoun) => ({ she: 'She', he: 'He', they: 'They' }[p]);
const low  = (p: Pronoun) => ({ she: 'she', he: 'he', they: 'they' }[p]);
const Poss = (p: Pronoun) => ({ she: 'Her', he: 'His', they: 'Their' }[p]);
const has  = (p: Pronoun) => (p === 'they' ? 'have' : 'has');
const poss = (p: Pronoun) => ({ she: 'her', he: 'his', they: 'their' }[p]);
const isAre = (p: Pronoun) => (p === 'they' ? 'are' : 'is');
const sVerb = (p: Pronoun, verb: string) => (p === 'they' ? verb : verb + 's');

// "a" or "an", by sound of the first trait
const article = (word: string) => (/^[aeiou]/i.test(word) ? 'an' : 'a');

// Oxford comma, as in every one of the samples.
const list = (items: string[]): string =>
  items.length <= 1 ? (items[0] || '')
  : items.length === 2 ? `${items[0]} and ${items[1]}`
  : `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;

// Small banks so a class of forty does not read as one sentence repeated.
// Seeded by name, so a student's report is stable between regenerations.
const EFFORT = [
  'who approaches each class with a genuine desire to learn',
  'who has always shown a genuine desire to learn and improve',
  'who works hard in class and engages with every task',
  'who has worked hard to improve throughout the term',
];
// stored as the bare verb phrase so the verb can agree with the pronoun
const hash = (seed: string): number => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
};
const seeded = <T,>(list: T[], seed: string, salt = 0): T => list[(hash(seed) + salt) % list.length];

const ATTITUDE = [
  'approaches each task with genuine care, focus, and a desire to improve',
  'always participates in class and has a genuine desire to learn',
  'has worked hard to improve throughout the term',
];

export interface ReportResult {
  text: string;
  passes: boolean;
  strengths: ReportSkill[];
  needs: ReportSkill[];
  words: number;
  missingPronoun: boolean;
  structure: string;      // which shape was used, shown in the UI
}

export function buildReport(input: ReportInput): ReportResult {
  const {
    studentName, pronoun, traits, skillPct, standing,
    missedAllTests, attendanceConcern, effortClause, variant,
  } = input;

  const p: Pronoun = pronoun || 'they';
  const name = studentName.trim().split(/\s+/)[0] || studentName;
  const passes = standing >= PASS_MARK;

  const rated = REPORT_SKILLS
    .filter(s => typeof skillPct[s.key] === 'number')
    .map(s => ({ ...s, pct: skillPct[s.key] as number }));
  const strengths = rated.filter(s => s.pct >= GOOD);
  const needs     = rated.filter(s => s.pct <  GOOD);
  const allStrong = strengths.length > 1 && strengths.every(s => s.pct >= STRONG);

  const sLabels = list(strengths.map(s => s.label));
  const nLabels = list(needs.map(s => s.label));
  const t = traits.filter(Boolean);
  const traitPhrase = t.length ? `${article(t[0])} ${list(t)} student` : 'a student';

  const openPlain = `${name} ${isAre(p)} ${traitPhrase}.`;
  const openWho   = `${name} ${isAre(p)} ${traitPhrase} ${seeded(EFFORT, studentName)}.`;
  const attitude  = `${subj(p)} ${seeded(ATTITUDE, studentName, 4)}.`;

  const strongVerb = allStrong
    ? seeded([`${sVerb(p, 'tend')} to excel at`, `${isAre(p)} excellent at`], studentName, 1)
    : `${isAre(p)} good at`;

  const needLead = needs.length === 1
    ? seeded([`just ${sVerb(p, 'need')} to focus on improving`, `just ${sVerb(p, 'need')} to focus on refining`], studentName, 2)
    : seeded([`${sVerb(p, 'need')} to work on improving`, `${sVerb(p, 'need')} to focus on improving`], studentName, 2);

  const attendTail = attendanceConcern ? ` as well as ${poss(p)} attendance` : '';
  const needSentence = (leadWith: string) =>
    `${leadWith} ${needLead} ${poss(p)} ${nLabels} skills${attendTail}.`;

  const idx = ((variant ?? 0) + hash(studentName)) % STRUCTURE_COUNT;
  const parts: string[] = [];
  let structure = '';
  let needsDone = false;

  if (idx === 0) {                          // Jennifer: three plain sentences
    structure = 'strengths, then needs';
    parts.push(openPlain);
    if (strengths.length) parts.push(`${subj(p)} ${strongVerb} ${sLabels} tasks.`);
    if (needs.length) { parts.push(needSentence(subj(p))); needsDone = true; }

  } else if (idx === 1) {                   // Lisette, Iury: joined with "but"
    structure = 'joined with "but"';
    parts.push(effortClause ? openWho : openPlain);
    if (strengths.length && needs.length) {
      parts.push(`${subj(p)} ${strongVerb} ${sLabels} tasks, but ${low(p)} ${needLead} ${poss(p)} ${nLabels} skills${attendTail}.`);
      needsDone = true;
    } else if (strengths.length) {
      parts.push(`${subj(p)} ${strongVerb} ${sLabels} tasks.`);
    }

  } else if (idx === 2) {                   // Yuko: "However," turn
    structure = '"However," turn';
    parts.push(effortClause ? openWho : openPlain);
    if (strengths.length) parts.push(`${subj(p)} ${strongVerb} ${sLabels} tasks.`);
    if (needs.length) {
      parts.push(`However, ${low(p)} ${needLead} ${poss(p)} ${nLabels} skills${attendTail} more.`);
      needsDone = true;
    }

  } else if (idx === 3) {                   // Gloria, Jenny: one strength named
    structure = 'single strength named';
    parts.push(openPlain);
    if (effortClause) parts.push(attitude);
    const top = [...strengths].sort((a, b) => b.pct - a.pct)[0];
    if (top) parts.push(`${top.label.charAt(0).toUpperCase() + top.label.slice(1)} ${isAre(p)} one of ${poss(p)} major ${seeded(['strengths', 'assets'], studentName, 3)}.`);
    if (needs.length) { parts.push(needSentence(subj(p))); needsDone = true; }

  } else if (idx === 4) {                   // Donela: "Her X skills are excellent"
    structure = 'skills are excellent';
    parts.push(openPlain);
    if (strengths.length) parts.push(`${Poss(p)} ${sLabels} skills are excellent.`);
    if (needs.length) { parts.push(needSentence(subj(p))); needsDone = true; }

  } else if (idx === 5) {                   // Catherine: the name repeats
    structure = 'name repeated';
    parts.push(effortClause ? openWho : openPlain);
    if (strengths.length) parts.push(`${subj(p)} ${strongVerb} ${sLabels} tasks.`);
    if (needs.length) { parts.push(needSentence(name)); needsDone = true; }

  } else if (idx === 6) {                   // Mahrijemal: "improving, but ... mainly"
    structure = 'improving, but';
    parts.push(openPlain);
    if (strengths.length && needs.length) {
      parts.push(`${Poss(p)} ${sLabels} skills are improving, but ${low(p)} ${sVerb(p, 'need')} to dedicate more time to strengthening ${poss(p)} other skills, mainly ${nLabels}${attendTail}.`);
      needsDone = true;
    } else if (strengths.length) {
      parts.push(`${Poss(p)} ${sLabels} skills are improving.`);
    }

  } else {                                  // Maria: traits split over two sentences
    structure = 'traits split';
    parts.push(`${name} ${isAre(p)} ${t.length ? article(t[0]) + ' ' + t[0] : 'a'} student.`);
    if (t.length > 1) parts.push(`${subj(p)} ${isAre(p)} ${list(t.slice(1))}.`);
    if (strengths.length) parts.push(allStrong
      ? `${subj(p)} ${has(p)} an excellent grasp of language nuances and ${sVerb(p, 'tend')} to excel at ${sLabels} tasks.`
      : `${subj(p)} ${has(p)} a solid grasp of language nuances and ${isAre(p)} good at ${sLabels} tasks.`);
    if (needs.length) { parts.push(needSentence(subj(p))); needsDone = true; }
  }

  if (needs.length && !needsDone) parts.push(needSentence(subj(p)));

  if (missedAllTests) {
    parts.push(`${subj(p)} ${sVerb(p, 'need')} to improve ${poss(p)} attendance, as ${low(p)} ${has(p)} missed ${poss(p)} tests.`);
  } else if (attendanceConcern && !attendTail) {
    parts.push(`${subj(p)} also ${sVerb(p, 'need')} to improve ${poss(p)} attendance.`);
  }

  parts.push(`${name} ${passes ? 'meets' : 'does not meet'} the requirements to pass.`);

  const text = parts.join(' ').replace(/\s{2,}/g, ' ').trim();
  return {
    text, passes,
    strengths: strengths.map(s => s.key),
    needs: needs.map(s => s.key),
    words: text.split(/\s+/).length,
    missingPronoun: !pronoun,
    structure,
  };
}