import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import OnlineWorkout from '@/app/workout/active/en-ligne/page';
import { getEditorSession, getEditorPreferences } from '@/app/workout/active/en-ligne/reads';
import { getSavedWorkout } from '@/app/workout/overview-actions';

vi.mock('@/lib/auth', () => ({ requireUserId: async () => 'owner' }));
vi.mock('@/db', () => ({}));
vi.mock('@/app/workout/active/en-ligne/reads', () => ({ getEditorSession: vi.fn(), getEditorPreferences: vi.fn(), getFinishedWorkoutInfo: vi.fn() }));
vi.mock('@/app/workout/overview-actions', () => ({ getSavedWorkout: vi.fn() }));
vi.mock('@/app/workout/active/en-ligne/writes', () => ({}));
vi.mock('@/app/workout/summary/SummaryView', () => ({ OnlineStrengthSummary: () => null }));
vi.mock('@/app/workout/active/en-ligne/OnlineEditor', () => ({
  default: () => createElement('main', null, 'éditeur de séance'),
}));

describe('reprise des séances du compte', () => {
  const id = '00000000-0000-4000-8000-000000000123';
  beforeEach(() => vi.resetAllMocks());

  it('ouvre directement l’éditeur pour une séance en cours, y compris depuis un ancien lien', async () => {
    vi.mocked(getEditorSession).mockResolvedValue({ session: { id, endedAt: null }, sets: [], plan: [] } as unknown as NonNullable<Awaited<ReturnType<typeof getEditorSession>>>);
    vi.mocked(getEditorPreferences).mockResolvedValue({ catalog: [], morphotype: null, notificationsAllowed: true });
    const html = renderToStaticMarkup(await OnlineWorkout({ searchParams: Promise.resolve({ id, saved: 'ancienne-série' }) }));
    expect(html).toContain('éditeur de séance');
    expect(getEditorSession).toHaveBeenCalledWith(id);
    expect(getSavedWorkout).not.toHaveBeenCalled();
  });

  it('refuse un identifiant absent du compte avant de charger les préférences', async () => {
    vi.mocked(getEditorSession).mockResolvedValue(null);
    const html = renderToStaticMarkup(await OnlineWorkout({ searchParams: Promise.resolve({ id }) }));
    expect(html).toContain('Séance introuvable');
    expect(getEditorPreferences).not.toHaveBeenCalled();
  });
});
