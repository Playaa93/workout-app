import { NextResponse } from 'next/server';
import { getGroqContext, callGroqVision, extractImageFromRequest } from '@/lib/groq';

export async function POST(request: Request) {
  const [ctx, img] = await Promise.all([getGroqContext(), extractImageFromRequest(request)]);
  if ('error' in ctx) return ctx.error;
  if ('error' in img) return img.error;

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
    const parsed = await callGroqVision(ctx.apiKey, img.base64Data, prompt, 0.1);

    if (!parsed.activity) {
      return NextResponse.json(
        { error: "Aucune séance détectée dans l'image" },
        { status: 422 }
      );
    }

    const validActivities = [
      'running', 'walking', 'cycling', 'rowing', 'jump_rope',
      'swimming', 'elliptical', 'stepper', 'hiit', 'other',
    ];

    const workout = {
      activity: validActivities.includes(parsed.activity as string) ? parsed.activity : 'other',
      durationMinutes: parsed.durationMinutes != null ? Math.max(0, Math.round(parsed.durationMinutes as number)) : null,
      distanceMeters: parsed.distanceMeters != null ? Math.max(0, Math.round(parsed.distanceMeters as number)) : null,
      avgPaceSecondsPerKm: parsed.avgPaceSecondsPerKm != null ? Math.max(0, Math.round(parsed.avgPaceSecondsPerKm as number)) : null,
      avgHeartRate: parsed.avgHeartRate != null ? Math.max(0, Math.round(parsed.avgHeartRate as number)) : null,
      maxHeartRate: parsed.maxHeartRate != null ? Math.max(0, Math.round(parsed.maxHeartRate as number)) : null,
      caloriesBurned: parsed.caloriesBurned != null ? Math.max(0, Math.round(parsed.caloriesBurned as number)) : null,
      dateTime: (parsed.dateTime as string) || null,
      confidence: Math.min(1, Math.max(0, (parsed.confidence as number) || 0.5)),
    };

    return NextResponse.json({ workout });
  } catch (err) {
    console.error('Recognize workout error:', err);
    return NextResponse.json({ error: 'Erreur lors de la reconnaissance' }, { status: 500 });
  }
}
