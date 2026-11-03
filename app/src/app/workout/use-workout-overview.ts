import { useEffect, useState } from 'react';
import { useQuery } from '@powersync/react';
import { getWorkoutOverview } from './overview-actions';

type Overview = Awaited<ReturnType<typeof getWorkoutOverview>>;

export function useWorkoutOverviewFallback(needed: boolean, connected: boolean) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Overview | 'failed' | null>(null);
  // Prefer pending local edits or deletions to an older server copy.
  const { data: mutations } = useQuery<{ id: string }>(
    `SELECT DISTINCT json_extract(data, '$.id') AS id FROM ps_crud
     WHERE json_extract(data, '$.type') IN ('workout_sessions', 'workout_templates')`
  );
  const pendingIds = new Set(mutations.map(row => row.id));
  const pendingRevision = [...pendingIds].sort().join(',');

  useEffect(() => {
    if (!needed) return;
    let active = true;
    getWorkoutOverview().then(
      data => { if (active) setResult(data); },
      () => { if (active) setResult('failed'); },
    );
    const retry = () => setAttempt(n => n + 1);
    window.addEventListener('online', retry);
    return () => { active = false; window.removeEventListener('online', retry); };
  }, [needed, connected, attempt, pendingRevision]);

  const onlineCopy = needed && result && result !== 'failed' ? result : null;
  return {
    server: onlineCopy && {
      sessions: onlineCopy.sessions.filter(session => !pendingIds.has(session.id)),
      templates: onlineCopy.templates.filter(template => !pendingIds.has(template.id)),
    },
    waiting: needed && !result,
    failed: needed && result === 'failed',
    retry: () => { setResult(null); setAttempt(n => n + 1); },
  };
}
