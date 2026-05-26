// src/aiGenerator.ts
// Primary: Gemini 2.0 Flash | Fallback: Groq Llama 3.3 70B
// ~16,000 free requests per day combined

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
// Prevents special characters from breaking JSON payloads sent to edge functions
function sanitizePassage(text: string): string {
  return text
    .replace(/`/g, "'")
    .replace(/"/g, "'")
    .replace(/\\/g, ' ')
    .replace(/[\r\n]+/g, ' ')
    .trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// CEFR LEVEL GUIDANCE
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// QUESTION SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// READING — STEP 1: Passage generation
// Focused entirely on producing a high-quality, correctly-sized passage
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
// READING — STEP 2: Question generation
// Questions are generated FROM the actual passage — kept lean to avoid payload limits
// ─────────────────────────────────────────────────────────────────────────────

async function generateReadingQuestions(
  passage:      string,
  level:        string,
  activityType: string,
  numQ:         number
): Promise<any | null> {
  const { schema, rules } = getQuestionSchema(activityType);

  // Sanitize passage to prevent special characters breaking the JSON payload
  const safePassage = sanitizePassage(passage);

  const defaultInstructions: Record<string, string> = {
    'Multiple Choice': 'Read the passage carefully, then choose the best answer for each question.',
    'True/False':      'Read the passage carefully. Write True or False for each statement.',
    'Short Answer':    'Read the passage carefully, then answer each question using information from the text.',
  };

  // Lean prompt — keeps payload small to avoid edge function 400 errors
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
// GRAMMAR ACTIVITY GENERATOR
// Every item must test the specific target grammar structure
// ─────────────────────────────────────────────────────────────────────────────

async function generateGrammarActivity(
  grammarPoint: string,
  level:        string,
  activityType: string,
  numQ:         number
): Promise<any | null> {
  const { schema, rules } = getQuestionSchema(activityType);

  const typeInstructions: Record<string, string> = {
    'Fill in the Blanks':  `Each blank must require the student to apply "${grammarPoint}". One blank per sentence marked as ___. "answer" is only the missing word/phrase. Vary sentence subjects and contexts.`,
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
// VOCABULARY ACTIVITY GENERATOR
// Context-aware, level-appropriate vocabulary selection
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
// MAIN EXPORT: generateWorksheetActivity
// Routes to the correct skill-specific generator
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

    // ── READING ───────────────────────────────────────────────────────────────
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

    // ── GRAMMAR ───────────────────────────────────────────────────────────────
    if (skill === 'Grammar') {
      const grammarPoint = inputMode === 'customText'
        ? `Based on this text: "${sourceText.substring(0, 300)}"`
        : sourceText;
      return await generateGrammarActivity(grammarPoint, level, activityType, numQuestions);
    }

    // ── VOCABULARY ────────────────────────────────────────────────────────────
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
// generateExampleSentence
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
// Lean, focused prompt that works reliably on free-tier models.
// ─────────────────────────────────────────────────────────────────────────────

export async function generateStudentFeedback(
  studentName:   string,
  assessment:    string,
  scores:        string,
  teacherNotes?: string
): Promise<string> {

  const fallback = `The scores for this ${assessment} reveal a clear picture of where your energy should go next. There are genuine strengths here worth building on, alongside one area that will need focused attention before the next assessment. We will discuss the details in our next session.`;

  try {
    const stageNote: Record<string, string> = {
      'First Test':  'First assessment — set a diagnostic baseline and build motivation for the term.',
      'Midterm':     'Halfway through — acknowledge growth and sharpen focus for the second half.',
      'Third Test':  'Third assessment — push them to consolidate before the final.',
      'Final Test':  'Final assessment — write a summative reflection with a forward-looking close.',
    };
    const stage = stageNote[assessment] ?? 'Frame feedback for the appropriate stage of the course.';

    const prompt = `You are Dr. Chouit Abderraouf, ESL instructor and founder of Lit & Learn (PhD in English Linguistics, 15+ years experience). Your feedback is personal, specific, and genuinely motivating — never generic.

Write a 5-sentence feedback paragraph for ${studentName}'s ${assessment}. Speak directly to the student using "you" and "your".

SCORES:
${scores}
${teacherNotes ? `\nPRIVATE OBSERVATIONS — CRITICAL: If these notes name a specific grammar point, tense, or skill struggle, you MUST use that EXACT term in the feedback. Never paraphrase it vaguely. Do not quote or reveal these are private:\n${teacherNotes}` : ''}

STAGE: ${stage}

PARAGRAPH STRUCTURE (write as flowing prose):
1. Specific opening observation showing you read the actual scores.
2. Name and praise the highest-scoring skill with its exact score.
3. Name and honestly address the lowest-scoring skill with its exact score.
4. One concrete named study technique for the weakness (e.g. "daily present perfect gap-fill drills on BBC Learning English" — never "practice more").
5. Forward-looking close suited to the ${assessment}.

STRICT RULES:
- Never open with: Dear / Hello / ${studentName} / Congratulations / Well done / Overall / Your performance / It is / I am pleased
- Never use: impressive, commendable, evident, strive, showcase, testament, invaluable, stellar, exemplary
- No two sentences may start with the same word
- Output ONLY the paragraph — no greeting, no sign-off, no quotes around it`;

    const text = await callAI(prompt);
    return text?.trim() ?? fallback;

  } catch (err) {
    console.error('🚨 generateStudentFeedback error:', err);
    return fallback;
  }
}