// Helper to call our serverless proxy at /api/gemini
// The API key is stored server-side only (GEMINI_API_KEY), never exposed to the browser.
async function callGemini(contents: any, config?: any, model?: string): Promise<string> {
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents, config, model }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API request failed with status ${response.status}`);
  }

  const data = await response.json();
  if (!data.text) {
    throw new Error('No response from AI');
  }

  return data.text;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

const difficultyLabels: Record<Difficulty, string> = {
  easy: 'fácil (conceitos básicos e introdutórios)',
  medium: 'médio (conceitos intermediários com mais profundidade)',
  hard: 'difícil (conceitos avançados e detalhados)',
};

export interface FlashcardData {
  term: string; 
  definition: string;
}

export async function generateFlashcards(topic: string, count: number = 5, difficulty: Difficulty = 'medium'): Promise<FlashcardData[]> {
  try {
    const diffLabel = difficultyLabels[difficulty];
    const prompt = `Gere ${count} flashcards sobre "${topic}" com nível de dificuldade ${diffLabel}. 
    Para cada flashcard, forneça um "term" (termo/conceito) e uma "definition" (definição/explicação).
    Responda APENAS com um objeto JSON válido contendo uma chave "cards" que é uma lista de objetos.
    Exemplo: { "cards": [{ "term": "React", "definition": "Biblioteca JS..." }] }`;

    const text = await callGemini(prompt, { responseMimeType: 'application/json' });

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

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  FILL_IN_BLANK = 'FILL_IN_BLANK',
  OPEN_ENDED = 'OPEN_ENDED',
}

export interface QuizQuestion {
  question: string;
  answer: string;
}

export async function generateLearnQuestions(topic: string, count: number = 5, difficulty: Difficulty = 'medium'): Promise<QuizQuestion[]> {
    try {
        const diffLabel = difficultyLabels[difficulty];
        const prompt = `Gere um quiz com ${count} questões abertas sobre "${topic}" com nível de dificuldade ${diffLabel}. Forneça a resposta correta e concisa para cada uma. Gere uma resposta JSON com uma chave "questions" contendo uma matriz de objetos, cada um com "question" e "answer".`;
        const text = await callGemini(prompt, { responseMimeType: 'application/json' });

        const responseData = JSON.parse(text);
        if (responseData && responseData.questions && Array.isArray(responseData.questions)) {
            return responseData.questions;
        } else {
             return [];
        }
    } catch (error) {
        console.error("Error generating learn questions:", error);
        throw error;
    }
}

export interface MistoQuestion {
  question: string;
  type: QuestionType;
  answer: string;
  options?: string[];
}

export async function generateMixedQuiz(topic: string, count: number = 5, difficulty: Difficulty = 'medium'): Promise<MistoQuestion[]> {
  try {
      const diffLabel = difficultyLabels[difficulty];
      const prompt = `Gere um quiz misto com ${count} questões sobre "${topic}" com nível de dificuldade ${diffLabel}. Inclua tipos 'MULTIPLE_CHOICE', 'FILL_IN_BLANK' e 'OPEN_ENDED'. Para múltipla escolha, forneça 4 opções. Para preenchimento, use '___'. Gere um JSON com uma chave "questions" contendo uma matriz de objetos com "question", "type", "answer", e "options" (se aplicável).`;
      const text = await callGemini(prompt, { responseMimeType: 'application/json' });
      
      const responseData = JSON.parse(text);

      if (responseData && responseData.questions && Array.isArray(responseData.questions)) {
          return responseData.questions;
      } else {
        return [];
      }
  } catch (error) {
    console.error("Error generating mixed quiz:", error);
    throw error;
  }
}

export interface TestQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: string;
    explanation?: string;
}

export async function generateTestQuestions(topic: string, count: number = 5, difficulty: Difficulty = 'medium'): Promise<TestQuestion[]> {
    try {
        const diffLabel = difficultyLabels[difficulty];
        const prompt = `Gere um teste de múltipla escolha com ${count} perguntas sobre "${topic}" com nível de dificuldade ${diffLabel}. 
        Para cada pergunta, forneça:
        - "question": o texto da pergunta
        - "options": uma lista de 4 opções de resposta (strings)
        - "correctAnswer": a string exata da resposta correta (deve estar presente em "options")
        - "explanation": uma breve explicação de por que a resposta está correta.
        
        Responda APENAS com um objeto JSON válido contendo uma chave "questions" que é uma lista de objetos.`;

        const text = await callGemini(prompt, { responseMimeType: 'application/json' });

        const responseData = JSON.parse(text);

        if (responseData && responseData.questions && Array.isArray(responseData.questions)) {
            return responseData.questions.map((q: any, index: number) => ({
                ...q,
                id: `q-${Date.now()}-${index}`
            }));
        }
        return [];
    } catch (error) {
        console.error("Error generating test questions:", error);
        throw error;
    }
}

export async function checkAnswer(question: string, userAnswer: string, correctAnswer: string, type: QuestionType): Promise<{ isCorrect: boolean; feedback: string }> {
     const prompt = `Questão: "${question}"\nResposta correta: "${correctAnswer}"\nResposta do usuário: "${userAnswer}"\nTipo: "${type}"\n\nAvalie se a resposta do usuário está correta. Retorne um JSON com: { "isCorrect": boolean, "feedback": "breve explicação" }. Seja leniente com erros de digitação leves e variações de frase.`;
     
     try {
        const text = await callGemini(prompt, { responseMimeType: 'application/json' });
        return JSON.parse(text);
     } catch (e) {
         console.error("Error checking answer", e);
         // Fallback basic check
         const isCorrect = userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
         return { isCorrect, feedback: isCorrect ? "Correto!" : `A resposta correta era: ${correctAnswer}` };
     }
}

export interface SolutionStep {
    stepTitle: string;
    explanation: string;
    calculation?: string;
}

export interface Solution {
    title: string;
    steps: SolutionStep[];
    finalAnswer: string;
}

export async function solveProblem(problem: string, imageData?: string, mimeType?: string): Promise<Solution> {
    try {
        const promptText = problem 
            ? `Aja como um tutor especialista. Forneça uma solução passo a passo detalhada para o seguinte problema. Gere uma resposta JSON que corresponda ao esquema fornecido. O problema é:\n\n${problem}`
            : `Aja como um tutor especialista. Analise a imagem ou documento fornecido e forneça uma solução passo a passo detalhada para o problema identificado. Gere uma resposta JSON que corresponda ao esquema fornecido.`;
            
        const parts: any[] = [];
        
        if (imageData && mimeType) {
            parts.push({
                inlineData: {
                    mimeType: mimeType,
                    data: imageData
                }
            });
        }

        parts.push({ text: promptText });

        // Schema for structured output
        const solutionSchema = {
             type: 'OBJECT',
             properties: {
                 title: { type: 'STRING' },
                 steps: {
                     type: 'ARRAY',
                     items: {
                         type: 'OBJECT',
                         properties: {
                             stepTitle: { type: 'STRING' },
                             explanation: { type: 'STRING' },
                             calculation: { type: 'STRING', nullable: true },
                         },
                          required: ['stepTitle', 'explanation'],
                     },
                 },
                 finalAnswer: { type: 'STRING' },
             },
             required: ['title', 'steps', 'finalAnswer'],
        };

        const text = await callGemini(
            [{ parts: parts }],
            { responseMimeType: 'application/json', responseSchema: solutionSchema }
        );
        
        return JSON.parse(text) as Solution;
    } catch (error) {
        console.error("Error solving problem:", error);
         throw error;
    }
}

