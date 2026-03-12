import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';

const GROQ_MODEL = 'llama-3.3-70b-versatile';

export async function POST(request: Request) {
  try {
    await requireUserId();
  } catch {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Clé API Groq non configurée' }, { status: 500 });
  }

  let foodName: string;
  try {
    const body = await request.json();
    foodName = body.foodName?.trim()?.slice(0, 100);
    if (!foodName) {
      return NextResponse.json({ error: 'Nom du plat manquant' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Body invalide' }, { status: 400 });
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content: `Tu es un nutritionniste diplômé. Estime les valeurs nutritionnelles par 100g de l'aliment demandé.

REGLES :
- Valeurs pour 100g du plat tel que servi (pas par ingrédient)
- proteinPer100g + carbsPer100g + fatPer100g < 100 (c'est pour 100g !)
- caloriesPer100g ≈ proteinPer100g*4 + carbsPer100g*4 + fatPer100g*9 (cohérence)
- Plat composé = moyenne pondérée de tous les ingrédients (viande + sauce + légumes + riz/féculents)
- Ne sous-estime pas les lipides (huile de cuisson, sauces, marinades)
- typicalPortionGrams = portion typique dans une assiette

Réponds UNIQUEMENT en JSON valide, sans markdown.`,
          },
          {
            role: 'user',
            content: `Aliment : "${foodName}"

JSON exact : {"name":"nom normalisé en français","caloriesPer100g":0,"proteinPer100g":0,"carbsPer100g":0,"fatPer100g":0,"typicalPortionGrams":300,"confidence":0.7,"description":"courte description"}`,
          },
        ],
        temperature: 0.2,
        max_tokens: 256,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Groq API error:', response.status, errText.slice(0, 300));
      if (response.status === 429) {
        return NextResponse.json({ error: 'Rate limit Groq, reessaie dans quelques secondes' }, { status: 429 });
      }
      return NextResponse.json({ error: "Erreur lors de l'estimation" }, { status: 500 });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    const parsed = JSON.parse(text);

    return NextResponse.json({
      name: (parsed.name as string) || foodName,
      caloriesPer100g: Math.max(0, Math.round((parsed.caloriesPer100g as number) || 0)),
      proteinPer100g: Math.max(0, Math.round(((parsed.proteinPer100g as number) || 0) * 10) / 10),
      carbsPer100g: Math.max(0, Math.round(((parsed.carbsPer100g as number) || 0) * 10) / 10),
      fatPer100g: Math.max(0, Math.round(((parsed.fatPer100g as number) || 0) * 10) / 10),
      typicalPortionGrams: Math.max(50, Math.round((parsed.typicalPortionGrams as number) || 200)),
      confidence: Math.min(1, Math.max(0, (parsed.confidence as number) || 0.5)),
      description: (parsed.description as string) || '',
    });
  } catch (err) {
    console.error('Estimate food error:', err);
    return NextResponse.json({ error: "Erreur lors de l'estimation" }, { status: 500 });
  }
}
