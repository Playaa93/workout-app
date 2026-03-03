import { requireUserId } from '@/lib/auth';
import { getGeminiApiKey } from '@/app/profile/actions';
import { NextResponse } from 'next/server';

/** Validate auth + get Gemini API key, or return an error response */
export async function getGeminiContext(): Promise<
  { apiKey: string } | { error: NextResponse }
> {
  try {
    await requireUserId();
  } catch {
    return { error: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }) };
  }

  const apiKey = (await getGeminiApiKey()) || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      error: NextResponse.json(
        { error: 'Clé API Gemini non configurée. Ajoute-la dans Profil > Paramètres.' },
        { status: 400 }
      ),
    };
  }

  return { apiKey };
}

/** Call Gemini Vision API with an image and prompt, return the parsed JSON */
export async function callGeminiVision(
  apiKey: string,
  base64Data: string,
  prompt: string,
  temperature = 0.2
): Promise<Record<string, unknown>> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              { inline_data: { mime_type: 'image/jpeg', data: base64Data } },
            ],
          },
        ],
        generationConfig: { temperature, maxOutputTokens: 2048 },
      }),
      signal: AbortSignal.timeout(30000),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    console.error('Gemini API error:', errText);
    throw new Error('Gemini API error');
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Invalid AI response');
  }

  return JSON.parse(jsonMatch[0]);
}

/** Extract base64 image from request body */
export async function extractImageFromRequest(
  request: Request
): Promise<{ base64Data: string } | { error: NextResponse }> {
  try {
    const body = await request.json();
    const imageBase64 = body.imageBase64;
    if (!imageBase64) {
      return { error: NextResponse.json({ error: 'Image manquante' }, { status: 400 }) };
    }
    const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    return { base64Data };
  } catch {
    return { error: NextResponse.json({ error: 'Body invalide' }, { status: 400 }) };
  }
}
