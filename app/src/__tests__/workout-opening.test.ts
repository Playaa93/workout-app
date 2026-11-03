import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import WorkoutOpening from '@/components/WorkoutOpening';

describe('workout opening before hydration', () => {
  it('already provides a native link to the exact session while local queries are pending', () => {
    const html = renderToStaticMarkup(createElement(WorkoutOpening, { sessionId: 'session-1' }));
    expect(html).toContain('href="/workout/active/en-ligne?id=session-1"');
    expect(html).toContain('Ouvrir la séance en ligne');
  });

  it('can recover the open session from the account without a URL parameter', () => {
    const html = renderToStaticMarkup(createElement(WorkoutOpening));
    expect(html).toContain('href="/workout/active/en-ligne"');
  });
});
