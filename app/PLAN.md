# Plan: Intégration Morphologie → Programme d'Entraînement

## Objectif
Utiliser les données morphologiques collectées (proportions, mobilité, insertions, métabolisme) pour:
1. **Option A**: Générer un programme d'entraînement personnalisé après les résultats morpho
2. **Option B**: Afficher des conseils morpho en temps réel lors de la sélection d'exercices

---

## Phase 1: Infrastructure Core

### 1.1 Scoring Engine (`/src/lib/morpho-exercise-scoring.ts`)
Créer un algorithme qui score chaque exercice selon le profil morphologique:

```typescript
type ExerciseScore = {
  score: number; // 0-100
  advantages: string[];
  disadvantages: string[];
  modifications: string[];
  cues: string[]; // Conseils de placement
};

function scoreExercise(exercise: Exercise, morphoProfile: MorphotypeResult): ExerciseScore
```

Critères de scoring:
- Proportions (bras longs → avantage deadlift, désavantage bench)
- Mobilité (cheville limitée → éviter squat ATG, préférer sumo)
- Insertions (biceps courts → avantage développement peak)
- Métabolisme (ecto → plus de repos, moins de volume)

### 1.2 Base de données Recommandations
Enrichir les 70+ exercices existants avec le champ `morphotypeRecommendations`:

```typescript
{
  idealFor: {
    armLength: ['long'],
    femurLength: ['short', 'medium'],
    ankleMobility: ['good', 'moderate']
  },
  avoidIf: {
    ankleMobility: ['limited'],
    wristMobility: ['pronounced']
  },
  modifications: {
    femurLength: {
      long: ['Écarter les pieds', 'Pieds en canard 30°'],
      short: ['Stance étroite possible']
    }
  },
  cues: {
    armLength: {
      short: ['Grip plus serré au bench'],
      long: ['Grip large au deadlift']
    }
  }
}
```

---

## Phase 2: Option B - Tips Morpho en Temps Réel

### 2.1 Composant MorphoTipsPanel
Créer `/src/components/workout/MorphoTipsPanel.tsx`:
- Affiche le score de compatibilité (0-100)
- Liste les avantages/inconvénients
- Affiche les modifications recommandées
- Bouton "Appliquer les conseils" qui pré-remplit les notes

### 2.2 Intégration ExercisePicker
Modifier `/src/app/workout/active/page.tsx`:
- Récupérer le profil morpho au chargement
- Afficher un badge de score sur chaque exercice
- Panneau dépliable avec détails morpho
- Tri optionnel par compatibilité morphologique

### 2.3 UI/UX
- Badge coloré: Vert (80+), Jaune (50-79), Rouge (<50)
- Icône 🧬 pour indiquer les tips morpho disponibles
- Panneau non-intrusif, ferme automatiquement après sélection

---

## Phase 3: Option A - Générateur de Programme

### 3.1 Nouvelle Page `/workout/program`
Structure:
```
/workout/program
├── page.tsx (wizard en 3 étapes)
├── components/
│   ├── GoalSelector.tsx (force, hypertrophie, endurance)
│   ├── SplitSelector.tsx (full body, PPL, upper/lower, bro split)
│   ├── ScheduleSelector.tsx (3-6 jours/semaine)
│   └── ProgramPreview.tsx (preview avant génération)
└── actions.ts (génération du programme)
```

### 3.2 Algorithme de Génération
1. Sélectionner les exercices selon:
   - Objectif (force → compound, hypertro → isolation aussi)
   - Split choisi (répartition muscles)
   - Score morphologique (priorité aux exercices compatibles)

2. Paramétrer le volume:
   - Métabolisme ecto → moins de volume, plus de repos
   - Métabolisme endo → plus de volume, moins de repos
   - Métabolisme méso → équilibré

3. Ajouter automatiquement:
   - Travail de mobilité si déficit détecté
   - Exercices correctifs si valgus genou/poignet

### 3.3 Output
- Créer un `workoutTemplate` dans la DB
- Chaque séance avec exercices, séries, reps, repos
- Notes pré-remplies avec conseils morpho
- L'utilisateur peut modifier le programme généré

### 3.4 UI Flow
```
[Résultats Morpho]
    → Bouton "Générer mon programme"
    → Étape 1: Objectif (force/hypertro/endurance)
    → Étape 2: Split (full body/PPL/etc)
    → Étape 3: Jours disponibles
    → Preview avec exercices scorés
    → Confirmer → Programme sauvegardé
```

---

## Fichiers à Créer/Modifier

### Nouveaux fichiers:
1. `/src/lib/morpho-exercise-scoring.ts` - Scoring engine
2. `/src/app/workout/program/page.tsx` - Wizard générateur
3. `/src/app/workout/program/actions.ts` - Server actions
4. `/src/components/workout/MorphoTipsPanel.tsx` - Panel tips

### Fichiers à modifier:
1. `/src/app/workout/active/page.tsx` - Intégrer tips dans ExercisePicker
2. `/src/app/morphology/results.tsx` - Ajouter bouton "Générer programme"
3. `/src/db/schema.ts` - Activer workoutTemplates si besoin
4. `/src/lib/exercises.ts` - Enrichir avec morphotypeRecommendations

---

## Ordre d'Implémentation

1. **Phase 1**: Infrastructure (scoring engine + enrichir exercices)
2. **Phase 2**: Option B (tips temps réel) - Valeur immédiate
3. **Phase 3**: Option A (générateur programme) - Plus complexe

L'Option B est prioritaire car elle apporte de la valeur sans créer de nouveaux flux, juste en enrichissant l'existant.

---

## Notes Techniques

- Utiliser `getMorphoProfile()` existant pour récupérer les données
- Le scoring doit être côté serveur (server action) pour ne pas exposer la logique
- Cache le profil morpho côté client pendant la session workout
- Les modifications sont des suggestions, l'utilisateur garde le contrôle total
