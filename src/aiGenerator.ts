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
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify({ prompt: promptText }),
    });

    if (!response.ok) {
      throw new Error(`Cloud vault rejected the request: ${response.status}`);
    }

    const data = await response.json();
    
    // 🕵️ THE WIRETAP: This will print the raw AI response to your browser console
    console.log(`Raw AI Data for ${word}:`, data);
    
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    
    if (!text) {
      throw new Error("No text returned from AI");
    }
    
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
      
      Exact Score Breakdown:
      ${scores}

      ${teacherNotes ? `Diagnostic Notes from Instructor: "${teacherNotes}"` : ''}
      
      STRICT RULES for your response:
      1. NO FLUFF: Do not use generic platitudes ("Great effort", "Keep practicing").
      2. THE PRAISE (Sentence 1): Explicitly state their highest score and praise that specific linguistic skill.
      3. THE CRITIQUE (Sentence 2 & 3): Explicitly state their lowest score. ${teacherNotes ? 'Then, seamlessly weave the Diagnostic Notes into a constructive sentence explaining exactly what they need to study next.' : 'Provide one brief, academic suggestion on how to improve that specific weak area.'}
      4. Keep the tone warm, academic, and highly professional.
      5. Output ONLY the final paragraph. No intros, no outtros.
    `;

    const response = await fetch(`${supabaseUrl}/functions/v1/ask-gemini`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify({ prompt: promptText }),
    });

    if (!response.ok) {
      throw new Error(`Cloud vault rejected the request: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Raw AI Feedback Data for ${studentName}:`, data);
    
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    
    if (!text) {
      throw new Error("No text returned from AI");
    }
    
    return text;
    
  } catch (error) {
    console.error("🚨 Error generating feedback with secure AI vault:", error);
    return "Assessment received. Please review your scores and continue targeting your weakest areas for improvement.";
  }
}