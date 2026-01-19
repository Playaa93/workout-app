---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-03-success', 'step-04-journeys']
inputDocuments: ['product-brief-Workout-2026-01-19.md', 'market-fitness-apps-concurrents-research-2026-01-19.md', 'brainstorming-session-2026-01-19.md']
workflowType: 'prd'
documentCounts:
  briefs: 1
  research: 1
  brainstorming: 1
  projectDocs: 0
classification:
  projectType: web_app
  domain: health_fitness
  complexity: medium
  projectContext: greenfield
---

# Product Requirements Document - Workout

**Author:** haze
**Date:** 2026-01-19

---

## Success Criteria

### User Success

| Critère | Mesure | Cible |
|---------|--------|-------|
| **Zéro culpabilité** | Écarts loggés sans abandon | 100% des écarts loggés |
| **Friction minimale** | Temps par entrée | <30 secondes |
| **Utilisation naturelle** | Ouverture app quotidienne | Sans effort conscient |
| **Aha! Moments** | Réactions positives sur suggestions morpho | Au moins 1 par semaine |
| **Continuité après écart** | Reprise du logging après "craquage" | Pas d'abandon >3 jours |

**North Star Metric :** Nombre de jours où l'utilisateur a loggé quelque chose SANS ressentir de culpabilité.

### Business Success

| Phase | Objectif | Indicateur |
|-------|----------|------------|
| **MVP v0 (0-3 mois)** | Dogfooding réussi | 2 utilisateurs actifs 30 jours consécutifs |
| **Beta (3-6 mois)** | Validation élargie | 5-10 beta testeurs avec rétention >50% |
| **Validation (6+ mois)** | Product-market fit signal | Retours positifs d'inconnus |

### Technical Success

| Critère | Mesure | Cible |
|---------|--------|-------|
| **Performance** | Temps de chargement initial | <3 secondes |
| **Fiabilité** | Perte de données | 0% |
| **Disponibilité** | Uptime | >99% |
| **Responsive** | Compatibilité mobile | iOS Safari + Android Chrome |
| **PWA** | Installation possible | Score Lighthouse >90 |

### Measurable Outcomes

**À 30 jours :**
- [ ] App utilisée quotidiennement par 2 personnes
- [ ] Zéro feedback négatif sur culpabilité
- [ ] Analyse morpho jugée "utile"
- [ ] Temps de logging moyen <30s

**À 90 jours :**
- [ ] 5+ beta testeurs actifs
- [ ] Rétention J30 >50%
- [ ] Mode "J'ai envie de..." utilisé régulièrement
- [ ] Zéro bug bloquant

---

## Product Scope

### MVP - Minimum Viable Product

**Priorité 1 : Analyse Morphologique**
- Questionnaire Delavier/Gundill (5-10 questions)
- Profil morphologique avec points forts/faibles
- Exercices recommandés/déconseillés par morphotype

**Priorité 2 : Mensurations**
- Saisie manuelle des mesures corporelles
- Photos Before/After avec timeline
- Historique graphique d'évolution

**Priorité 3 : Entraînement**
- Dashboard action-first (+🏋️ +📏 +🍎)
- Tracking workout (exercice, séries, reps, poids, RPE)
- Chronomètre repos, bibliothèque 100+ exercices

**Priorité 4 : Diète**
- Tracking manuel + base de données aliments
- OCR/Photo IA pour reconnaissance
- Mode "J'ai envie de..." + tracking invisible (moyenne 7j)

**Priorité 5 : Gamification**
- XP & Niveaux, Streaks intelligents
- Boss Fights / PR Days
- Avatar évolutif, Workout Wrapped

### Growth Features (Post-MVP)

| Feature | Raison du report |
|---------|------------------|
| Apple Watch | Complexité technique |
| Buddy Matching | Social après validation core |
| Mode hors-ligne complet | PWA basic first |
| Multi-langue | Français d'abord |

### Vision (Future)

- **v1.5** : Apple Watch, offline avancé
- **v2.0** : Social (buddy matching, partage)
- **v3.0** : Coach IA conversationnel
- **Scale** : International, partenariats salles

---

## User Journeys

### Alex — "La Semaine Sans Culpabilité"
Utilisateur intermédiaire (3-4x/semaine) qui découvre l'app après avoir perdu un streak sur MyFitnessPal. L'analyse morpho lui révèle pourquoi il galère au squat. Il logge un écart (pizza) sans culpabilité grâce au tracking invisible. Première semaine complète sans stress.

### Marie — "Les Premiers Pas Sans Peur"
Débutante intimidée par la salle. L'onboarding morpho lui donne un feedback positif sur son corps. Elle suit des séances guidées, prend des photos before/after, et utilise "J'ai envie d'un Big Mac" sans jugement. Recommande l'app après 1 mois.

### Thomas — "Le Boss Fight Épique"
Passionné avancé (5-6x/semaine) qui stagne au DC. L'analyse morpho lui donne des conseils techniques précis. Il utilise le mode Boss Fight pour battre son PR. Partage son Workout Wrapped sur Instagram.

### L'Écart — "Le Moment Où On Craque"
Parcours critique : soirée arrosée, rien de loggé. L'utilisateur ouvre l'app, logge "soirée arrosée", reçoit zéro jugement. La spirale de culpabilité ne démarre pas. Il reprend le lendemain normalement.

### Journey Requirements Summary

| Capability | Parcours source |
|------------|-----------------|
| Analyse morphologique | Alex, Marie, Thomas |
| Dashboard action-first | Tous |
| Tracking invisible (moyenne 7j) | Alex, L'Écart |
| Gamification (XP, Boss Fights) | Thomas |
| Photos before/after | Marie |
| Mode "J'ai envie de..." | Marie |
| Zéro alertes négatives | L'Écart |

---
