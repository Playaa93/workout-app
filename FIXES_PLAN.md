# Plan de correction des incohérences

## Phase 1 — HIGH (bugs critiques / exploitables)

### 1.1 PR avec 0 kg / 0 reps (`workout/actions.ts` ~L248-261)
- Ajouter un guard `weight > 0 && reps > 0 && !isWarmup` avant de calculer `isPr`
- Corrige aussi le finding #1 (warmup sets stockés `isPr: true`)

### 1.2 Streaks jamais mises à jour (`profile/actions.ts`, `diet/actions.ts`, `workout/actions.ts`, `cardio-actions.ts`)
- `updateStreak()` existe (~L378) mais n'est jamais appelé
- Appeler `updateStreak()` depuis :
  - `endWorkoutSession` (après le bloc XP)
  - `endCardioSession` (après le bloc XP)
  - `awardDietXp` (après l'update gamification)
- S'assurer que `updateStreak()` ne s'exécute que si XP > 0

### 1.3 XP farming diète — cap journalier (`diet/actions.ts` ~L266-296)
- Ajouter un cap de 50 XP/jour pour les entrées food
- Vérifier le total XP diet déjà gagné aujourd'hui avant d'en attribuer
- Rejeter les entrées avec `quantity <= 0`

### 1.4 Achievements comptent les séances non terminées (`profile/actions.ts` ~L219)
- Filtrer `endedAt IS NOT NULL` dans le count de `workoutSessions`

### 1.5 50 XP pour 30s de cardio (`cardio-utils.ts` L58 + `cardio-actions.ts`)
- Exiger une durée minimum de 5 min OU distance > 500m pour le baseXp
- Ajouter le guard `if (totalXp > 0)` autour de l'insertion XP cardio (comme côté strength)

### 1.6 Suppression de set PR laisse un orphelin (`workout/actions.ts` ~L305-308)
- Avant de supprimer le set, vérifier s'il a `isPr: true`
- Si oui, supprimer l'entrée correspondante dans `personalRecords`

### 1.7 Import cardio sans validation (`cardio-actions.ts` ~L224-303)
- Valider `durationMinutes > 0`, `distanceMeters >= 0`
- Ajouter des limites raisonnables (vitesse max ~50 km/h pour la course, etc.)
- Appliquer le même minimum de 5 min pour le baseXp

## Phase 2 — MEDIUM (affichage trompeur)

### 2.1 Calories muscu avec 75 kg en dur (`workout/actions.ts` ~L313-334)
- Passer `userId` à `estimateCaloriesBurned` (ou le rendre async)
- Fetch le poids du profil nutrition, fallback 75 kg si absent

### 2.2 Division par zéro MacroBar (`diet/components/shared.tsx` ~L53)
- Protéger : `target > 0 ? (current / target) * 100 : 0`

### 2.3 "Bravo" pour effort quasi-nul (`summary/page.tsx`)
- Ajouter un état intermédiaire `isMinimal` (durée > 0 mais volume = 0, xp = 0)
- Afficher un message différent : "Séance courte — ajoute des exercices la prochaine fois"
- Cacher la carte "+0 XP" quand `xp === 0`

### 2.4 NaN quand quantité vidée (`diet/components/SearchView.tsx` ~L117)
- Remplacer `parseFloat(quantity)` par `parseFloat(quantity) || 0`

### 2.5 "0 kcal" affiché comme donnée réelle (`workout/page.tsx` + `summary/page.tsx`)
- Conditionner l'affichage : ne montrer que si `calories > 0`
- Remplacer par "—" sinon

## Phase 3 — LOW (edge cases)

### 3.1 Glucides potentiellement négatifs (`diet/actions.ts` ~L585)
- `Math.max(0, Math.round(carbCalories / 4))`

### 3.2 Poids profil "0" casse les calories cardio (`cardio-actions.ts` ~L155)
- Guard : `parseFloat(weight) > 0 ? ... : 75`

### 3.3 Double démarrage de programme (`workout/programs/page.tsx` ~L49)
- Désactiver TOUS les boutons quand un template est en cours de démarrage
- `disabled={startingTemplateId !== null}`

### 3.4 Food entries supprimées comptées dans achievements (`profile/actions.ts` ~L220)
- Filtrer `calories > 0` dans le count des food entries
