import { NextResponse } from 'next/server';
import { getGroqContext, callGroqChat, GROQ_TEXT_MODEL } from '@/lib/groq';

export async function POST(request: Request) {
  const ctx = await getGroqContext();
  if ('error' in ctx) return ctx.error;

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
    const parsed = await callGroqChat(
      ctx.apiKey,
      [
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
      { model: GROQ_TEXT_MODEL, max_tokens: 256, jsonMode: true }
    );

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
