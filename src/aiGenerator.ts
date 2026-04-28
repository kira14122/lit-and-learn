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

export async function generateStudentFeedback(studentName: string, assessment: string, scores: string): Promise<string> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("🚨 Supabase keys are missing from .env file");
    return "Great effort on this assessment! Keep practicing and reviewing your materials.";
  }

  try {
    const promptText = `
      You are an encouraging, professional university ESL professor. 
      Write a short, personalized feedback paragraph (3 to 4 sentences) for your student named ${studentName}.
      They just completed the assessment: "${assessment}".
      
      Here are their raw scores:
      ${scores}
      
      Instructions:
      1. Speak directly to the student (e.g., "Great job, ${studentName}...").
      2. Highlight their strongest score(s) to encourage them.
      3. Identify their lowest score and offer a gentle, constructive suggestion on how to improve it next time.
      4. Keep the tone warm, academic, and supportive.
      5. Do not include any placeholder text, just the final paragraph.
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
    // Fallback message just in case the AI fails or the network drops
    return "Great effort on this assessment! Keep practicing and reviewing your materials.";
  }
}