import { randomUUID } from 'node:crypto';
import { and, desc, eq, isNull, or } from 'drizzle-orm';
import { db, exercises, workoutSessions } from '@/db';
import { requireUserId } from '@/lib/auth';
import { getSavedWorkout } from '../../overview-actions';
import { finishOnlineWorkout, recordOnlineSet } from './writes';
import OnlineRest from './OnlineRest';
import styles from './workout.module.css';

export const dynamic = 'force-dynamic';

export default async function OnlineWorkout({ searchParams }: {
  searchParams: Promise<{ id?: string; saved?: string; error?: string }>;
}) {
  const userId = await requireUserId();
  const params = await searchParams;
  const id = params.id || (await db.select({ id: workoutSessions.id }).from(workoutSessions)
    .where(and(eq(workoutSessions.userId, userId), eq(workoutSessions.sessionType, 'strength'), isNull(workoutSessions.endedAt)))
    .orderBy(desc(workoutSessions.startedAt)).limit(1))[0]?.id;
  const workout = typeof id === 'string' && /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(id) ? await getSavedWorkout(id) : null;
  if (!workout || !id) return <main className={styles.page}><h1>Séance introuvable</h1><a href="/workout">Mes séances</a></main>;

  const choices = new Map(workout.plan.map(ex => [ex.exerciseId, ex]));
  for (const set of workout.sets) {
    if (set.exerciseId && !choices.has(set.exerciseId)) choices.set(set.exerciseId, { exerciseId: set.exerciseId, name: set.name, targetSets: null, rest: set.rest });
  }
  const catalog = !workout.endedAt && !workout.plan.length ? await db.select({ id: exercises.id, name: exercises.nameFr }).from(exercises)
    .where(or(isNull(exercises.createdBy), eq(exercises.createdBy, userId))).orderBy(exercises.nameFr) : [];
  const cards = [...choices.values()].map(ex => {
    const sets = workout.sets.filter(set => set.exerciseId === ex.exerciseId);
    return { ...ex, sets, done: sets.filter(set => !set.isWarmup).length };
  });
  const pending = cards.filter(ex => !ex.targetSets || ex.done < ex.targetSets);
  const latest = workout.sets.findLast(set => pending.some(ex => ex.exerciseId === set.exerciseId));
  const currentId = latest?.exerciseId || pending[0]?.exerciseId;
  const saved = workout.sets.find(set => set.id === params.saved);

  function form(exerciseId?: string, previous?: NonNullable<Awaited<ReturnType<typeof getSavedWorkout>>>['sets'][number], rest = 90) {
    return <form action={recordOnlineSet} className={styles.form}>
      <input type="hidden" name="session" value={id} />
      <input type="hidden" name="submission" value={randomUUID()} />
      {exerciseId ? <input type="hidden" name="exercise" value={exerciseId} /> :
        <label>Exercice<select name="exercise" required defaultValue=""><option value="" disabled>Choisir un exercice</option>
          {catalog.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}</select></label>}
      <div className={styles.fields}>
        <label>Répétitions<input name="reps" type="number" inputMode="numeric" min="1" max="100" defaultValue={previous?.reps ?? ''} required /></label>
        <label>Poids (kg)<input name="weight" type="number" inputMode="decimal" step="0.01" min="0" max="9999.99" defaultValue={Number(previous?.weight ?? 0)} required /></label>
        <label>Repos (s)<input name="rest" type="number" inputMode="numeric" min="0" max="600" defaultValue={rest} required /></label>
      </div>
      <label className={styles.check}><input type="checkbox" name="warmup" /> Échauffement</label>
      <button type="submit">Valider la série</button>
    </form>;
  }

  return <main className={styles.page}>
    <a href="/workout">← Mes séances</a>
    <header><p>{workout.endedAt ? 'Séance terminée' : 'Séance en cours'}</p><h1>{workout.title}</h1>
      <span>{workout.sets.length} série{workout.sets.length !== 1 && 's'} enregistrée{workout.sets.length !== 1 && 's'}</span></header>
    {params.error && <p role="alert">{params.error === 'values' ? 'Vérifie les répétitions, le poids et le repos.' : 'Cette série ne peut plus être ajoutée à la séance.'}</p>}
    {saved && !workout.endedAt && <section role="status">Série enregistrée · {saved.name}
      {!!saved.rest && saved.performedAt && <OnlineRest duration={saved.rest} until={saved.performedAt.getTime() + saved.rest * 1000} />}</section>}
    {cards.map(ex => <section key={ex.exerciseId} aria-current={!workout.endedAt && ex.exerciseId === currentId ? 'step' : undefined}>
      <p>{!workout.endedAt && ex.exerciseId === currentId ? 'En cours · ' : ''}{ex.done}{ex.targetSets ? `/${ex.targetSets}` : ''} séries</p>
      <h2>{ex.name}</h2>
      {ex.sets.length > 0 && <ul>{ex.sets.map(set => <li key={set.id}>{set.isWarmup && 'Échauff. · '}{set.reps} × {Number(set.weight ?? 0)} kg</li>)}</ul>}
      {!workout.endedAt && <details open={ex.exerciseId === currentId}><summary>Ajouter une série</summary>
        {form(ex.exerciseId, ex.sets.at(-1), ex.sets.at(-1)?.rest ?? ex.rest ?? 90)}</details>}
    </section>)}
    {catalog.length > 0 && <section><h2>{cards.length ? 'Autre exercice' : 'Première série'}</h2>{form()}</section>}
    {!workout.endedAt && <details className={styles.finish}><summary>Terminer la séance</summary>
      <p>Clôturer la séance avec les {workout.sets.length} séries enregistrées et calculer son bilan ?</p><form action={finishOnlineWorkout}>
        <input type="hidden" name="session" value={id} /><button>Confirmer la fin de séance</button>
      </form></details>}
    <a href={`/workout/active?id=${id}&local=1`}>Revenir à l’éditeur complet</a>
  </main>;
}
