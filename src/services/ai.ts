import { GoogleGenAI } from "@google/genai";

// Use the API key from the environment configuration
// We use process.env because it's defined in vite.config.ts
const apiKey = process.env.VITE_GEMINI_API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

export interface FlashcardData {
  term: string; 
  definition: string;
}

export async function generateFlashcards(topic: string, count: number = 5): Promise<FlashcardData[]> {
  try {
    const prompt = `Gere ${count} flashcards sobre "${topic}". 
    Para cada flashcard, forneça um "term" (termo/conceito) e uma "definition" (definição/explicação).
    Responda APENAS com um objeto JSON válido contendo uma chave "cards" que é uma lista de objetos.
    Exemplo: { "cards": [{ "term": "React", "definition": "Biblioteca JS..." }] }`;

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = result.text;
    if (!text) {
        throw new Error("No response from AI");
    }

    const responseData = JSON.parse(text);
    
    if (responseData && Array.isArray(responseData.cards)) {
      return responseData.cards;
    }
    
    return [];
  } catch (error) {
    console.error("Error generating flashcards:", error);
    throw error;
  }
}
