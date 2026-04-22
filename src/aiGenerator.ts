// src/aiGenerator.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function generateExampleSentence(word: string, level: string = 'B2'): Promise<string | null> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error("🚨 Gemini API key is missing from .env file");
    return null;
  }

  try {
    // Initialize the Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // THE FIX: We updated the model version to the current standard
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // The explicit prompt telling the AI exactly how to act
    const prompt = `You are an expert English literature teacher. Your task is to write a single, clear, and contextual example sentence for the vocabulary word "${word}". The sentence must be appropriate for an ESL student at the ${level} CEFR proficiency level. Return ONLY the sentence without any quotation marks or extra text.`;

    // Fire the request to Google
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    // Safety clean-up just in case the AI added rogue quotation marks
    return text.replace(/^["']|["']$/g, '');
    
  } catch (error) {
    console.error("🚨 Error connecting to Gemini:", error);
    return null;
  }
}