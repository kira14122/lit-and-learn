// src/aiGenerator.ts
// Primary: Gemini 2.0 Flash | Fallback: Groq Llama 3.3 70B
// ~16,000 free requests per day combined
//
// ── REDESIGN NOTES ──────────────────────────────────────────────────────────
// This file keeps ALL existing exports working unchanged:
//   - generateWorksheetActivity   (legacy free-form block generator)
//   - generateExampleSentence
//   - generateStudentFeedback
//
// It ADDS the structured-worksheet generators used by the redesigned
// Activity Generator. The key design decision lives in generateVocabularySet:
// Vocabulary Hunt (2A), Matching (2B) and Fill the Gaps (2C) each use a
// DIFFERENT set of words from the passage (no repeats across the three), plus
// 3 distractors for the 2C bank. All groups are produced in ONE call so the
// model can keep them mutually distinct; the UI renders each sub-section and
// does all column/bank shuffling CLIENT-SIDE (deterministic, stored), never
// asked of the model.
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// SHARED TYPES  (consumed by ActivityGenerator.tsx)
// ─────────────────────────────────────────────────────────────────────────────

/** Part 2A — Vocabulary Hunt. Student reads the clue and writes the word found in the passage. */
export interface VocabHuntItem {
  word: string;
  pos: string;
  hint?: string;
  definition: string;
}

/** Part 2B — Matching. A different set of words from the passage, paired to definitions a–e. */
export interface MatchItem {
  word: string;
  pos: string;
  definition: string;
}

/** Part 2C — Fill the Gaps. One sentence with a single ___; the answer is a passage word. */
export interface GapItem {
  sentence: string;
  answer: string;
}

/** A bank decoy for Fill the Gaps (2C). Same POS family, related theme, never a correct answer. */
export interface Distractor {
  word: string;
  pos: string;
}

/**
 * The full Part 2 payload, produced in ONE call so the model can keep all groups distinct.
 * hunt / matching / gap-answers / distractor words are ALL mutually unique.
 */
export interface VocabularyPart {
  hunt: VocabHuntItem[];
  matching: MatchItem[];
  gaps: GapItem[];
  distractors: Distractor[];
}

export interface TFItem {
  q: string;
  answer: 'True' | 'False';
}

export interface QAItem {
  q: string;
  answer: string; 
}

/** Part 4 — Grammar Noticing (guided discovery). */
export interface GrammarNoticing {
  grammarPoint: string;
  targetSentences: string[];
  observationQuestions: string[];
  ruleText: string;
  practice: QAItem[];
}

// ── QUICK MODE (Mode 2, no passage) — standalone activity shapes ──────────────

/** A presented vocabulary entry (the words are TAUGHT, not hunted from a text). */
export interface GlossaryItem {
  word: string;
  pos: string;
  definition: string;
  example: string;
}

/** One drill block inside a Quick sheet. */
export interface GrammarExercise {
  title: string;
  instruction: string;
  items: QAItem[];
}

/** Quick Vocabulary: present words/structures, then varied flexible drills. */
export interface QuickVocabActivity {
  theme: string;
  glossary: GlossaryItem[];
  exercises: GrammarExercise[];
}

/** Quick Grammar: a short reminder, then varied drills. NOT a noticing lesson. */
export interface QuickGrammarActivity {
  grammarPoint: string;
  rule: string;
  examples: string[];
  exercises: GrammarExercise[];
}

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER LAYER
// ─────────────────────────────────────────────────────────────────────────────

// Set whenever a provider call is throttled (HTTP 429 / quota exhausted). The UI
// reads this right after a failed generation to show a "rate-limited, wait"
// message instead of a generic failure. Reset at the start of every callAI.
let _lastRateLimited = false;
export function wasRateLimited(): boolean { return _lastRateLimited; }

async function callGemini(prompt: string, supabaseUrl: string, anonKey: string): Promise<string | null> {
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/ask-gemini`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${anonKey}` },
      body:    JSON.stringify({ prompt }),
    });
    if (res.status === 429) { _lastRateLimited = true; console.warn('⚠️ Gemini rate-limited (429) — trying Groq.'); return null; }
    if (!res.ok) { console.warn(`⚠️ Gemini returned ${res.status} — trying Groq.`); return null; }
    const data = await res.json();
    if (data.error?.status === 'RESOURCE_EXHAUSTED') { _lastRateLimited = true; console.warn('⚠️ Gemini quota exhausted — switching to Groq.'); return null; }
    if (
      data.promptFeedback?.blockReason ||
      !data.candidates?.length
    ) { console.warn('⚠️ Gemini blocked/empty — switching to Groq.'); return null; }
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) { console.warn('⚠️ Gemini returned empty — trying Groq.'); return null; }
    console.log('✅ Gemini responded.');
    return text;
  } catch (err) { console.warn('⚠️ Gemini error:', err); return null; }
}

async function callGroq(prompt: string, supabaseUrl: string, anonKey: string): Promise<string | null> {
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/ask-groq`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${anonKey}` },
      body:    JSON.stringify({ prompt }),
    });
    if (res.status === 429) { _lastRateLimited = true; console.error('🚨 Groq rate-limited (429).'); return null; }
    if (!res.ok) { console.error(`🚨 Groq returned ${res.status}.`); return null; }
    const data = await res.json();
    const text = data.text?.trim();
    if (!text) { console.error('🚨 Groq returned empty.'); return null; }
    console.log('✅ Groq responded (fallback).');
    return text;
  } catch (err) { console.error('🚨 Groq error:', err); return null; }
}

async function callAI(prompt: string): Promise<string | null> {
  _lastRateLimited = false;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey     = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) { console.error('🚨 Supabase keys missing.'); return null; }
  return (await callGemini(prompt, supabaseUrl, anonKey)) ?? (await callGroq(prompt, supabaseUrl, anonKey));
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

function extractJSON(raw: string): any {
  const stripped = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/,      '')
    .replace(/\s*```$/,      '')
    .trim();
  const start = stripped.indexOf('{');
  const end   = stripped.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object found in AI response.');
  return JSON.parse(stripped.slice(start, end + 1));
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function sanitize(text: string): string {
  return text.replace(/[\n\r\t]+/g, ' ').replace(/"/g, "'").trim();
}

function sanitizePassage(text: string): string {
  return text
    .replace(/`/g, "'")
    .replace(/"/g, "'")
    .replace(/\\/g, ' ')
    .replace(/[\r\n]+/g, ' ')
    .trim();
}

/**
 * Light-sanitise a passage while PRESERVING paragraph boundaries, and label each
 * paragraph ("Paragraph 1: ...") so question generators can cite them by number.
 * sanitizePassage() flattens all newlines, which is why comprehension needs this.
 */
function numberParagraphs(passage: string): string {
  const byBlank = passage.split(/\n{2,}/).map((p) => p.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const parts = byBlank.length > 1
    ? byBlank
    : passage.split(/\n+/).map((p) => p.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const clean = (parts.length ? parts : [passage]).map((p) =>
    p.replace(/`/g, "'").replace(/"/g, "'").replace(/\\/g, ' ').trim()
  );
  return clean.map((p, i) => `Paragraph ${i + 1}: ${p}`).join('\n\n');
}

function wordInText(word: string, text: string): boolean {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return false;
  const t = text.toLowerCase();
  if (t.includes(w)) return true;
  const stem = w.slice(0, Math.max(4, w.length - 3));
  return t.includes(stem);
}

async function requestJSON<T>(
  prompt:   string,
  validate: (parsed: any) => T | null,
  retries = 1
): Promise<T | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    // Escalating pause between attempts — rapid-fire retries trip provider
    // rate limits (Groq 429s) and burn quota for nothing. Back off much harder
    // when the last call was actually throttled, to let the limit window clear.
    if (attempt > 0) {
      const base = _lastRateLimited ? 4000 : 1500;
      await new Promise((r) => setTimeout(r, base * attempt));
    }
    const text = await callAI(prompt);
    if (!text) continue;
    try {
      const parsed = extractJSON(text);
      const result = validate(parsed);
      if (result) return result;
      console.warn(`⚠️ Validation failed (attempt ${attempt + 1}/${retries + 1}).`);
    } catch (err) {
      console.error(`🚨 JSON parse failed (attempt ${attempt + 1}/${retries + 1}):`, err);
    }
  }
  return null;
}

function getLevelGuidance(level: string): string {
  const map: Record<string, string> = {
    A1: 'Use only the 500 most common English words. Present simple and "to be" only. Maximum 8 words per sentence. Concrete, everyday topics only. No idioms.',
    A2: 'Simple present and past tense only. Short, clear sentences (10-12 words). Common vocabulary. Familiar, everyday contexts. Avoid idioms.',
    B1: 'Mix of tenses including present perfect and future. Moderate sentence complexity. Some idiomatic expressions. Varied but accessible vocabulary. Compound sentences allowed.',
    B2: 'Complex sentences with subordinate clauses. Nuanced vocabulary. Academic and professional register acceptable. Abstract topics allowed. Phrasal verbs and collocations natural here.',
    C1: 'Sophisticated syntax. Advanced idiomatic and academic vocabulary. Complex arguments and implied meaning. Near-native structures. Rhetorical devices appropriate.',
    C2: 'Full native-level complexity. Rare and nuanced vocabulary. Subtle stylistic and rhetorical features. No simplification whatsoever.',
  };
  return map[level] ?? map['B1'];
}

function getQuestionSchema(activityType: string): { schema: string; rules: string } {
  const schemas: Record<string, { schema: string; rules: string }> = {
    'Multiple Choice': {
      schema: `{"q":"Question stem?","options":["A","B","C","D"],"answer":"Exact text of correct option"}`,
      rules:  'No letter labels inside options. "answer" must be the EXACT full text of the correct option, never a letter. All 4 options must be plausible.',
    },
    'Synonyms (MC)': {
      schema: `{"q":"Which word is closest in meaning to [word]?","options":["w1","w2","w3","w4"],"answer":"Exact text of correct synonym"}`,
      rules:  'No letter labels inside options. "answer" must be the EXACT text of the correct synonym. Distractors must be related but NOT synonyms.',
    },
    'True/False': {
      schema: `{"q":"A clear factual statement.","answer":"True"}`,
      rules:  'No options array. "answer" must be EXACTLY "True" or "False". Mix True and False evenly. Every statement must be unambiguous.',
    },
    'Short Answer': {
      schema: `{"q":"Open-ended question?","answer":"Model answer for teacher key."}`,
      rules:  'No options array. Questions must require genuine comprehension. "answer" is a model answer for the teacher key only.',
    },
    'Fill in the Blanks': {
      schema: `{"q":"Sentence with ___ blank.","answer":"missingword"}`,
      rules:  'No options array. Blank must appear as exactly ___ in the sentence. "answer" is ONLY the missing word, never the full sentence. One blank per sentence.',
    },
    'Correct the Errors': {
      schema: `{"q":"Sentence with one grammar error.","answer":"Complete corrected sentence."}`,
      rules:  'No options array. EXACTLY one error per sentence. "answer" is the COMPLETE corrected sentence.',
    },
    'Matching Definitions': {
      schema: `{"q":"vocabulary term","answer":"Clear definition."}`,
      rules:  'No options array. "q" is the term only. "answer" must NOT contain the target word or its derivatives.',
    },
  };
  return schemas[activityType] ?? schemas['Multiple Choice'];
}

function validateQuestions(questions: any[], activityType: string, numQ: number): boolean {
  if (!Array.isArray(questions) || questions.length < numQ) {
    console.warn(`⚠️ Expected ${numQ} questions, got ${questions?.length ?? 0}.`);
    return false;
  }
  for (const q of questions) {
    if (!q.q || typeof q.q !== 'string' || q.q.trim().length < 5) return false;
    switch (activityType) {
      case 'Multiple Choice':
      case 'Synonyms (MC)':
        if (!Array.isArray(q.options) || q.options.length < 3) return false;
        if (!q.answer || !q.options.includes(q.answer))        return false;
        break;
      case 'True/False':
        if (q.answer !== 'True' && q.answer !== 'False') return false;
        break;
      case 'Fill in the Blanks':
        if (!q.q.includes('___'))                      return false;
        if (!q.answer || typeof q.answer !== 'string') return false;
        break;
      case 'Correct the Errors':
      case 'Short Answer':
      case 'Matching Definitions':
        if (!q.answer || typeof q.answer !== 'string' || q.answer.trim().length < 2) return false;
        break;
    }
  }
  return true;
}// ═════════════════════════════════════════════════════════════════════════════
// STRUCTURED-WORKSHEET GENERATORS  (used by the redesigned Activity Generator)
// ═════════════════════════════════════════════════════════════════════════════

export async function generateLessonPassage(
  topic: string,
  level = 'B1',
  words = 200,
  grammarFocus = ''
): Promise<string | null> {
  return generateReadingPassage(sanitize(topic), level, words, grammarFocus);
}

export async function generateTrueFalse(
  passage: string,
  level = 'B1'
): Promise<TFItem[] | null> {
  const safePassage = sanitizePassage(passage);
  const prompt = `You are an expert ESL textbook author. Based ONLY on the passage below, write EXACTLY 5 True/False statements at ${level} CEFR level.

LEVEL (${level}): ${getLevelGuidance(level)}

RULES:
- Mix True and False roughly evenly (do not make them all True).
- Each statement must be unambiguously decidable from the passage alone.
- Do NOT copy sentences verbatim from the passage — rephrase them.
- Make EXACTLY ONE of the five statements an inference about the author's overall stance or opinion (what the author believes, suggests, or implies) rather than a directly stated fact — but it must still be clearly decidable as True or False from the passage.
- "answer" must be EXACTLY "True" or "False".

Passage:
"""
${safePassage}
"""

Output ONLY valid JSON, no markdown, no backticks:
{"items":[{"q":"statement","answer":"True"}]}
The items array must contain EXACTLY 5 statements.`;

  return requestJSON<TFItem[]>(prompt, (p) => {
    const items = p?.items;
    if (!Array.isArray(items) || items.length < 5) return null;
    const five = items.slice(0, 5).map((it: any) => ({
      q: String(it.q ?? '').trim(),
      answer: (it.answer === 'False' ? 'False' : 'True') as 'True' | 'False',
    }));
    if (five.some((it) => it.q.length < 5)) return null;
    return five;
  });
}

export async function generateComprehensionQuestions(
  passage: string,
  level = 'B1'
): Promise<QAItem[] | null> {
  const numbered = numberParagraphs(passage);
  const prompt = `You are an expert ESL textbook author. Based on the passage below, write EXACTLY 5 open comprehension questions at ${level} CEFR level.

LEVEL (${level}): ${getLevelGuidance(level)}

RULES:
- Questions require genuine understanding, not single-word lookup.
- Students will answer in FULL SENTENCES, so phrase questions accordingly (why / how / what evidence / in what way).
- Each question must EITHER refer to a specific paragraph by number (e.g. "In paragraph 2, ...") OR quote a short exact phrase from the passage (3-6 words, in quotation marks), the way a real comprehension worksheet does. Use a mix of both across the five questions.
- Provide a model full-sentence "answer" for the teacher key.
- Answerable from the passage.

Passage (paragraphs are labelled so you can refer to them by number):
"""
${numbered}
"""

Output ONLY valid JSON, no markdown, no backticks:
{"items":[{"q":"question?","answer":"Model full-sentence answer."}]}
The items array must contain EXACTLY 5 questions.`;

  return requestJSON<QAItem[]>(prompt, (p) => {
    const items = p?.items;
    if (!Array.isArray(items) || items.length < 5) return null;
    const five = items.slice(0, 5).map((it: any) => ({
      q: String(it.q ?? '').trim(),
      answer: String(it.answer ?? '').trim(),
    }));
    // Reject half-written questions (e.g. "What evidence" or a bare quoted
    // fragment). A real question is a few words long and either ends with "?"
    // or opens with a question/imperative stem; the model answer must be a
    // proper sentence, not a stub.
    const isRealQuestion = (q: string) => {
      const t = q.trim();
      const words = t.split(/\s+/).filter(Boolean).length;
      if (words < 4 || t.length < 12) return false;
      return /\?\s*$/.test(t) ||
        /^(explain|describe|discuss|summari[sz]e|why|how|what|in what way|in which|give|list|identify)\b/i.test(t);
    };
    if (five.some((it) => !isRealQuestion(it.q) || it.answer.length < 10)) return null;
    return five;
  });
}

function wordStem(word: string): string {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  return w.length <= 4 ? w : w.slice(0, w.length - 3);
}

export async function generateVocabularySet(
  source: string,           
  level = 'B1',
  fromPassage = true
): Promise<VocabularyPart | null> {
  const safeSource = sanitizePassage(source);

  // Scale demand to supply: a short passage simply doesn't contain 15
  // teachable words from 15 distinct families. Theme mode (invented words)
  // has no scarcity, so it always uses the full size.
  const wc = fromPassage ? countWords(safeSource) : Infinity;
  // Hunt and Matching scale with passage length; Gaps is fixed at 4 (the
  // classroom standard) whenever the passage is long enough to support it.
  const perGroup   = wc >= 400 ? 5 : wc >= 250 ? 4 : 3;
  const huntCount  = perGroup;
  const matchCount = perGroup;
  const gapCount   = perGroup >= 4 ? 4 : perGroup;
  const nDist = perGroup >= 4 ? 3 : 2;
  const total = huntCount + matchCount + gapCount;

  const selectionBlock = fromPassage
    ? `Choose all ${total} vocabulary words (${huntCount} for Hunt + ${matchCount} for Matching + ${gapCount} for Gaps) from the PASSAGE below.
- Every chosen word MUST actually appear in the passage.
- Choose useful, teachable words — never proper nouns, never the easiest function words.
- The ${total} words must ALL be different from one another — AND from ${total} DIFFERENT WORD FAMILIES. Passages often repeat families (write/wrote/writing, influence/influenced/influential, philosophy/philosophical): pick AT MOST ONE word from any family. Before answering, check your ${total} words pairwise for shared roots and replace any clashes.
- SENSE MATCH: define each word by the meaning AND part of speech it ACTUALLY carries in this passage. Do NOT pick a word that appears only inside a fixed phrase, compound, or technical term (e.g. "augmented" only in "augmented reality", "mirror" only in "mirror system", "memory" only in "memory bank", "contrast" only in "by contrast") and then test its everyday standalone sense or a different part of speech. The definition and the "pos" tag must match exactly how the word is used in this text; if they cannot, choose a different word.

Passage:
"""
${safeSource}
"""`
    : `Invent ${total} useful vocabulary words (${huntCount} for Hunt + ${matchCount} for Matching + ${gapCount} for Gaps) for a ${level} learner on the theme: "${safeSource}".
- All ${total} words must be different from one another (no shared roots).`;

  const prompt = `You are an expert ESL vocabulary materials writer.

${selectionBlock}

LEVEL (${level}): ${getLevelGuidance(level)}

Produce THREE separate groups. A word may appear in ONLY ONE group — never reuse a word (or its root) across groups.

1) "hunt" — EXACTLY ${huntCount} items, each:
   - "word": the target word.
   - "pos": short tag, one of: v. | n. | adj. | adv. | phr.
   - "hint": OPTIONAL short morphological clue ONLY when it genuinely helps (e.g. "ending in -ed", "plural"). Omit it entirely (empty string) when the POS alone is enough. Never include the word or its root in the hint.
   - "definition": a clear full definition that does NOT contain the word or any derivative.

2) "matching" — EXACTLY ${matchCount} items, using ${matchCount} DIFFERENT words, each:
   - "word", "pos" (same tag set), and "definition" (does NOT contain the word).

3) "gaps" — EXACTLY ${gapCount} items, using ${gapCount} DIFFERENT words again, each:
   - "sentence": an original sentence (NOT copied from the passage) with exactly one ___ where the word goes.
   - "answer": the word that fills the blank. Context must make it the only word from the bank that fits.
   - CRITICAL — the answer must FIT: read the finished sentence with the answer in place and confirm it is grammatical, true, and sensible. Never pair a word with a slot it does not belong in (e.g. NOT "harvest the patient's records", NOT "produce the math problem", NOT "roll a new product line"). If the natural sentence for that word does not come easily, choose a different word rather than forcing a nonsensical one.

Then "distractors" — EXACTLY ${nDist} decoy words:
   - "word", "pos". Same POS family as the gap answers, thematically related.
   - CRITICAL: each distractor must be clearly wrong in EVERY gap sentence, not only its own. Before finalising, test each distractor against ALL ${gapCount} gap sentences — if it could plausibly fill any of them (even loosely, e.g. "app" in "she keeps her notes on the ___"), discard it and pick another. It must also not duplicate any of the ${total} words.

Output ONLY valid JSON, no markdown, no backticks:
{"hunt":[{"word":"","pos":"","hint":"","definition":""}],"matching":[{"word":"","pos":"","definition":""}],"gaps":[{"sentence":"... ___ ...","answer":""}],"distractors":[{"word":"","pos":""}]}
"hunt" EXACTLY ${huntCount}; "matching" EXACTLY ${matchCount}; "gaps" EXACTLY ${gapCount}; "distractors" EXACTLY ${nDist}.`;

  return requestJSON<VocabularyPart>(prompt, (p) => {
    const huntRaw  = p?.hunt;
    const matchRaw = p?.matching;
    const gapRaw   = p?.gaps;
    const distRaw  = p?.distractors;
    if (!Array.isArray(huntRaw)  || huntRaw.length  < huntCount)  return null;
    if (!Array.isArray(matchRaw) || matchRaw.length < matchCount) return null;
    if (!Array.isArray(gapRaw)   || gapRaw.length   < gapCount)   return null;
    if (!Array.isArray(distRaw)  || distRaw.length  < nDist)      return null;

    const hunt: VocabHuntItem[] = huntRaw.slice(0, huntCount).map((t: any) => {
      const hint = String(t.hint ?? '').trim();
      return {
        word:       String(t.word ?? '').trim(),
        pos:        String(t.pos ?? '').trim(),
        ...(hint ? { hint } : {}),
        definition: String(t.definition ?? '').trim(),
      };
    });

    const matching: MatchItem[] = matchRaw.slice(0, matchCount).map((m: any) => ({
      word:       String(m.word ?? '').trim(),
      pos:        String(m.pos ?? '').trim(),
      definition: String(m.definition ?? '').trim(),
    }));

    const gaps: GapItem[] = gapRaw.slice(0, gapCount).map((g: any) => ({
      sentence: String(g.sentence ?? '').trim(),
      answer:   String(g.answer ?? '').trim(),
    }));

    const distractors: Distractor[] = distRaw.slice(0, nDist).map((d: any) => ({
      word: String(d.word ?? '').trim(),
      pos:  String(d.pos ?? '').trim(),
    }));

    for (const h of hunt) {
      if (!h.word || !h.pos || !h.definition) return null;
      if (h.definition.toLowerCase().includes(h.word.toLowerCase())) return null;
    }
    for (const m of matching) {
      if (!m.word || !m.pos || !m.definition) return null;
      if (m.definition.toLowerCase().includes(m.word.toLowerCase())) return null;
    }
    for (const g of gaps) {
      if (!g.answer || !g.sentence.includes('___')) return null;
      if (g.sentence.toLowerCase().includes(g.answer.toLowerCase())) return null;
    }
    if (distractors.some((d) => !d.word || !d.pos)) return null;

    // Tiered word-family rule. Same-root collisions are only FATAL when they
    // break an exercise: two words inside the SAME group, or a distractor
    // sharing a root with a gap answer (ambiguous word box). Cross-exercise
    // overlap (e.g. a hunt word and a gap word from one family) is accepted
    // with a warning — free fallback models rarely achieve 15 distinct roots.
    // REPAIR duplicates instead of rejecting: weak fallback models reuse words
    // across exercises constantly. Keep the FIRST occurrence (priority:
    // hunt > matching > gaps > distractors) and silently drop later copies —
    // a slightly smaller exercise beats a failed generation.
    const seenSurface = new Set<string>();
    const keepUnique = <T,>(arr: T[], word: (t: T) => string): T[] =>
      arr.filter((t) => {
        const k = word(t).toLowerCase();
        if (!k || seenSurface.has(k)) return false;
        seenSurface.add(k);
        return true;
      });
    const huntU        = keepUnique(hunt, (h) => h.word);
    const matchingU    = keepUnique(matching, (m) => m.word);
    const gapsU        = keepUnique(gaps, (g) => g.answer);
    const distractorsU = keepUnique(distractors, (d) => d.word);
    const droppedCount =
      (hunt.length - huntU.length) + (matching.length - matchingU.length) +
      (gaps.length - gapsU.length) + (distractors.length - distractorsU.length);
    if (droppedCount > 0) console.warn(`ℹ️ Repaired ${droppedCount} duplicated word(s) across exercises.`);

    // Only reject if the repair gutted an exercise. Duplicates concentrate in
    // gaps (models reuse hunt words there), so gaps tolerates more shrinkage.
    const minHunt  = Math.max(2, huntCount - 1);
    const minMatch = Math.max(2, matchCount - 1);
    const minGap   = Math.max(2, gapCount - 1);
    if (huntU.length < minHunt || matchingU.length < minMatch || gapsU.length < minGap || distractorsU.length < 2) {
      console.warn('⚠️ Too many duplicated words to repair — retrying.');
      return null;
    }

    const labeledU = [
      ...huntU.map((h) => ({ w: h.word, g: 'hunt' })),
      ...matchingU.map((m) => ({ w: m.word, g: 'matching' })),
      ...gapsU.map((g) => ({ w: g.answer, g: 'gaps' })),
      ...distractorsU.map((d) => ({ w: d.word, g: 'distractors' })),
    ];
    const byStem = new Map<string, string[]>();
    for (const { w, g } of labeledU) {
      const s = wordStem(w);
      byStem.set(s, [...(byStem.get(s) || []), g]);
    }
    let softOverlap = false;
    for (const groups of byStem.values()) {
      if (groups.length < 2) continue;
      const withinSameGroup = new Set(groups).size < groups.length;
      const boxAmbiguity = groups.includes('gaps') && groups.includes('distractors');
      if (withinSameGroup || boxAmbiguity) {
        console.warn('⚠️ Word-family collision breaks an exercise — retrying.');
        return null;
      }
      softOverlap = true;
    }
    if (softOverlap) console.warn('ℹ️ Cross-exercise word-family overlap accepted (model limitation).');

    if (fromPassage) {
      const shouldAppear = [...huntU.map((h) => h.word), ...matchingU.map((m) => m.word), ...gapsU.map((g) => g.answer)];
      const missing = shouldAppear.filter((w) => !wordInText(w, safeSource));
      if (missing.length) {
        // Hard reject: a Hunt word absent from the passage makes the exercise
        // impossible, and gap/matching words from outside the text make the
        // lesson incoherent (students study X, then drill Y).
        console.warn(`⚠️ Vocab words not found verbatim in passage — retrying: ${missing.join(', ')}`);
        return null;
      }
    }

    return { hunt: huntU, matching: matchingU, gaps: gapsU, distractors: distractorsU };
  }, 3); // 4 attempts — the no-shared-roots constraint is the hardest in the app,
         // and the Groq fallback needs more tries than Gemini to satisfy it
}

export async function generateDiscussion(
  source: string,          
  level = 'B1'
): Promise<string[] | null> {
  const safeSource = sanitizePassage(source);
  const prompt = `You are an expert ESL discussion-task writer. Write EXACTLY 2 discussion questions at ${level} CEFR level, connected to the THEME of the text below.

LEVEL (${level}): ${getLevelGuidance(level)}

RULES:
- Each question must be substantial and TWO-PART: open with a sentence or two of framing that sets up a tension or scenario, then ask a pointed question that genuinely has two defensible sides.
- Connect the theme to the students' own modern lives — their technology, daily choices, society, or personal experience.
- No single correct answer, and not answerable directly from the text. Each must invite extended speaking or writing and a real personal opinion.
- The two questions must explore DIFFERENT angles on the theme.

Text / theme:
"""
${safeSource}
"""

Output ONLY valid JSON, no markdown, no backticks:
{"items":["framing sentence(s) + pointed question?","framing sentence(s) + pointed question?"]}
The items array must contain EXACTLY 2 questions, each a single string holding both the framing and the question.`;

  return requestJSON<string[]>(prompt, (p) => {
    const items = p?.items;
    if (!Array.isArray(items) || items.length < 2) return null;
    const two = items.slice(0, 2).map((q: any) => String(q ?? '').trim());
    if (two.some((q) => q.length < 40)) return null;
    return two;
  });
}

export async function generateGrammarNoticing(
  grammarPoint: string,
  level = 'B1',
  passage?: string          
): Promise<GrammarNoticing | null> {
  const point = sanitize(grammarPoint);
  const sourceBlock = passage
    ? `Wherever possible, draw the Step 1 target sentences from this passage (you may lightly adapt them so the structure is clear). If the structure does not appear, write clear new examples.

Passage:
"""
${sanitizePassage(passage)}
"""`
    : `Write clear, original example sentences that display the structure.`;

  const prompt = `You are an expert ESL grammar materials writer using guided-discovery (noticing) methodology.

Create a 4-step Grammar Noticing activity on: "${point}" at ${level} CEFR level.
LEVEL (${level}): ${getLevelGuidance(level)}

${sourceBlock}

Produce these 4 steps:
- "targetSentences": 3-4 example sentences that clearly display the structure of "${point}".
- "observationQuestions": 2-3 questions that prompt students to NOTICE the form (e.g. "Which form of the verb follows ...?"). Do NOT state the rule for them.
- "ruleText": ONE rule statement with 1-3 blanks written as ___ for students to complete and derive the rule themselves.
- "practice": EXACTLY 4 controlled-practice items testing "${point}". Each is either a fill-in-the-blank (use ___) or an error-correction sentence, with a model "answer".

Output ONLY valid JSON, no markdown, no backticks:
{"targetSentences":["..."],"observationQuestions":["..."],"ruleText":"... ___ ...","practice":[{"q":"...","answer":"..."}]}`;

  return requestJSON<GrammarNoticing>(prompt, (p) => {
    const targetSentences      = Array.isArray(p?.targetSentences)      ? p.targetSentences.map((s: any) => String(s).trim()).filter(Boolean) : [];
    const observationQuestions = Array.isArray(p?.observationQuestions) ? p.observationQuestions.map((s: any) => String(s).trim()).filter(Boolean) : [];
    const ruleText             = String(p?.ruleText ?? '').trim();
    const practiceRaw          = Array.isArray(p?.practice) ? p.practice : [];

    if (targetSentences.length < 2)      return null;
    if (observationQuestions.length < 1) return null;
    if (!ruleText)                       return null;
    if (practiceRaw.length < 4)          return null;

    const practice: QAItem[] = practiceRaw.slice(0, 4).map((it: any) => ({
      q: String(it.q ?? '').trim(),
      answer: String(it.answer ?? '').trim(),
    }));
    if (practice.some((it) => it.q.length < 3 || it.answer.length < 1)) return null;

    return { grammarPoint: point, targetSentences, observationQuestions, ruleText, practice };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// QUICK MODE — standalone activities (no passage)
// These never reference "the text"; words/structures are taught directly.
// ─────────────────────────────────────────────────────────────────────────────

/** Quick Vocabulary: Format-aware engine with teacher override and few-shot formatting. */
export async function generateQuickVocab(
  theme: string,
  level = 'B1',
  customFocus: string = ''
): Promise<QuickVocabActivity | null> {
  const safeTheme = sanitize(theme);
  const focusInstruction = customFocus ? `\nCRITICAL TEACHER INSTRUCTION: ${customFocus}\nYou MUST strictly follow this instruction above all other stylistic choices.` : '';

  const prompt = `You are an expert ESL vocabulary materials writer. Build a STANDALONE vocabulary worksheet on the topic: "${safeTheme}" at ${level} CEFR level. NO reading passage.

LEVEL (${level}): ${getLevelGuidance(level)}
${focusInstruction}

CRITICAL TOPIC RULE: The topic ("${safeTheme}") might be a semantic theme (e.g., "Environment") OR a morphological/lexical structure (e.g., "Suffixes", "Phrasal Verbs"). 
- If semantic, provide 8 related words.
- If structural, provide 8 words demonstrating the structure, and highlight how the structure changes meaning.
- CRITICAL LINGUISTIC RULE: Every single sentence generated MUST be grammatically perfect. Check the required part of speech for every single blank before writing the sentence.

FORMATTING EXAMPLES (MIMIC THESE EXACTLY IN THE "q" FIELD):
- For standard Gap-Fill: "He was very ___ with his money." (DO NOT generate a word bank text in the prompt. The UI already handles the word bank at the top of the page).
- For inline Multiple Choice: "If you don't know the word, you should ___ in a dictionary. (look it up / point it out / put it off)" (Provide EXACTLY 3 or 4 plausible options inside the parentheses, NOT all 8 words).
- For Affixes/Word Formation: "The ___ (hope) in her eyes was inspiring."
- For Sentence Transformation: "The box is empty; it has no ___ (use)."

Produce JSON:
1. "glossary": EXACTLY 8 words. For each: "word", "pos", "definition", and a natural "example".
2. "exercises": 2-3 DIFFERENT exercise types that drill these words. 
   - CRITICAL RENDERER RULE: Choose ONLY linear list formats matching the examples above. Do NOT use matching columns or tables. Do NOT repeat the same exercise type twice.
   - For EACH exercise: a short "title", a one-line "instruction", and EXACTLY 5-6 "items". Each item has "q" (the formatted prompt) and "answer".

Output ONLY valid JSON, no markdown, no backticks:
{"glossary":[{"word":"","pos":"","definition":"","example":""}],"exercises":[{"title":"","instruction":"","items":[{"q":"","answer":""}]}]}`;

  return requestJSON<QuickVocabActivity>(prompt, (p) => {
    const glossary = Array.isArray(p?.glossary) ? p.glossary : [];
    const exercisesRaw = Array.isArray(p?.exercises) ? p.exercises : [];
    
    if (glossary.length < 6 || exercisesRaw.length < 2) return null;

    const exercises: GrammarExercise[] = exercisesRaw.map((ex: any) => ({
      title: String(ex?.title ?? '').trim(),
      instruction: String(ex?.instruction ?? '').trim(),
      items: (Array.isArray(ex?.items) ? ex.items : []).map((it: any) => ({
        q: String(it?.q ?? '').trim(),
        answer: String(it?.answer ?? '').trim(),
      })).filter((it: QAItem) => it.q.length > 1 && it.answer.length > 0)
    })).filter((ex: GrammarExercise) => ex.title.length > 0 && ex.items.length >= 4);

    if (exercises.length < 2) return null;

    return { theme: safeTheme, glossary: glossary.slice(0, 8), exercises };
  });
}

/** Quick Grammar: Format-aware engine with context locks and few-shot formatting. */
export async function generateQuickGrammar(
  grammarPoint: string,
  level = 'B1',
  customFocus: string = ''
): Promise<QuickGrammarActivity | null> {
  const point = sanitize(grammarPoint);
  const focusInstruction = customFocus ? `\nCRITICAL TEACHER INSTRUCTION: ${customFocus}\nYou MUST strictly follow this instruction for every exercise.` : '';

  const prompt = `You are an expert ESL grammar materials writer. Build a STANDALONE, PRACTICE-FOCUSED grammar worksheet on "${point}" at ${level} CEFR level.

LEVEL (${level}): ${getLevelGuidance(level)}
${focusInstruction}

CRITICAL ISOLATION RULE: Strictly isolate "${point}". Do NOT introduce contrasting advanced tenses (e.g., do not use Past Perfect if asked for Past Simple) unless explicitly requested.
CRITICAL CONTEXT RULE: Do not write sterile, floating sentences. Every single item MUST include rich context clues (specific time markers, semantic context, or mini-dialogues A/B) that makes the grammatical choice obvious and necessary.

FORMATTING EXAMPLES (MIMIC THESE EXACTLY IN THE "q" FIELD):
- For Verb Tense Gap Fill: "Although Maria usually ___ (take) the subway to the academy, this month she ___ (walk) to enjoy the spring weather."
- For Error Correction: "I will see the optometrist on Friday at 2:00 PM because I booked the appointment yesterday.\\nCorrection: "
- For Sentence Transformation: "Direct: Where did they leave the projector?\\nIndirect: I was wondering "
- For Inline Multiple Choice: "Despite the heavy rain, the hikers managed to reach the summit ___ noon. (in / at / on)"

Produce JSON:
- "rule": a concise 1-2 sentence reminder of how "${point}" works.
- "examples": 2-3 short model sentences.
- "exercises": 2-3 DIFFERENT exercise types formatted exactly like the examples above. Do NOT use matching columns or tables. Do NOT repeat the same exercise type twice. For EACH: a short "title", "instruction", and EXACTLY 5 "items" ("q" and "answer").

Output ONLY valid JSON, no markdown, no backticks:
{"rule":"","examples":["",""],"exercises":[{"title":"","instruction":"","items":[{"q":"","answer":""}]}]}`;

  return requestJSON<QuickGrammarActivity>(prompt, (p) => {
    const rule = String(p?.rule ?? '').trim();
    const examples = Array.isArray(p?.examples) ? p.examples : [];
    const exercisesRaw = Array.isArray(p?.exercises) ? p.exercises : [];

    if (!rule || examples.length < 2 || exercisesRaw.length < 2) return null;

    const exercises: GrammarExercise[] = exercisesRaw.map((ex: any) => ({
      title: String(ex?.title ?? '').trim(),
      instruction: String(ex?.instruction ?? '').trim(),
      items: (Array.isArray(ex?.items) ? ex.items : []).map((it: any) => ({
        q: String(it?.q ?? '').trim(),
        answer: String(it?.answer ?? '').trim(),
      })).filter((it: QAItem) => it.q.length > 1 && it.answer.length > 0)
    })).filter((ex: GrammarExercise) => ex.title.length > 0 && ex.items.length >= 4);

    if (exercises.length < 2) return null;

    return { grammarPoint: point, rule, examples: examples.slice(0, 3), exercises };
  });
}// ─────────────────────────────────────────────────────────────────────────────
// READING — STEP 1: Passage generation  (shared by legacy + structured paths)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Best-effort, presence-only detector for a handful of common grammar targets.
 * Returns a rough hit count, or null when the focus is one we cannot reliably
 * detect (in which case we trust the prompt rather than guess). This is NOT a
 * density gate: it only ever distinguishes "appears" from "absent", so it can
 * never push the model toward cramming the structure unnaturally.
 */
function countStructureHits(text: string, focus: string): number | null {
  const t = text.toLowerCase();
  const f = focus.toLowerCase();
  const count = (re: RegExp) => (t.match(re) || []).length;

  if (f.includes('past perfect'))    return count(/\bhad\s+(?:not\s+|never\s+)?\w+(?:ed|en)\b/g);
  if (f.includes('present perfect')) return count(/\b(?:has|have)\s+(?:not\s+|never\s+|already\s+|just\s+)?\w+(?:ed|en)\b/g);
  if (f.includes('past continuous') || f.includes('past progressive'))
                                     return count(/\b(?:was|were)\s+\w+ing\b/g);
  if (f.includes('present continuous') || f.includes('present progressive'))
                                     return count(/\b(?:am|is|are)\s+\w+ing\b/g);
  if (f.includes('future') || f.includes('will '))
                                     return count(/\bwill\s+\w+\b/g) + count(/\b(?:am|is|are)\s+going\s+to\s+\w+\b/g);
  if (f.includes('passive'))         return count(/\b(?:is|are|was|were|been|being)\s+\w+(?:ed|en)\b/g);
  if (f.includes('modal'))           return count(/\b(?:can|could|may|might|must|shall|should|would)\b/g);
  if (f.includes('conditional'))     return count(/\bif\b/g);
  if (f.includes('comparative') || f.includes('superlative'))
                                     return count(/\b\w+(?:er|est)\b/g) + count(/\b(?:more|most|less|least)\s+\w+\b/g);
  if (f.includes('relative'))        return count(/\b(?:who|which|that|whose|whom|where)\b/g);

  return null; // unknown / hard-to-detect focus -> trust the prompt
}

async function generateReadingPassage(
  topic:        string,
  level:        string,
  passageWords: number,
  grammarFocus = ''
): Promise<string | null> {
  const focus = sanitize(grammarFocus);

  const grammarBlock = focus
    ? `
GRAMMAR FOCUS — this lesson teaches "${focus}":
Make "${focus}" the natural backbone of the writing. Do NOT bolt it on or write to a quota. Instead, choose an angle on the topic where "${focus}" is genuinely the natural way to tell the story, so it recurs because the content calls for it (a topic about beliefs that were later overturned naturally uses the past perfect; a topic about an industry that has changed and is still changing naturally uses the present perfect).
- Naturalness ALWAYS wins. If using "${focus}" would make a sentence awkward, write the natural sentence instead, even if the structure then appears less often.
- Never distort a fact, a tense, or the meaning just to fit the structure.`
    : '';

  const prompt = `You are an expert ESL materials writer creating a reading passage for a ${level} CEFR learner on the topic: "${topic}"

YOUR FIRST JOB — the passage must be worth reading on its own. Write a short, genuinely educational piece of non-fiction that teaches ONE real, non-obvious idea about this topic — not a neutral summary and not a list of facts. The reader should finish it knowing something true and interesting they could repeat to a friend. Think like a sharp magazine science or culture writer, not an encyclopedia.

ABSOLUTE RULE — NO FABRICATION: Everything in the passage must be TRUE. Never invent people, studies, experiments, statistics, dates, quotes, or events. Use a specific name, date, or figure ONLY when it is a well-known fact you are confident is correct; otherwise stay general rather than inventing a specific. A slightly less vivid but true sentence is always better than a specific but false one. Do not manufacture precision (no made-up percentages, no invented researchers).

STRUCTURE — an idea with an arc, in 4-5 paragraphs:
- Open with a hook that unsettles a common assumption or raises something surprising about the topic.
- Develop the idea with real, concrete explanation — how it works, why it happens — using real, general examples the reader can picture.
- End with an implication that connects to the reader's own modern life.

LEVEL (${level}): ${getLevelGuidance(level)}
Aim for the upper end of this level: rich and engaging, but never above it.
${grammarBlock}

WRITE NATURAL, CORRECT ENGLISH:
- Every sentence must read naturally — never awkward, never padded.
- Use tenses correctly: for finished past events use past tenses (do not use the present perfect for completed historical events); reserve the present perfect for situations or effects that continue today.

WORD COUNT: about ${passageWords} words. A little over or under is fine; never pad with filler or vague generalities just to reach a number.

OUTPUT RULES:
- Output ONLY the passage text — no title, no heading, no word-count note, no commentary.
- Separate each paragraph with a blank line.
- Do not use bold, italics, underlining, or any markdown.
- Do not begin the passage with the word "The".`;

  // Soft validate-and-retry. A retry is only worth it on a clear miss — a much
  // too-short draft, or a requested structure that never appears — never a
  // density target, which would just push the model toward unnatural cramming.
  // The teacher approves every passage before building on it, so if the checks
  // can't be satisfied we return the best draft rather than failing outright.
  const minWords = Math.floor(passageWords * 0.7);
  let best: string | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    const text = await callAI(prompt);
    if (!text) continue;
    const clean = text.trim();
    best = clean;

    const wc = countWords(clean);
    const tooShort = wc < minWords;
    const hits = focus ? countStructureHits(clean, focus) : null;
    const grammarAbsent = hits !== null && hits === 0;

    if (!tooShort && !grammarAbsent) {
      console.log(`✅ Passage generated: ${wc} words (target ${passageWords})${focus ? `, "${focus}" detected: ${hits}` : ''}.`);
      return clean;
    }
    if (tooShort)      console.warn(`⚠️ Passage short (${wc} < ${minWords} words) — retrying.`);
    if (grammarAbsent) console.warn(`⚠️ Target structure "${focus}" not detected — retrying.`);
  }

  if (best) console.warn('ℹ️ Returning best-effort passage after retries.');
  return best;
}

// ─────────────────────────────────────────────────────────────────────────────
// READING — STEP 2: Question generation  (legacy free-form path)
// ─────────────────────────────────────────────────────────────────────────────

async function generateReadingQuestions(
  passage:      string,
  level:        string,
  activityType: string,
  numQ:         number
): Promise<any | null> {
  const { schema, rules } = getQuestionSchema(activityType);
  const safePassage = sanitizePassage(passage);

  const defaultInstructions: Record<string, string> = {
    'Multiple Choice': 'Read the passage carefully, then choose the best answer for each question.',
    'True/False':      'Read the passage carefully. Write True or False for each statement.',
    'Short Answer':    'Read the passage carefully, then answer each question using information from the text.',
  };

  const prompt = `You are an expert ESL textbook author. Generate exactly ${numQ} ${activityType} questions at ${level} CEFR level based on this passage:

"""
${safePassage}
"""

Rules: All questions must be answerable from the passage only. ${rules}

Output ONLY valid JSON, no markdown, no backticks:
{"title":"Reading Comprehension","instructions":"${defaultInstructions[activityType] ?? 'Complete the activity based on the passage.'}","questions":[${schema}]}

The questions array must contain EXACTLY ${numQ} items.`;

  const text = await callAI(prompt);
  if (!text) return null;

  try {
    const parsed = extractJSON(text);
    if (validateQuestions(parsed.questions, activityType, numQ)) return parsed;
    console.warn('⚠️ Reading questions failed validation.');
    return null;
  } catch (err) {
    console.error('🚨 Failed to parse reading questions JSON:', err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GRAMMAR ACTIVITY GENERATOR  (legacy free-form path)
// ─────────────────────────────────────────────────────────────────────────────

async function generateGrammarActivity(
  grammarPoint: string,
  level:        string,
  activityType: string,
  numQ:         number
): Promise<any | null> {
  const { schema, rules } = getQuestionSchema(activityType);

  const typeInstructions: Record<string, string> = {
    'Fill in the Blanks':  `Each blank must require the student to apply "${grammarPoint}". One blank per sentence marked as ___. IMPORTANT: Always include the base form of the verb in parentheses immediately after the blank, like this: "___ (to arrive)". The "answer" is the correctly conjugated form only. Vary sentence subjects and contexts.`,
    'Correct the Errors':  `Each sentence has EXACTLY ONE error related to "${grammarPoint}". Otherwise natural English. "answer" is the COMPLETE corrected sentence. Vary error position across items.`,
    'Multiple Choice':     `Each question tests "${grammarPoint}". All 4 options in the same grammatical category. Distractors represent real student errors. "answer" is the EXACT TEXT of the correct option.`,
  };

  const specific = typeInstructions[activityType] ?? typeInstructions['Multiple Choice'];

  const prompt = `You are an expert ESL grammar materials writer.

Create a ${level} CEFR Grammar activity on: "${grammarPoint}"
Type: ${activityType} | Items: ${numQ}
Level: ${getLevelGuidance(level)}

Activity rules: ${specific}
Output rules: ${rules}
Every item must directly test "${grammarPoint}". Use natural, varied sentences — no clichés.

Output ONLY valid JSON, no markdown:
{"title":"${grammarPoint} Practice","instructions":"[Specific instructions naming '${grammarPoint}']","questions":[${schema}]}

The questions array must contain EXACTLY ${numQ} items.`;

  const text = await callAI(prompt);
  if (!text) return null;

  try {
    const parsed = extractJSON(text);
    if (validateQuestions(parsed.questions, activityType, numQ)) return parsed;
    console.warn('⚠️ Grammar validation failed — retrying...');
    const retry = await callAI(prompt);
    if (!retry) return null;
    const retryParsed = extractJSON(retry);
    return retryParsed;
  } catch (err) {
    console.error('🚨 Failed to parse grammar JSON:', err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// VOCABULARY ACTIVITY GENERATOR  (legacy free-form path)
// ─────────────────────────────────────────────────────────────────────────────

async function generateVocabularyActivity(
  theme:        string,
  level:        string,
  activityType: string,
  numQ:         number
): Promise<any | null> {
  const { schema, rules } = getQuestionSchema(activityType);

  const typeInstructions: Record<string, string> = {
    'Matching Definitions': `Select ${numQ} useful ${level}-level words from the theme "${theme}". Definitions must be clear, not contain the target word, and be precise enough that only one word fits.`,
    'Fill in the Blanks':   `Select ${numQ} target words from "${theme}" at ${level} level. Each sentence must provide enough context for the target word to be the obvious choice. Blank marked as ___. "answer" is the target word only. No repeated words.`,
    'Synonyms (MC)':        `Select ${numQ} target words from "${theme}" at ${level} level. Correct option is a genuine synonym. 3 distractors are related but not synonymous. "answer" is the EXACT TEXT of the correct option.`,
  };

  const specific = typeInstructions[activityType] ?? typeInstructions['Matching Definitions'];

  const prompt = `You are an expert ESL vocabulary materials writer.

Create a ${level} CEFR Vocabulary activity on theme: "${theme}"
Type: ${activityType} | Items: ${numQ}
Level: ${getLevelGuidance(level)}

Activity rules: ${specific}
Output rules: ${rules}
All items must relate to "${theme}". Natural, authentic sentences only. No repeated words.

Output ONLY valid JSON, no markdown:
{"title":"Vocabulary: ${theme}","instructions":"[Clear instructions for this ${activityType} on '${theme}']","questions":[${schema}]}

The questions array must contain EXACTLY ${numQ} items.`;

  const text = await callAI(prompt);
  if (!text) return null;

  try {
    const parsed = extractJSON(text);
    if (validateQuestions(parsed.questions, activityType, numQ)) return parsed;
    console.warn('⚠️ Vocabulary validation failed — retrying...');
    const retry = await callAI(prompt);
    if (!retry) return null;
    const retryParsed = extractJSON(retry);
    return retryParsed;
  } catch (err) {
    console.error('🚨 Failed to parse vocabulary JSON:', err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT: generateWorksheetActivity  (legacy free-form — unchanged)
// ─────────────────────────────────────────────────────────────────────────────

export async function generateWorksheetActivity(
  skill:          string,
  level:          string,
  topicOrText:    string,
  activityType:   string,
  numQuestions:   number,
  inputMode:      'topic' | 'customText',
  includePassage: boolean,
  passageWords:   number = 150
): Promise<any | null> {
  try {
    const sourceText = sanitize(topicOrText);

    if (skill === 'Reading') {
      let passage: string;

      if (inputMode === 'customText') {
        passage = sourceText;
        console.log(`📄 Using custom text as passage (${countWords(passage)} words).`);
      } else {
        console.log(`📝 Generating ${passageWords}-word passage on "${sourceText}"...`);
        const generatedPassage = await generateReadingPassage(sourceText, level, passageWords);
        if (!generatedPassage) { console.error('🚨 Passage generation failed.'); return null; }
        passage = generatedPassage;
      }

      console.log(`❓ Generating ${numQuestions} ${activityType} questions from passage...`);
      let questionsData = await generateReadingQuestions(passage, level, activityType, numQuestions);

      if (!questionsData) {
        console.warn('⚠️ First attempt failed — retrying...');
        questionsData = await generateReadingQuestions(passage, level, activityType, numQuestions);
        if (!questionsData) { console.error('🚨 Reading generation failed after retry.'); return null; }
      }

      return { ...questionsData, passage };
    }

    if (skill === 'Grammar') {
      const grammarPoint = inputMode === 'customText'
        ? `Based on this text: "${sourceText.substring(0, 300)}"`
        : sourceText;
      return await generateGrammarActivity(grammarPoint, level, activityType, numQuestions);
    }

    if (skill === 'Vocabulary') {
      return await generateVocabularyActivity(sourceText, level, activityType, numQuestions);
    }

    console.error(`🚨 Unknown skill: "${skill}"`);
    return null;

  } catch (err) {
    console.error('🚨 generateWorksheetActivity error:', err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// generateExampleSentence  (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

export async function generateExampleSentence(
  word:  string,
  level: string = 'B2'
): Promise<string | null> {
  try {
    const prompt = `You are an expert ESL dictionary writer. Write one example sentence for "${word}" that:
- Is appropriate for ${level} CEFR: ${getLevelGuidance(level)}
- Makes the meaning clear from context
- Is natural and authentic (10-20 words)
- Does NOT begin with the word "${word}"

Output ONLY the sentence — no quotes, no explanation.`;

    const text = await callAI(prompt);
    return text ? text.replace(/^["']|["']$/g, '').trim() : null;
  } catch (err) {
    console.error('🚨 generateExampleSentence error:', err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// generateStudentFeedback — Dr. Chouit's voice
// ─────────────────────────────────────────────────────────────────────────────

const RESOURCE_POOL = `
- Grammar / tenses / prepositions: EnglishClub (excellent free grammar quizzes and explanations), Perfect English Grammar (clear rules and free exercises), Test-English.com
- Writing (structure, punctuation, academic style): Cambridge Write & Improve (instant free AI feedback), Hemingway App (free online editor for clarity), Purdue OWL (for academic structure and citations)
- Reading (comprehension, speed): Engoo Daily News (graded articles updated daily), Breaking News English, ReadTheory (adapts to their reading level automatically)
- Listening: Elllo.org (massive library of natural conversations with transcripts), BBC 6 Minute English, TED Talks (using the interactive transcript feature), Randall's ESL Cyber Listening Lab
- Speaking / pronunciation: YouGlish (search any word to hear native speakers use it in YouTube videos), Forvo (native pronunciation of isolated words), Rachel's English (YouTube for US pronunciation)
- Vocabulary: Oxford Learner's Dictionaries (essential for definitions and word class), Ozdic (free online collocation dictionary for natural word pairings), Vocabulary.com (for context and lists)`;

// Deterministic safety net. Free-tier models occasionally ignore prompt rules, so
// we tidy a few specific things in code. ONLY edits that cannot break grammar.
function tidyFeedback(raw: string): string {
  let t = raw.trim();

  // Safe filler removals (never load-bearing words).
  t = t
    .replace(/\bundoubtedly\s+/gi, '')
    .replace(/\bsignificant\s+(progress|improvement|strides|gains)\b/gi, '$1')
    .replace(/[ \t]{2,}/g, ' ');

  // Collapse a stacked forward-looking close
  const fwd = /^\s*(i['’]?m\s+(so\s+)?(excited|thrilled)|i\s+am\s+(so\s+)?(excited|thrilled)|i\s+can['’]?t\s+wait|i\s+look\s+forward|i['’]?m\s+looking\s+forward|i\s+hope)/i;
  const clause = /,\s*and\s+(?:i['’]?m\s+(?:so\s+)?(?:excited|thrilled)|i\s+am\s+(?:so\s+)?(?:excited|thrilled)|i\s+look\s+forward|i['’]?m\s+looking\s+forward|i\s+hope)\b[^.!?]*([.!?]+["'’)\]]*)\s*$/i;
  const paras = t.split(/\n{2,}/);
  const li = paras.length - 1;
  if (li >= 0) {
    const last = paras[li];
    const sentences = last.match(/[^.!?]+[.!?]+["'’)\]]*/g);
    if (sentences && sentences.length >= 2) {
      const rebuilt = sentences.join(' ').replace(/\s+/g, ' ').trim();
      const noLoss = rebuilt.replace(/\s/g, '').length >= last.replace(/\s/g, '').length - 2;
      const n = sentences.length;
      if (noLoss && fwd.test(sentences[n - 1].trim())) {
        if (fwd.test(sentences[n - 2].trim())) sentences.splice(n - 2, 1);
        else sentences[n - 2] = sentences[n - 2].replace(clause, '$1');
        paras[li] = sentences.join(' ').replace(/\s+/g, ' ').trim();
      }
    }
  }
  return paras.join('\n\n').trim();
}

export async function generateStudentFeedback(
  studentName:    string,
  assessment:     string,
  scores:         string,
  teacherNotes?:  string,
  percentToFinal?: string
): Promise<string> {

  const fallback = `Hi ${studentName},\nThank you for all your hard work on the ${assessment}! Your results give us a clear and encouraging picture of your real strengths and the few areas we will focus on together over the coming weeks. Keep up the effort — I am genuinely excited to see how much you grow this term!`;

  try {
    const stageNote: Record<string, string> = {
      'First Test': 'This is the first assessment, so frame it warmly as a positive DIAGNOSTIC baseline for the whole term — it shows exactly where to focus next, not a final verdict.',
      'Midterm':    'This is the midterm — acknowledge growth since the start of term and sharpen the focus for the second half.',
      'Third Test': 'This is the third assessment — encourage consolidation and momentum heading into the final.',
      'Final Test': 'This is the final assessment — write a warm, summative reflection on the whole term with a proud, forward-looking close.',
    };
    const stage = stageNote[assessment] ?? 'Frame the feedback warmly for the appropriate stage of the course.';
    const pctFromScores = scores.match(/Earned Weight Contribution:\s*([\d.]+\s*%)/i)?.[1]?.replace(/\s+/g, '');
    const pct = percentToFinal ?? pctFromScores;

    const prompt = `You are Dr. Chouit Abderraouf, ESL instructor and founder of Lit & Learn (PhD in English Linguistics, 15+ years' experience). You write warm, genuinely encouraging, deeply personal feedback — like a supportive mentor who is truly excited about each learner. Enthusiastic and affectionate, but always specific and honest.

Write feedback for ${studentName}'s ${assessment}, addressed directly to the student.

SCORES (use the total exactly as written, including its maximum — the test may be out of 50 or 100):
${scores}
${teacherNotes ? `\nMY PRIVATE OBSERVATIONS (weave in naturally; never reveal these are notes). CRITICAL: if these name a specific grammar point, tense, error type, or skill, you MUST use that EXACT term — never soften it to something vague:\n${teacherNotes}` : ''}

STAGE: ${stage}

Open with "Hi ${studentName}," on its own line, then write EXACTLY THREE paragraphs:

PARAGRAPH 1 — Celebrate. A warm, energetic opening hook. State the total score exactly as it appears in the scores above (e.g. "39.5 out of 50"). ${pct ? `CRITICAL: You MUST immediately follow the total score with the exact grade weight in parentheses, formatted exactly like "(which earns ${pct} toward your final grade)". Do not skip this. Never praise this percentage or say you are proud of it; it is just the test's weight.` : ''} Then share your GENUINE first-person reaction to their strongest skill — open it with something like "I was especially impressed by" or "I was absolutely thrilled to see" — naming the skill with its exact score, plus one sentence interpreting what that strength reveals about them as a learner. Sound like a delighted teacher, not a report.

PARAGRAPH 2 — Grow. Turn warmly to what comes next, but be ACCURATE and TARGETED. Address ONLY (a) any skill that genuinely scored lower and (b) the specific issues listed in MY OBSERVATIONS above. A lower mark in one skill does NOT mean the other skills need work — never imply a strong skill needs improvement, and never invent things to fix. My observations may be grouped by skill area (e.g. GRAMMAR, VOCABULARY, WRITING); when they are, attribute each issue to its stated area. If one skill clearly trails the others, you MAY bridge from a high-scoring skill to the lowest-scoring skill (e.g., "To help your [low skill] match your strong [high skill]..."). NEVER compare two high-scoring skills to each other. Mention any low score only in passing, use my EXACT terms for each issue, and use collaborative "we" for the work ahead.

PARAGRAPH 3 — Equip & uplift. Recommend 1-3 SPECIFIC online tools that directly target THIS student's weak area, each with a concrete action (what to actually do on it). These are things the STUDENT does at home, so address them with "you" ("you can try...", "I recommend...") — NEVER "we can explore/use"; "we" is only for the shared in-class work. Introduce them warmly and mention they are completely free (e.g. "A wonderful way to practise at home is to use the completely free..."), and suggest a light, doable habit such as "just a few minutes a day". Include the signature idea that practising digitally at home "trains the eye/ear" so the right choices feel natural during the PAPER tests in class. Close on EXACTLY ONE forward-looking sentence that names the specific skill we are growing (e.g. "I can't wait to watch your writing catch up to your wonderful speaking skills!"), and END the entire feedback there. Do NOT add a second forward-looking line before or after it, and avoid vague filler.

NEVER label a skill as "your highest-scoring" or "your lowest-scoring skill," and never explain the structure of your own feedback. Praise the strong skill directly and let the weaker one come through naturally via its score, exactly as a thoughtful teacher would.

SCORES BELONG TO THE STUDENT: always write "your writing score of 7/10", NEVER "we scored 7/10" or "our score." Use "we" ONLY for the shared work ahead ("we are going to focus on...").

FORBIDDEN WORDS & PHRASES (FATAL ERROR IF USED): testament, delve, utilize, leverage, enhance, foster, embark, undoubtedly, tapestry, underscore, showcase, "room for growth", "indicates that", "solid foundation", "make significant progress". Use plain, warm verbs instead.

CRITICAL ENDING RULE: You must end the entire email on the single "catch up to" sentence. Do not prepend it with "I'm excited to see..." or any other summary.

RESOURCE POOL — pick from these, matching the tool to the weak skill. VARY your picks from student to student; do NOT default to the same website every time:
${RESOURCE_POOL}

STYLE:
- Warm, sincere, enthusiastic. Praise is generous but earned ("fantastic", "wonderful", "brilliant", "thrilled", "so proud"). 2-4 exclamation marks total.
- SCALE the enthusiasm to the result: top scores get spectacular language; for weaker results, lead with effort and hard work, stay encouraging, and name the gap honestly without deflating the student.
- Address the student as "you/your" throughout. Use "we" ONLY for the shared in-class work (paragraph 2's focus areas). Home-practice tools in paragraph 3 are always "you," never "we."
- Vary sentence openings; do not start consecutive sentences with the same word.
- NO sign-off or signature — end on the final encouraging sentence.

Output ONLY the feedback: the "Hi ${studentName}," line followed by the three paragraphs.`;

    const text = await callAI(prompt);
    return text ? tidyFeedback(text) : fallback;

  } catch (err) {
    console.error('🚨 generateStudentFeedback error:', err);
    return fallback;
  }
}
// ═════════════════════════════════════════════════════════════════════════════
// RAW DATA ENGINES (Quick Activity v2)
// ═════════════════════════════════════════════════════════════════════════════
// Quality strategy — the model is asked ONLY for raw linguistic facts (target,
// distractors, ONE context sentence with a [TARGET] placeholder). It never
// formats exercises. The UI assembles gap-fills / multiple choice / error
// correction deterministically in code, so exercises can never be malformed.
//  1. Over-request (numItems + 2) so weak items can be discarded.
//  2. Strict per-item validation: [TARGET] exactly once, no answer leakage
//     into the sentence or definition, deduplicated targets and distractors.
//  3. Grammar lock: every item must test ONLY the requested point.
//  4. Error-correction integrity: incorrectSentence must be the SAME sentence
//     frame as the correct one (token-overlap check), so the answer key is
//     always the true correction.

export interface RawVocabItem {
  target: string;
  pos: string;
  definition: string;
  example: string;           // a DIFFERENT model sentence for the glossary (may be '')
  distractors: string[];     // exactly 3, same POS & lexical type
  contextSentence: string;   // contains "[TARGET]" exactly once — used ONLY for exercises
}
export interface RawVocabData { theme: string; items: RawVocabItem[]; }

export interface RawGrammarItem {
  targetPhrase: string;      // the correct answer
  hint: string;              // base form to print in brackets, e.g. "go" — may be ''
  incorrectSentence: string; // same sentence with a typical learner error
  distractors: string[];     // exactly 2 wrong forms of the same verb/phrase
  contextSentence: string;   // contains "[TARGET]" exactly once
}
export interface RawGrammarData { grammarPoint: string; ruleText: string; items: RawGrammarItem[]; }

/** Count occurrences of a substring. */
function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  return haystack.split(needle).length - 1;
}

/** Loose token-overlap similarity (0..1) to verify two sentences share a frame. */
function tokenOverlap(a: string, b: string): number {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  const ta = norm(a); const tb = new Set(norm(b));
  if (ta.length === 0) return 0;
  return ta.filter(t => tb.has(t)).length / ta.length;
}

/** Clean a distractor list: trim, drop empties / duplicates / copies of the target. */
function cleanDistractors(raw: any, target: string, max: number): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>([target.toLowerCase()]);
  const out: string[] = [];
  for (const d of raw) {
    const s = String(d ?? '').trim();
    const key = s.toLowerCase();
    if (!s || seen.has(key)) continue;
    seen.add(key);
    out.push(s);
    if (out.length === max) break;
  }
  return out;
}

export async function generateRawVocab(
  theme: string,
  level = 'B1',
  customFocus: string = '',
  numItems: number = 10
): Promise<RawVocabData | null> {
  const safeTheme = sanitize(theme);
  const ask = Math.min(numItems + 2, 24); // over-request buffer
  const focusInstruction = customFocus
    ? `\nCRITICAL TEACHER INSTRUCTION (obey above all else): ${sanitize(customFocus)}`
    : '';

  const prompt = `You are an expert ESL materials writer. Generate raw vocabulary data on the theme: "${safeTheme}" at ${level} CEFR level.

LEVEL (${level}): ${getLevelGuidance(level)}${focusInstruction}

STEP 1 — IDENTIFY THE LEXICAL TYPE:
Read the theme carefully. If it names a lexical type (e.g., "phrasal verbs", "collocations", "idioms", "suffixes", "linking words"), then EVERY target must be of that exact type. If it is a semantic topic (e.g., "Crime", "Travel"), targets are useful topic words and collocations. NEVER mix types within one set.

CRITICAL RULES:
1. Generate EXACTLY ${ask} unique vocabulary items. No two items may share the same target word, and no two contextSentences may describe the same scenario.
2. CONTEXT CLUES: Each "contextSentence" must be natural, self-contained, and contain strong context clues so that ONLY the target fits the gap. None of the distractors may fit logically.
3. THE TARGET PLACEHOLDER: In the "contextSentence", replace the target with the exact string "[TARGET]". It must appear EXACTLY ONCE. The target word (or any form of it) must NOT appear anywhere else in the sentence.
4. THE EXAMPLE: "example" is a model sentence for the study guide, written normally (the target appears as a word, NOT as [TARGET]). It MUST describe a COMPLETELY DIFFERENT scenario from the contextSentence — students will see the example, then do exercises built from the contextSentence, so reusing the scenario gives the answer away.
5. DISTRACTORS: Provide exactly 3. They MUST be the same part of speech AND the same lexical structure as the target: if the targets are phrasal verbs, every distractor must also be a phrasal verb (verb + particle); if idioms, every distractor must be an idiom; if single words, single words of the same POS. Thematically plausible, but clearly wrong in that specific sentence.
6. DEFINITION: A short, simple, ${level}-appropriate definition. It must NOT contain the target word or any form of it.
7. POS: Use short tags: "n.", "v.", "adj.", "adv.", "phr. v.", "idiom", "phrase".

Output ONLY valid JSON, no markdown, no backticks:
{"theme":"${safeTheme}","items":[{"target":"","pos":"","definition":"","example":"","distractors":["","",""],"contextSentence":"... [TARGET] ..."}]}`;

  return requestJSON<RawVocabData>(prompt, (p) => {
    const itemsRaw = Array.isArray(p?.items) ? p.items : [];
    const seenTargets = new Set<string>();
    const items: RawVocabItem[] = [];

    for (const it of itemsRaw) {
      const target = String(it?.target ?? '').trim();
      const pos = String(it?.pos ?? '').trim();
      const definition = String(it?.definition ?? '').trim();
      const contextSentence = String(it?.contextSentence ?? '').trim();
      if (!target || !definition || !contextSentence) continue;

      const tKey = target.toLowerCase();
      if (seenTargets.has(tKey)) continue;
      if (countOccurrences(contextSentence, '[TARGET]') !== 1) continue;

      // The answer must not leak into the rest of the sentence or the definition
      if (contextSentence.replace('[TARGET]', '').toLowerCase().includes(tKey)) continue;
      if (definition.toLowerCase().includes(tKey)) continue;

      // The glossary example must actually use the target AND must not be the
      // exercise sentence in disguise; otherwise blank it (the UI hides empties).
      let example = String(it?.example ?? '').trim();
      const correctSentence = contextSentence.replace('[TARGET]', target).toLowerCase();
      if (example) {
        const exLower = example.toLowerCase();
        if (!exLower.includes(tKey)) example = '';
        else if (exLower === correctSentence || tokenOverlap(exLower, correctSentence) >= 0.8) example = '';
      }

      const distractors = cleanDistractors(it?.distractors, target, 3);
      if (distractors.length < 3) continue;

      seenTargets.add(tKey);
      items.push({ target, pos, definition, example, distractors, contextSentence });
    }

    if (items.length < Math.max(4, numItems - 2)) {
      console.warn(`⚠️ Raw vocab: only ${items.length}/${numItems} items survived validation.`);
      return null;
    }
    return { theme: safeTheme, items: items.slice(0, numItems) };
  });
}

/**
 * Verification pass: a second AI call acts as a strict grammar examiner on the
 * candidate sentences. Items judged ungrammatical or off-target are dropped.
 * Fails OPEN: if the verifier call itself fails, the original items are kept,
 * so generation never breaks because of the safety net.
 */
async function verifyGrammarItems(point: string, level: string, items: RawGrammarItem[]): Promise<RawGrammarItem[]> {
  if (items.length === 0) return items;
  const numbered = items
    .map((it, i) => `${i + 1}. ${it.contextSentence.replace('[TARGET]', it.targetPhrase)}`)
    .join('\n');

  const prompt = `You are a strict English grammar examiner. The target structure is: "${point}" (${level} CEFR).

For each numbered sentence below, decide whether it is BOTH:
(a) grammatically correct standard English, AND
(b) a genuine, pure example of "${point}" — not a different tense, not a mixed structure.

Be strict. For conditionals: any "would" inside the if-clause is INVALID; a mismatch between the time frame of the clauses (e.g. past condition with a present "now" result presented as a standard form) is INVALID; "had" in the if-clause must be the past perfect AUXILIARY (had + past participle, or "had had") — if "had" is the main verb meaning possession (e.g. "If I had the money", "If I had more time"), the sentence is INVALID.

${numbered}

Output ONLY valid JSON, no markdown: {"valid":[true,false,...]} — exactly one boolean per sentence, in order.`;

  const verdict = await requestJSON<boolean[]>(prompt, (p) => {
    const v = p?.valid;
    return Array.isArray(v) && v.length === items.length && v.every((x: any) => typeof x === 'boolean') ? v : null;
  }, 0);

  if (!verdict) { console.warn('⚠️ Grammar verifier unavailable — keeping unverified items.'); return items; }
  const kept = items.filter((_, i) => verdict[i]);
  const dropped = items.length - kept.length;
  if (dropped > 0) console.warn(`⚠️ Grammar verifier rejected ${dropped}/${items.length} items.`);
  return kept;
}

/** One generation round: prompt + structural validation + lint. Used by the top-up loop. */
async function fetchRawGrammarBatch(
  point: string,
  level: string,
  focusInstruction: string,
  ask: number
): Promise<RawGrammarData | null> {
  const prompt = `You are an expert ESL materials writer. Generate raw grammar data for: "${point}" at ${level} CEFR level.

LEVEL (${level}): ${getLevelGuidance(level)}${focusInstruction}

GRAMMAR LOCK (most important rule): Every single item must test ONLY "${point}". The correct answer ("targetPhrase") must ALWAYS be an example of "${point}" — never a different tense, structure, or form, even if another form would also be grammatical. Each contextSentence must include time markers or context that force "${point}" specifically.

COMMON FAILURES TO AVOID (these get your items rejected):
- For conditionals: NEVER place "would" inside the if-clause. NEVER mix time frames — do not attach present-time markers like "now" or "today" to a past result. Both clauses must stay within the structure of "${point}".
- The "incorrectSentence" must contain EXACTLY ONE error and must NOT add, remove, or reorder any other words.

CRITICAL RULES:
1. Generate EXACTLY ${ask} unique items. Every "contextSentence" must feature a completely different scenario and a different verb or phrase.
2. THE TARGET PLACEHOLDER: In the "contextSentence", write a flawless, complete sentence, then replace ONLY the tested grammatical phrase with the exact string "[TARGET]". It must appear EXACTLY ONCE.
3. HINT: "hint" is the base (dictionary) form of the verb being tested, to print in brackets after the blank — e.g. "go" when the answer is "went". If the point is not verb-based (prepositions, articles, etc.), use an empty string "".
4. DISTRACTORS: Provide exactly 2 forms of the SAME verb/phrase that a learner might wrongly choose (wrong tense, wrong form, typical confusion). They must be grammatically or contextually incorrect in that sentence.
5. INCORRECT VERSION: "incorrectSentence" must be EXACTLY the same sentence as the contextSentence, with [TARGET] replaced by a typical learner error (L1 interference) instead of the correct phrase. Change NOTHING else — same words, same order. The only error in it must be the grammar error. VARY THE ERROR TYPE across the set — e.g. wrong tense, wrong auxiliary, regularized irregular form ("goed", "taked"), double marking ("did went"), missing auxiliary, wrong word order — do NOT use the same error pattern in every item.
6. RULE: "ruleText" is a concise 1-2 sentence, ${level}-appropriate explanation of when and how to use "${point}".

Output ONLY valid JSON, no markdown, no backticks:
{"grammarPoint":"${point}","ruleText":"","items":[{"targetPhrase":"","hint":"","incorrectSentence":"","distractors":["",""],"contextSentence":"... [TARGET] ..."}]}`;

  const structurallyValid = await requestJSON<RawGrammarData>(prompt, (p) => {
    const itemsRaw = Array.isArray(p?.items) ? p.items : [];
    const items: RawGrammarItem[] = [];

    for (const it of itemsRaw) {
      const targetPhrase = String(it?.targetPhrase ?? '').trim();
      const hint = String(it?.hint ?? '').trim();
      const incorrectSentence = String(it?.incorrectSentence ?? '').trim();
      const contextSentence = String(it?.contextSentence ?? '').trim();
      if (!targetPhrase || !contextSentence) continue;
      if (countOccurrences(contextSentence, '[TARGET]') !== 1) continue;

      const distractors = cleanDistractors(it?.distractors, targetPhrase, 2);
      if (distractors.length < 2) continue;

      // Error-correction integrity: same frame in BOTH directions (>= 75%
      // token overlap each way), so the correction can neither drop the
      // student's words nor smuggle in new ones. Never identical.
      const correctSentence = contextSentence.replace('[TARGET]', targetPhrase);
      if (!incorrectSentence) continue;
      if (incorrectSentence.toLowerCase() === correctSentence.toLowerCase()) continue;
      if (tokenOverlap(incorrectSentence, correctSentence) < 0.75) continue;
      if (tokenOverlap(correctSentence, incorrectSentence) < 0.75) continue;

      // Length-delta guard: a real grammar correction changes the sentence by
      // at most ONE token ("would arrived" -> "would have arrived"). A bigger
      // shift means content was added or dropped (e.g. a key correction
      // containing "in Paris" that the student's sentence never had).
      const tokCount = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean).length;
      if (Math.abs(tokCount(correctSentence) - tokCount(incorrectSentence)) >= 2) continue;

      // Deterministic lint for conditionals: the "correct" sentence must never
      // have "would" inside the if-clause (the classic error models produce).
      const pointLC = point.toLowerCase();
      if (pointLC.includes('conditional')) {
        const ifClause = correctSentence.match(/\bif\b([^,]*)/i);
        if (ifClause && /\bwould\b/i.test(ifClause[1])) continue;
      }
      // Third conditional specifically: the sentence must contain a past
      // perfect, and a bare "now" marks a mixed conditional ("by now" is fine).
      if (pointLC.includes('third conditional')) {
        const cs = correctSentence.toLowerCase();
        if (!/\bhad\b|\bhadn['’]t\b/.test(cs)) continue;
        if (/\bnow\b/.test(cs) && !/\bby now\b/.test(cs)) continue;
        // "had" must be the past-perfect AUXILIARY, not lexical possession:
        // "If I had the money / more time / a chance" is past simple in
        // disguise. Legal "had had" is masked first so it always passes.
        const ifc = cs.match(/\bif\b([^,]*)/);
        if (ifc) {
          const clause = ifc[1].replace(/\bhad(?:n['’]t)?\s+had\b/g, 'had_had');
          if (/\bhad(?:n['’]t)?\s+(?:the|a|an|more|less|some|any|no|enough|my|your|his|her|its|our|their|this|that|these|those)\b/.test(clause)) continue;
        }
      }

      items.push({ targetPhrase, hint, incorrectSentence, distractors, contextSentence });
    }

    if (items.length < 3) {
      console.warn(`⚠️ Raw grammar batch: only ${items.length} items survived structural validation.`);
      return null;
    }
    return { grammarPoint: point, ruleText: String(p?.ruleText ?? '').trim(), items };
  });

  return structurallyValid;
}

export async function generateRawGrammar(
  grammarPoint: string,
  level = 'B1',
  customFocus: string = '',
  numItems: number = 10
): Promise<RawGrammarData | null> {
  const point = sanitize(grammarPoint);
  const focusInstruction = customFocus
    ? `\nCRITICAL TEACHER INSTRUCTION (obey above all else): ${sanitize(customFocus)}`
    : '';

  // Top-up loop: generate → examine → keep survivors → if short, generate more.
  // Hard structures (e.g. third conditional) often lose half a batch to the
  // examiner; a second round refills the sheet instead of printing a thin one.
  let ruleText = '';
  const collected: RawGrammarItem[] = [];
  const seen = new Set<string>();

  for (let round = 0; round < 2 && collected.length < numItems; round++) {
    const need = numItems - collected.length;
    const batch = await fetchRawGrammarBatch(point, level, focusInstruction, Math.min(need + 3, 24));
    if (!batch) continue;
    if (!ruleText && batch.ruleText) ruleText = batch.ruleText;

    const verified = await verifyGrammarItems(point, level, batch.items);
    for (const it of verified) {
      const key = `${it.targetPhrase.toLowerCase()}|${it.contextSentence.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      collected.push(it);
      if (collected.length >= numItems) break;
    }
    if (round === 0 && collected.length < numItems) {
      console.warn(`⚠️ Raw grammar: ${collected.length}/${numItems} after round 1 — topping up.`);
    }
  }

  if (collected.length < 4) {
    console.warn(`⚠️ Raw grammar: only ${collected.length} verified items after top-up — failing this generation.`);
    return null;
  }
  return { grammarPoint: point, ruleText, items: collected.slice(0, numItems) };
}