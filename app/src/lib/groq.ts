import { requireUserId } from '@/lib/auth';
import { db } from '@/db';
import { userSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export const GROQ_TEXT_MODEL = 'llama-3.3-70b-versatile';
export const GROQ_VISION_MODEL = 'llama-3.2-90b-vision-preview';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/** Validate auth + get Groq API key, or return an error response */
export async function getGroqContext(): Promise<
  { apiKey: string } | { error: NextResponse }
> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { error: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }) };
  }

  const [settings] = await db
    .select({ groqApiKey: userSettings.groqApiKey })
    .from(userSettings)
    .where(eq(userSettings.userId, userId));

  const apiKey = settings?.groqApiKey || process.env.GROQ_API_KEY;
  if (!apiKey) {
    return {
      error: NextResponse.json(
        { error: 'Clé API Groq non configurée. Ajoute-la dans Profil > Paramètres.' },
        { status: 400 }
      ),
    };
  }

  return { apiKey };
}

/** Call Groq Chat API with messages, return parsed JSON */
export async function callGroqChat(
  apiKey: string,
  messages: Array<{ role: string; content: string | Array<Record<string, unknown>> }>,
  opts: { model?: string; temperature?: number; max_tokens?: number; jsonMode?: boolean } = {}
): Promise<Record<string, unknown>> {
  const {
    model = GROQ_TEXT_MODEL,
    temperature = 0.2,
    max_tokens = 2048,
    jsonMode = false,
  } = opts;

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens,
      ...(jsonMode && { response_format: { type: 'json_object' } }),
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Groq API error:', response.status, errText.slice(0, 300));
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';

  if (jsonMode) return JSON.parse(text);

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid AI response');
  return JSON.parse(jsonMatch[0]);
}

/** Call Groq Vision API with a base64 image and prompt, return parsed JSON */
export async function callGroqVision(
  apiKey: string,
  base64Data: string,
  prompt: string,
  temperature = 0.2
): Promise<Record<string, unknown>> {
  return callGroqChat(
    apiKey,
    [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Data}` } },
        ],
      },
    ],
    { model: GROQ_VISION_MODEL, temperature }
  );
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
