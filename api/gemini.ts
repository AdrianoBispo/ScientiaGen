import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Apenas POST é permitido
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validar que a API key existe no servidor
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not configured on the server.');
    return res.status(500).json({ error: 'API key not configured on server' });
  }

  try {
    const { contents, config, model } = req.body;

    if (!contents) {
      return res.status(400).json({ error: 'Missing "contents" in request body' });
    }

    const ai = new GoogleGenAI({ apiKey });

    const result = await ai.models.generateContent({
      model: model || 'gemini-2.5-flash',
      contents,
      config,
    });

    const text = result.text;
    return res.status(200).json({ text });
  } catch (error: any) {
    console.error('Gemini API error:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error',
    });
  }
}
