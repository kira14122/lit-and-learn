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
  /** The target word the student must find/write (the answer-key value). */
  word: string;
  /** Short POS tag: "v." | "n." | "adj." | "adv." | "phr." */
  pos: string;
  /** OPTIONAL short morphological clue, e.g. "ending in -ed" or "plural". Omitted when POS alone is enough. */
  hint?: string;
  /** Full definition shown to the student. Must NOT contain the word or a derivative. */
  definition: string;
}

/** Part 2B — Matching. A different set of words from the passage, paired to definitions a–e. */
export interface MatchItem {
  /** The word shown in the left column (with its POS). */
  word: string;
  pos: string;
  /** The correct definition (right column). Must NOT contain the word or a derivative. */
  definition: string;
}

/** Part 2C — Fill the Gaps. One sentence with a single ___; the answer is a passage word. */
export interface GapItem {
  /** Sentence containing exactly one ___ blank. */
  sentence: string;
  /** The word that correctly fills the blank (also placed in the bank). */
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
 * The 2C word bank is built CLIENT-SIDE from gaps[].answer + distractors, then shuffled.
 */
export interface VocabularyPart {
  hunt: VocabHuntItem[];      // exactly 5, from the passage
  matching: MatchItem[];      // exactly 5, DIFFERENT words from the passage
  gaps: GapItem[];            // exactly 5 sentences; each answer a DIFFERENT passage word
  distractors: Distractor[];  // exactly 3, plausible but never correct
}

export interface TFItem {
  q: string;
  answer: 'True' | 'False';
}

export interface QAItem {
  q: string;
  answer: string; // model answer for the teacher key
}

/** Part 4 — Grammar Noticing (guided discovery). */
export interface GrammarNoticing {
  grammarPoint: string;
  targetSentences: string[];      // Step 1
  observationQuestions: string[]; // Step 2
  ruleText: string;               // Step 3 — rule with ___ blanks for students to complete
  practice: QAItem[];             // Step 4 — controlled practice
}

// ── QUICK MODE (Mode 2, no passage) — standalone activity shapes ──────────────

/** A presented vocabulary entry (the words are TAUGHT, not hunted from a text). */
export interface GlossaryItem {
  word: string;
  pos: string;        // "n." | "v." | "adj." | "adv." | "phr."
  definition: string;
  example: string;    // a natural example sentence using the word
}

/** One drill block inside a Quick sheet. */
export interface GrammarExercise {
  title: string;        // e.g. "Put the verb in the correct form"
  instruction: string;
  items: QAItem[];      // q = prompt (use ___ for a single-word blank); answer = key
}

/** Quick Vocabulary: present words/structures, then varied flexible drills. */
export interface QuickVocabActivity {
  theme: string;
  glossary: GlossaryItem[];     // Presentation list (words, affixes, etc.)
  exercises: GrammarExercise[]; // Flexible varied drills
}

/** Quick Grammar: a short reminder, then varied drills. NOT a noticing lesson. */
export interface QuickGrammarActivity {
  grammarPoint: string;
  rule: string;         // 1-2 sentence concise reminder
  examples: string[];   // 2-3 model sentences
  exercises: GrammarExercise[];  // 2-3 varied practice blocks
}

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER LAYER
// ─────────────────────────────────────────────────────────────────────────────

async function callGemini(prompt: string, supabaseUrl: string, anonKey: string): Promise<string | null> {
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/ask-gemini`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${anonKey}` },
      body:    JSON.stringify({ prompt }),
    });
    if (!res.ok) { console.warn(`⚠️ Gemini returned ${res.status} — trying Groq.`); return null; }
    const data = await res.json();
    if (
      data.error?.status === 'RESOURCE_EXHAUSTED' ||
      data.promptFeedback?.blockReason ||
      !data.candidates?.length
    ) { console.warn('⚠️ Gemini quota/blocked — switching to Groq.'); return null; }
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
    if (!res.ok) { console.error(`🚨 Groq returned ${res.status}.`); return null; }
    const data = await res.json();
    const text = data.text?.trim();
    if (!text) { console.error('🚨 Groq returned empty.'); return null; }
    console.log('✅ Groq responded (fallback).');
    return text;
  } catch (err) { console.error('🚨 Groq error:', err); return null; }
}

async function callAI(prompt: string): Promise<string | null> {
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

// Sanitize AI-generated passage before embedding in prompts
function sanitizePassage(text: string): string {
  return text
    .replace(/`/g, "'")
    .replace(/"/g, "'")
    .replace(/\\/g, ' ')
    .replace(/[\r\n]+/g, ' ')
    .trim();
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
}

// ═════════════════════════════════════════════════════════════════════════════
// STRUCTURED-WORKSHEET GENERATORS  (used by the redesigned Activity Generator)
// ═════════════════════════════════════════════════════════════════════════════

export async function generateLessonPassage(
  topic: string,
  level = 'B1',
  words = 200
): Promise<string | null> {
  return generateReadingPassage(sanitize(topic), level, words);
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
  const safePassage = sanitizePassage(passage);
  const prompt = `You are an expert ESL textbook author. Based on the passage below, write EXACTLY 5 open comprehension questions at ${level} CEFR level.

LEVEL (${level}): ${getLevelGuidance(level)}

RULES:
- Questions require genuine understanding, not single-word lookup.
- Students will answer in FULL SENTENCES, so phrase questions accordingly (why / how / what evidence / in what way).
- Provide a model full-sentence "answer" for the teacher key.
- Answerable from the passage.

Passage:
"""
${safePassage}
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
    if (five.some((it) => it.q.length < 5 || it.answer.length < 2)) return null;
    return five;
  });
}

function wordStem(word: string): string {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  return w.length <= 4 ? w : w.slice(0, w.length - 3);
}

export async function generateVocabularySet(
  source: string,           // passage (Mode 1) or theme (Mode 2)
  level = 'B1',
  fromPassage = true
): Promise<VocabularyPart | null> {
  const safeSource = sanitizePassage(source);

  const selectionBlock = fromPassage
    ? `Choose all 15 vocabulary words (5 for Hunt + 5 for Matching + 5 for Gaps) from the PASSAGE below.
- Every chosen word MUST actually appear in the passage.
- Choose useful, teachable words — never proper nouns, never the easiest function words.
- The 15 words must ALL be different from one another (no shared roots either).

Passage:
"""
${safeSource}
"""`
    : `Invent 15 useful vocabulary words (5 for Hunt + 5 for Matching + 5 for Gaps) for a ${level} learner on the theme: "${safeSource}".
- All 15 words must be different from one another (no shared roots).`;

  const prompt = `You are an expert ESL vocabulary materials writer.

${selectionBlock}

LEVEL (${level}): ${getLevelGuidance(level)}

Produce THREE separate groups. A word may appear in ONLY ONE group — never reuse a word (or its root) across groups.

1) "hunt" — EXACTLY 5 items, each:
   - "word": the target word.
   - "pos": short tag, one of: v. | n. | adj. | adv. | phr.
   - "hint": OPTIONAL short morphological clue ONLY when it genuinely helps (e.g. "ending in -ed", "plural"). Omit it entirely (empty string) when the POS alone is enough. Never include the word or its root in the hint.
   - "definition": a clear full definition that does NOT contain the word or any derivative.

2) "matching" — EXACTLY 5 items, using 5 DIFFERENT words, each:
   - "word", "pos" (same tag set), and "definition" (does NOT contain the word).

3) "gaps" — EXACTLY 5 items, using 5 DIFFERENT words again, each:
   - "sentence": an original sentence (NOT copied from the passage) with exactly one ___ where the word goes.
   - "answer": the word that fills the blank. Context must make it the only word from the bank that fits.

Then "distractors" — EXACTLY 3 decoy words:
   - "word", "pos". Same POS family as the gap answers, thematically related.
   - Must NOT correctly complete any gap sentence, and must NOT duplicate any of the 15 words.

Output ONLY valid JSON, no markdown, no backticks:
{"hunt":[{"word":"","pos":"","hint":"","definition":""}],"matching":[{"word":"","pos":"","definition":""}],"gaps":[{"sentence":"... ___ ...","answer":""}],"distractors":[{"word":"","pos":""}]}
"hunt", "matching", "gaps" each EXACTLY 5; "distractors" EXACTLY 3.`;

  return requestJSON<VocabularyPart>(prompt, (p) => {
    const huntRaw  = p?.hunt;
    const matchRaw = p?.matching;
    const gapRaw   = p?.gaps;
    const distRaw  = p?.distractors;
    if (!Array.isArray(huntRaw)  || huntRaw.length  < 5) return null;
    if (!Array.isArray(matchRaw) || matchRaw.length < 5) return null;
    if (!Array.isArray(gapRaw)   || gapRaw.length   < 5) return null;
    if (!Array.isArray(distRaw)  || distRaw.length  < 3) return null;

    const hunt: VocabHuntItem[] = huntRaw.slice(0, 5).map((t: any) => {
      const hint = String(t.hint ?? '').trim();
      return {
        word:       String(t.word ?? '').trim(),
        pos:        String(t.pos ?? '').trim(),
        ...(hint ? { hint } : {}),
        definition: String(t.definition ?? '').trim(),
      };
    });

    const matching: MatchItem[] = matchRaw.slice(0, 5).map((m: any) => ({
      word:       String(m.word ?? '').trim(),
      pos:        String(m.pos ?? '').trim(),
      definition: String(m.definition ?? '').trim(),
    }));

    const gaps: GapItem[] = gapRaw.slice(0, 5).map((g: any) => ({
      sentence: String(g.sentence ?? '').trim(),
      answer:   String(g.answer ?? '').trim(),
    }));

    const distractors: Distractor[] = distRaw.slice(0, 3).map((d: any) => ({
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

    const allWords = [
      ...hunt.map((h) => h.word),
      ...matching.map((m) => m.word),
      ...gaps.map((g) => g.answer),
      ...distractors.map((d) => d.word),
    ];
    const stems = allWords.map(wordStem);
    if (new Set(stems).size !== stems.length) {
      console.warn('⚠️ Vocabulary groups share a repeated word/root — retrying.');
      return null;
    }

    if (fromPassage) {
      const shouldAppear = [...hunt.map((h) => h.word), ...matching.map((m) => m.word), ...gaps.map((g) => g.answer)];
      const missing = shouldAppear.filter((w) => !wordInText(w, safeSource));
      if (missing.length) console.warn(`⚠️ Vocab words not found verbatim in passage: ${missing.join(', ')}`);
    }

    return { hunt, matching, gaps, distractors };
  });
}

export async function generateDiscussion(
  source: string,          // passage (Mode 1) or theme (Mode 2)
  level = 'B1'
): Promise<string[] | null> {
  const safeSource = sanitizePassage(source);
  const prompt = `You are an expert ESL discussion-task writer. Write EXACTLY 2 open-ended discussion questions at ${level} CEFR level, connected to the THEME of the text below.

LEVEL (${level}): ${getLevelGuidance(level)}

RULES:
- Each question invites personal opinion and a real-life connection.
- No single correct answer; not answerable directly from the text.
- Encourage extended speaking/writing.

Text / theme:
"""
${safeSource}
"""

Output ONLY valid JSON, no markdown, no backticks:
{"items":["question 1","question 2"]}
The items array must contain EXACTLY 2 questions.`;

  return requestJSON<string[]>(prompt, (p) => {
    const items = p?.items;
    if (!Array.isArray(items) || items.length < 2) return null;
    const two = items.slice(0, 2).map((q: any) => String(q ?? '').trim());
    if (two.some((q) => q.length < 8)) return null;
    return two;
  });
}

export async function generateGrammarNoticing(
  grammarPoint: string,
  level = 'B1',
  passage?: string          // optional — extract target sentences from it when present
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

/** Quick Vocabulary: Format-aware engine with teacher override. */
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
- CRITICAL GAP-FILL RULE: If the teacher asks to test ONLY a missing particle/affix, the "answer" field MUST still contain the FULL word/phrase for the answer key, but the sentence must have the blank positioned correctly.

Produce JSON:
1. "glossary": EXACTLY 8 words. For each: "word", "pos", "definition", and a natural "example".
2. "exercises": 2-3 DIFFERENT exercise types that drill these words (e.g., matching, gap-fill, word-formation tables, categorization). For EACH: a short "title", a one-line "instruction", and EXACTLY 5-6 "items". Each item has "q" (the prompt/sentence with ___) and "answer".

Output ONLY valid JSON, no markdown, no backticks:
{"glossary":[{"word":"","pos":"","definition":"","example":""}],"exercises":[{"title":"","instruction":"","items":[{"q":"","answer":""}]}]}`;

  return requestJSON<QuickVocabActivity>(prompt, (p) => {
    const glossary = Array.isArray(p?.glossary) ? p.glossary : [];
    const exercisesRaw = Array.isArray(p?.exercises) ? p.exercises : [];
    
    if (glossary.length < 6 || exercisesRaw.length < 1) return null;

    const exercises: GrammarExercise[] = exercisesRaw.map((ex: any) => ({
      title: String(ex?.title ?? '').trim(),
      instruction: String(ex?.instruction ?? '').trim(),
      items: (Array.isArray(ex?.items) ? ex.items : []).map((it: any) => ({
        q: String(it?.q ?? '').trim(),
        answer: String(it?.answer ?? '').trim(),
      })).filter((it: QAItem) => it.q.length > 1 && it.answer.length > 0)
    })).filter((ex: GrammarExercise) => ex.title.length > 0 && ex.items.length > 0);

    if (exercises.length === 0) return null;

    return { theme: safeTheme, glossary: glossary.slice(0, 8), exercises };
  });
}

/** Quick Grammar: Format-aware engine with context locks and teacher override. */
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

Produce JSON:
- "rule": a concise 1-2 sentence reminder of how "${point}" works.
- "examples": 2-3 short model sentences.
- "exercises": 2-3 DIFFERENT exercise types (gap-fill, error correction, transformation, multiple choice). For EACH: a short "title", "instruction", and EXACTLY 5 "items" ("q" and "answer").

Output ONLY valid JSON, no markdown, no backticks:
{"rule":"","examples":["",""],"exercises":[{"title":"","instruction":"","items":[{"q":"","answer":""}]}]}`;

  return requestJSON<QuickGrammarActivity>(prompt, (p) => {
    const rule = String(p?.rule ?? '').trim();
    const examples = Array.isArray(p?.examples) ? p.examples : [];
    const exercisesRaw = Array.isArray(p?.exercises) ? p.exercises : [];

    if (!rule || examples.length < 2 || exercisesRaw.length < 1) return null;

    const exercises: GrammarExercise[] = exercisesRaw.map((ex: any) => ({
      title: String(ex?.title ?? '').trim(),
      instruction: String(ex?.instruction ?? '').trim(),
      items: (Array.isArray(ex?.items) ? ex.items : []).map((it: any) => ({
        q: String(it?.q ?? '').trim(),
        answer: String(it?.answer ?? '').trim(),
      })).filter((it: QAItem) => it.q.length > 1 && it.answer.length > 0)
    })).filter((ex: GrammarExercise) => ex.title.length > 0 && ex.items.length > 0);

    if (exercises.length === 0) return null;

    return { grammarPoint: point, rule, examples: examples.slice(0, 3), exercises };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// READING — STEP 1: Passage generation  (shared by legacy + structured paths)
// ─────────────────────────────────────────────────────────────────────────────

async function generateReadingPassage(
  topic:        string,
  level:        string,
  passageWords: number
): Promise<string | null> {
  const min = passageWords - 10;
  const max = passageWords + 10;

  const prompt = `You are a professional ESL materials writer. Write a reading passage for a ${level} CEFR learner on: "${topic}"

LEVEL (${level}): ${getLevelGuidance(level)}

WORD COUNT: Write EXACTLY ${passageWords} words. Acceptable range: ${min}-${max}. Count every word including articles and prepositions. If too short, add specific details. If too long, tighten your sentences.

STRUCTURE: 3 paragraphs.
- Para 1: Engaging opening fact or observation. Introduce the main idea.
- Para 2: Concrete details, examples, or data. This is the longest paragraph.
- Para 3: Broader implication or thought-provoking reflection.

RULES:
- Factually accurate. No fiction unless topic demands it.
- Every sentence must add specific information — no vague generalities.
- Output ONLY the passage text. No title, no heading, no word count note.
- Do NOT bold, underline, italicise, or otherwise mark any words.
- Do not start with the word "The".`;

  const text = await callAI(prompt);
  if (!text) return null;

  const wc = countWords(text);
  console.log(`✅ Passage generated: ${wc} words (target: ${passageWords}).`);
  if (wc < passageWords * 0.6) {
    console.warn(`⚠️ Passage too short: ${wc} words vs target ${passageWords}.`);
  }

  return text.trim();
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