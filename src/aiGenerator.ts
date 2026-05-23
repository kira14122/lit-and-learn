// src/aiGenerator.ts

export async function generateExampleSentence(word: string, level: string = 'B2'): Promise<string | null> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("🚨 Supabase keys are missing from .env file");
    return null;
  }

  try {
    const promptText = `You are an expert English literature teacher. Your task is to write a single, clear, and contextual example sentence for the vocabulary word "${word}". The sentence must be appropriate for an ESL student at the ${level} CEFR proficiency level. Return ONLY the sentence without any quotation marks or extra text.`;

    const response = await fetch(`${supabaseUrl}/functions/v1/ask-gemini`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseAnonKey}` },
      body: JSON.stringify({ prompt: promptText }),
    });

    if (!response.ok) throw new Error(`Cloud vault rejected the request: ${response.status}`);
    
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) throw new Error("No text returned from AI");
    
    return text.replace(/^["']|["']$/g, '');
  } catch (error) {
    console.error("🚨 Error connecting to secure AI vault:", error);
    return null;
  }
}

export async function generateStudentFeedback(studentName: string, assessment: string, scores: string, teacherNotes?: string): Promise<string> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("🚨 Supabase keys are missing from .env file");
    return "Assessment received. Please review your scores and continue targeting your weakest areas for improvement.";
  }

  try {
    const promptText = `
      You are an expert ESL instructor and academic with a PhD in English Linguistics. 
      Write a brief, highly personalized 3-4 sentence official feedback note for your student, ${studentName}, regarding their recent "${assessment}".
      Exact Score Breakdown: ${scores}
      ${teacherNotes ? `Diagnostic Notes from Instructor: "${teacherNotes}"` : ''}
      STRICT RULES for your response:
      1. NO FLUFF: Do not use generic platitudes.
      2. THE PRAISE: Explicitly state their highest score and praise that specific linguistic skill.
      3. THE CRITIQUE: Explicitly state their lowest score. ${teacherNotes ? 'Seamlessly weave the Diagnostic Notes into a constructive sentence explaining exactly what they need to study next.' : 'Provide one brief, academic suggestion on how to improve that specific weak area.'}
      4. Keep the tone warm, academic, and highly professional.
      5. Output ONLY the final paragraph.
    `;

    const response = await fetch(`${supabaseUrl}/functions/v1/ask-gemini`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseAnonKey}` },
      body: JSON.stringify({ prompt: promptText }),
    });

    if (!response.ok) throw new Error(`Cloud vault rejected the request: ${response.status}`);
    
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) throw new Error("No text returned from AI");
    
    return text;
  } catch (error) {
    console.error("🚨 Error generating feedback with secure AI vault:", error);
    return "Assessment received. Please review your scores and continue targeting your weakest areas for improvement.";
  }
}

export async function generateWorksheetActivity(
  skill: string, 
  level: string, 
  topicOrText: string, 
  activityType: string, 
  numQuestions: number,
  inputMode: 'topic' | 'customText',
  includePassage: boolean
): Promise<any | null> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("🚨 Supabase keys are missing from .env file");
    return null;
  }

  const safeTextPayload = topicOrText
    .replace(/[\n\r\t]+/g, ' ') 
    .replace(/"/g, "'")         
    .replace(/[^\w\s.,!?'()-]/g, '') 
    .trim();

  // Dynamic passage instruction based on the includePassage boolean
  const passageSchema = includePassage 
    ? (inputMode === 'topic' ? '"passage": "Write a 150-word passage here"' : '"passage": "Copy the exact source text here"')
    : '"passage": ""';

  let promptText = "";

  if (inputMode === 'topic') {
    promptText = `You are an expert ESL textbook author. Create a ${level} English worksheet focusing on ${skill}. Topic: '${safeTextPayload}'. Activity Type: ${activityType}. Generate exactly ${numQuestions} questions. Output ONLY a valid JSON object matching this exact schema: {"title": "Title", "instructions": "Clear pedagogical instructions for the student here", ${passageSchema}, "questions": [{"q": "Question text", "options": ["First option text", "Second option text", "Third option text", "Fourth option text"], "answer": "The EXACT full string of the correct option"}]} CRITICAL RULES: 1) NEVER put letters like A), B), C) inside the options array strings. 2) The 'answer' field MUST be the exact full text of the correct choice, NEVER just a single letter like 'A' or 'B'.`;
  } else {
    promptText = `You are an expert ESL textbook author. Create a ${level} English worksheet focusing on ${skill}. Activity Type: ${activityType}. Generate exactly ${numQuestions} questions. Use ONLY the following source text to generate the questions. Do not invent outside facts. Source Text: '${safeTextPayload}'. Output ONLY a valid JSON object matching this exact schema: {"title": "Title", "instructions": "Clear pedagogical instructions for the student here", ${passageSchema}, "questions": [{"q": "Question text", "options": ["First option text", "Second option text", "Third option text", "Fourth option text"], "answer": "The EXACT full string of the correct option"}]} CRITICAL RULES: 1) NEVER put letters like A), B), C) inside the options array strings. 2) The 'answer' field MUST be the exact full text of the correct choice, NEVER just a single letter like 'A' or 'B'.`;
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/ask-gemini`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseAnonKey}` },
      body: JSON.stringify({ prompt: promptText }),
    });

    if (!response.ok) throw new Error(`API gate rejected edge processing route: ${response.status}`);
    
    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) throw new Error("No usable code blocks returned from parsing engine pipeline streams.");

    if (text.startsWith('```json')) text = text.replace(/^```json\n?/, '');
    if (text.startsWith('```')) text = text.replace(/^```\n?/, '');
    if (text.endsWith('```')) text = text.replace(/\n?```$/, '');
    
    return JSON.parse(text.trim());
  } catch (error) {
    console.error("🚨 Error compilation traced inside core worksheet engine generator branch:", error);
    return null;
  }
}