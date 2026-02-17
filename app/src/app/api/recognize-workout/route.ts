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

  const prompt = `Analyse ce screenshot d'une application de fitness/santé (Huawei Health, Garmin, Strava, Apple Health, Samsung Health, etc.) et extrais les données de la séance cardio.

Extrais les informations suivantes si elles sont visibles :
- Le type d'activité (running, walking, cycling, rowing, jump_rope, swimming, elliptical, stepper, hiit, other)
- La durée totale en minutes
- La distance en mètres
- L'allure moyenne en secondes par kilomètre
- La fréquence cardiaque moyenne (bpm)
- La fréquence cardiaque maximale (bpm)
- Les calories brûlées
- La date et l'heure de la séance (format ISO 8601)

Réponds UNIQUEMENT avec du JSON valide, sans markdown, dans ce format exact :
{
  "activity": "running",
  "durationMinutes": 45,
  "distanceMeters": 8500,
  "avgPaceSecondsPerKm": 318,
  "avgHeartRate": 152,
  "maxHeartRate": 178,
  "caloriesBurned": 520,
  "dateTime": "2025-01-15T18:30:00",
  "confidence": 0.9
}

Règles :
- Pour l'allure, convertis en secondes par km (ex: 5:18/km = 318 secondes)
- Pour la distance, convertis toujours en mètres (ex: 8.5 km = 8500)
- Pour la durée, convertis en minutes (ex: 1h15 = 75)
- Si une donnée n'est pas visible, utilise null
- Le champ "confidence" est un score entre 0 et 1 indiquant ta confiance globale

Si tu ne vois aucune donnée de séance sportive, réponds : {"activity": null, "confidence": 0}`;

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
            temperature: 0.1,
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

    if (!parsed.activity) {
      return NextResponse.json(
        { error: 'Aucune séance détectée dans l\'image' },
        { status: 422 }
      );
    }

    // Sanitize and validate
    const validActivities = [
      'running', 'walking', 'cycling', 'rowing', 'jump_rope',
      'swimming', 'elliptical', 'stepper', 'hiit', 'other',
    ];

    const workout = {
      activity: validActivities.includes(parsed.activity) ? parsed.activity : 'other',
      durationMinutes: parsed.durationMinutes != null ? Math.max(0, Math.round(parsed.durationMinutes)) : null,
      distanceMeters: parsed.distanceMeters != null ? Math.max(0, Math.round(parsed.distanceMeters)) : null,
      avgPaceSecondsPerKm: parsed.avgPaceSecondsPerKm != null ? Math.max(0, Math.round(parsed.avgPaceSecondsPerKm)) : null,
      avgHeartRate: parsed.avgHeartRate != null ? Math.max(0, Math.round(parsed.avgHeartRate)) : null,
      maxHeartRate: parsed.maxHeartRate != null ? Math.max(0, Math.round(parsed.maxHeartRate)) : null,
      caloriesBurned: parsed.caloriesBurned != null ? Math.max(0, Math.round(parsed.caloriesBurned)) : null,
      dateTime: parsed.dateTime || null,
      confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
    };

    return NextResponse.json({ workout });
  } catch (err) {
    console.error('Recognize workout error:', err);
    return NextResponse.json(
      { error: 'Erreur lors de la reconnaissance' },
      { status: 500 }
    );
  }
}
