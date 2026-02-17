import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { getGeminiApiKey } from '@/app/profile/actions';

export async function POST(request: Request) {
  // Verify auth
  try {
    await requireUserId();
  } catch {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const apiKey = await getGeminiApiKey() || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Clé API Gemini non configurée. Ajoute-la dans Profil > Paramètres.' },
      { status: 400 }
    );
  }

  let imageBase64: string;
  try {
    const body = await request.json();
    imageBase64 = body.imageBase64;
    if (!imageBase64) {
      return NextResponse.json({ error: 'Image manquante' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Body invalide' }, { status: 400 });
  }

  // Strip data URL prefix if present
  const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

  const prompt = `Analyse cette photo de nourriture/repas et identifie chaque aliment visible.

Pour chaque aliment, estime:
- Le nom en français
- La portion en grammes (estimation visuelle)
- Les calories
- Les protéines en grammes
- Les glucides en grammes
- Les lipides en grammes
- Un score de confiance entre 0 et 1

Réponds UNIQUEMENT avec du JSON valide, sans markdown, dans ce format exact:
{
  "foods": [
    {
      "name": "nom de l'aliment",
      "portionGrams": 150,
      "calories": 250,
      "protein": 20,
      "carbs": 30,
      "fat": 8,
      "confidence": 0.85
    }
  ]
}

Si tu ne vois aucun aliment, réponds: {"foods": []}`;

  try {
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
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2048,
          },
        }),
        signal: AbortSignal.timeout(30000),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API error:', errText);
      return NextResponse.json(
        { error: 'Erreur API Gemini' },
        { status: 502 }
      );
    }

    const data = await response.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Extract JSON from the response (handle potential markdown wrapping)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: 'Réponse IA invalide' },
        { status: 502 }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.foods || !Array.isArray(parsed.foods)) {
      return NextResponse.json(
        { error: 'Format de réponse invalide' },
        { status: 502 }
      );
    }

    // Sanitize and validate each food item
    const foods = parsed.foods.map(
      (f: {
        name?: string;
        portionGrams?: number;
        calories?: number;
        protein?: number;
        carbs?: number;
        fat?: number;
        confidence?: number;
      }) => ({
        name: f.name || 'Aliment inconnu',
        portionGrams: Math.max(0, Math.round(f.portionGrams || 100)),
        calories: Math.max(0, Math.round(f.calories || 0)),
        protein: Math.max(0, Math.round(f.protein || 0)),
        carbs: Math.max(0, Math.round(f.carbs || 0)),
        fat: Math.max(0, Math.round(f.fat || 0)),
        confidence: Math.min(1, Math.max(0, f.confidence || 0.5)),
      })
    );

    return NextResponse.json({ foods });
  } catch (err) {
    console.error('Recognize food error:', err);
    return NextResponse.json(
      { error: 'Erreur lors de la reconnaissance' },
      { status: 500 }
    );
  }
}
