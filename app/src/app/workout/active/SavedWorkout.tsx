'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useStatus } from '@powersync/react';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { getSavedWorkout } from '../overview-actions';

// The live editor takes over when the local session arrives.
export default function SavedWorkout({ sessionId }: { sessionId: string }) {
  const { connected } = useStatus();
  const [saved, setSaved] = useState<Awaited<ReturnType<typeof getSavedWorkout>>>();
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    getSavedWorkout(sessionId).then(
      data => { if (active) { setSaved(data); setFailed(false); } },
      () => { if (active) setFailed(true); },
    );
    return () => { active = false; };
  }, [sessionId, connected, attempt]);

  return (
    <Stack spacing={2} sx={{ p: 2 }}>
      <Typography variant="h6">{saved?.title ?? 'Reprendre la séance'}</Typography>
      <Alert severity="info" action={failed && <Button onClick={() => setAttempt(n => n + 1)}>Réessayer</Button>}>
        {failed ? 'Impossible de vérifier la séance sur le serveur.'
          : saved === null ? 'Cette séance est introuvable sur ce compte.'
          : saved ? 'Séance enregistrée. La saisie reprendra dès que la synchronisation sera terminée.'
          : 'Chargement des séries enregistrées…'}
      </Alert>
      {saved?.sets.map(set => (
        <Box key={set.id}>
          <Typography variant="body2">{set.name} · {set.reps ?? '–'} × {set.weight ?? '–'} kg</Typography>
        </Box>
      ))}
      <Button component={Link} href="/workout" sx={{ alignSelf: 'flex-start' }}>Mes séances</Button>
    </Stack>
  );
}
