import { NextResponse } from 'next/server';
import { getGroqContext, callGroqVision } from '@/lib/groq';

export async function POST(request: Request) {
  type Body = { imageBase64?: string; hint?: string };
  const [ctx, parsedBody] = await Promise.all([
    getGroqContext(),
    request.json().then((b: Body) => ({ ok: true as const, data: b }))
      .catch(() => ({ ok: false as const })),
  ]);
  if ('error' in ctx) return ctx.error;
  if (!parsedBody.ok) return NextResponse.json({ error: 'Body invalide' }, { status: 400 });

  const { imageBase64, hint } = parsedBody.data;
  if (!imageBase64) {
    return NextResponse.json({ error: 'Image manquante' }, { status: 400 });
  }

  const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

  let prompt = `Analyse cette photo de nourriture/repas et identifie chaque aliment visible.

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

  if (hint) {
    const sanitized = hint.slice(0, 200).replace(/["\n]/g, ' ').trim();
    if (sanitized) {
      prompt += `\n\nINDICE DE L'UTILISATEUR : L'utilisateur indique que ce plat contient ou ressemble à : "${sanitized}". Utilise cette information pour mieux identifier les aliments et ajuster tes estimations nutritionnelles en conséquence.`;
    }
  }

  try {
    const parsed = await callGroqVision(ctx.apiKey, base64Data, prompt, 0.2);

    if (!parsed.foods || !Array.isArray(parsed.foods)) {
      return NextResponse.json({ error: 'Format de réponse invalide' }, { status: 502 });
    }

    const foods = (parsed.foods as Record<string, unknown>[]).map((f) => ({
      name: (f.name as string) || 'Aliment inconnu',
      portionGrams: Math.max(0, Math.round((f.portionGrams as number) || 100)),
      calories: Math.max(0, Math.round((f.calories as number) || 0)),
      protein: Math.max(0, Math.round((f.protein as number) || 0)),
      carbs: Math.max(0, Math.round((f.carbs as number) || 0)),
      fat: Math.max(0, Math.round((f.fat as number) || 0)),
      confidence: Math.min(1, Math.max(0, (f.confidence as number) || 0.5)),
    }));

    return NextResponse.json({ foods });
  } catch (err) {
    console.error('Recognize food error:', err);
    return NextResponse.json({ error: 'Erreur lors de la reconnaissance' }, { status: 500 });
  }
}
