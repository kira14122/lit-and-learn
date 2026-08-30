import type { ReportInput, ReportResult, ReportSkill } from './reportEngine';
import { REPORT_SKILLS } from './reportEngine';

// ─────────────────────────────────────────────────────────────────────────────
// refineReport — vary the wording, never the facts.
//
// The eight structures in reportEngine rearrange clauses but keep the same
// vocabulary, so across a class they still read as one voice. A model varies
// word choice in a way templates cannot, and it is safe to use HERE — unlike
// the old generator — because it is not being asked to work anything out. The
// traits, the strengths, the weaknesses and the verdict are already decided.
// It only chooses how to say them.
//
// The danger is different, and it is quiet: a rephrasing model will happily
// promote "good at reading" to "excels at reading", drop the verdict sentence,
// or mention a skill nobody listed. So every result is checked against the
// facts before it is shown, and anything that fails is discarded in favour of
// the engine's own text. The teacher is told which one they are looking at.
//
// Uses the same ask-gemini edge function the rest of the app calls.
// ─────────────────────────────────────────────────────────────────────────────

// Two of Raouf's own reports, as the style to match. Real examples beat any
// amount of description about tone.
const STYLE_EXAMPLES = `
Jennifer is a hardworking, motivated, disciplined, and respectful student. She tends to excel at listening, reading, and speaking tasks. She just needs to focus on refining her grammar and writing skills. Jennifer does not meet the requirements to pass.

Iury is a motivated and enthusiastic student who works hard in class and has a genuine desire to learn and improve. He is good at reading tasks but needs to work on his grammar, listening, and pronunciation. Iury does not meet the requirements to pass.

Mahrijemal is a hardworking and disciplined student. Her reading and grammar skills are improving, but she needs to dedicate more time to strengthen her other skills, mainly listening, speaking, and writing. Mahrijemal does not meet the requirements to pass.
`.trim();

export interface RefineResult {
  text: string;
  usedAI: boolean;
  reason?: string;          // why the model's version was rejected, if it was
}

const labelFor = (k: ReportSkill) => REPORT_SKILLS.find(s => s.key === k)?.label || k;

export function buildRefinePrompt(input: ReportInput, plan: ReportResult): string {
  const first = input.studentName.trim().split(/\s+/)[0];
  const verdict = `${first} ${plan.passes ? 'meets' : 'does not meet'} the requirements to pass.`;
  return `You are rewriting one end-of-term progress report for an adult English student.

Write it in the voice of these examples:

${STYLE_EXAMPLES}

The facts, which you must not change, add to, or leave out:
- Name to use: ${first}
- Pronoun: ${input.pronoun || 'they'}
- Character traits the teacher chose: ${input.traits.join(', ') || '(none)'}
- Skills the student is good at: ${plan.strengths.map(labelFor).join(', ') || '(none)'}
- Skills the student must work on: ${plan.needs.map(labelFor).join(', ') || '(none)'}
${input.attendanceConcern ? '- Attendance needs improving\n' : ''}${input.missedAllTests ? '- The student missed their tests\n' : ''}
Rules:
- 40 to 55 words. Three or four sentences. One paragraph, no line breaks.
- The LAST sentence must be exactly: ${verdict}
- Name only the skills listed above, and only on the side they are listed.
- Do not invent scores, percentages, lesson names, websites, or study advice.
- Do not add encouragement beyond what the examples show.
- Vary the sentence construction. Do not copy the examples word for word.

Write only the report.`;
}

// ── the check ────────────────────────────────────────────────────────────────
// Everything here is a way the model could quietly change a fact.
export function validateRefined(
  text: string, input: ReportInput, plan: ReportResult,
): { ok: true } | { ok: false; reason: string } {
  const t = (text || '').trim();
  if (!t) return { ok: false, reason: 'empty response' };

  const first = input.studentName.trim().split(/\s+/)[0];
  const verdict = `${first} ${plan.passes ? 'meets' : 'does not meet'} the requirements to pass.`;
  if (!t.endsWith(verdict)) return { ok: false, reason: 'the pass verdict was changed or dropped' };

  // the opposite verdict must not appear anywhere
  const opposite = plan.passes ? 'does not meet the requirements' : /\bmeets the requirements/;
  if (typeof opposite === 'string' ? t.includes(opposite) : opposite.test(t.replace(verdict, ''))) {
    return { ok: false, reason: 'contradicts the verdict' };
  }

  const words = t.split(/\s+/).length;
  if (words < 28 || words > 70) return { ok: false, reason: `length was ${words} words` };

  // a skill must not appear on the wrong side, and must not appear at all if it
  // was never rated
  const lower = t.toLowerCase();
  const strengthSet = new Set(plan.strengths.map(labelFor));
  const needSet = new Set(plan.needs.map(labelFor));
  for (const s of REPORT_SKILLS) {
    const mentioned = lower.includes(s.label);
    if (mentioned && !strengthSet.has(s.label) && !needSet.has(s.label)) {
      return { ok: false, reason: `mentions ${s.label}, which was not rated` };
    }
  }
  for (const label of needSet) {
    if (!lower.includes(label)) return { ok: false, reason: `left out ${label}, which needs work` };
  }

  // invented specifics: numbers, percentages, web addresses
  if (/\d/.test(t)) return { ok: false, reason: 'added numbers' };
  if (/\.(com|org|net)\b/i.test(t)) return { ok: false, reason: 'added a website' };

  return { ok: true };
}

export async function refineReport(
  input: ReportInput, plan: ReportResult,
): Promise<RefineResult> {
  // Same source as aiGenerator, so there is one place these are configured.
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey     = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return { text: plan.text, usedAI: false, reason: 'Supabase keys are not configured' };
  }
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/ask-gemini`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${anonKey}` },
      body: JSON.stringify({ prompt: buildRefinePrompt(input, plan) }),
    });
    if (!res.ok) return { text: plan.text, usedAI: false, reason: `the service returned ${res.status}` };
    const data = await res.json();
    const raw: string = (data?.text || '').trim().replace(/^["']|["']$/g, '');

    const check = validateRefined(raw, input, plan);
    if (!check.ok) return { text: plan.text, usedAI: false, reason: check.reason };
    return { text: raw.replace(/\s+/g, ' '), usedAI: true };
  } catch (e: any) {
    return { text: plan.text, usedAI: false, reason: e?.message || 'the request failed' };
  }
}