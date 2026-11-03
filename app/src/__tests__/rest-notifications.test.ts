import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const script = readFileSync(new URL('../../public/sw.js', import.meta.url), 'utf8');
const origin = 'https://workout.example';

function setup() {
  type WorkerEvent = { data?: unknown; source?: unknown; notification?: unknown; waitUntil(work: Promise<void>): void };
  const handlers: Record<string, (event: WorkerEvent) => void> = {};
  const tab = { id: 'tab-a', type: 'window', visibilityState: 'hidden', focus: vi.fn() };
  const clients = {
    get: vi.fn(async () => tab),
    matchAll: vi.fn(async () => [tab]),
    openWindow: vi.fn(),
  };
  const registration = {
    showNotification: vi.fn<(title: string, options: NotificationOptions) => Promise<void>>().mockResolvedValue(undefined),
    getNotifications: vi.fn<(filter: { tag: string }) => Promise<Partial<Notification>[]>>().mockResolvedValue([]),
  };
  runInNewContext(script, {
    self: {
      location: { origin }, clients, registration,
      addEventListener: (type: string, callback: (event: WorkerEvent) => void) => { handlers[type] = callback; },
    },
    Date, URL, URLSearchParams, crypto, setTimeout, clearTimeout,
  });
  function send(seconds: number, source = tab) {
    let done!: Promise<void>;
    handlers.message({
      source, data: { type: 'REST_TIMER_DEADLINE', endTime: seconds ? Date.now() + seconds * 1000 : 0, sessionId: 's1' },
      waitUntil: work => { done = work; },
    });
    return done;
  }
  function click(data: Record<string, string>) {
    let done!: Promise<void>;
    handlers.notificationclick({ notification: { data, close: vi.fn() }, waitUntil: work => { done = work; } });
    return done;
  }
  return { clients, registration, tab, send, click };
}

describe('rest notifications', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('shows one silent completion for a hidden tab at its adjusted deadline', async () => {
    const { send, registration } = setup();
    const first = send(30);
    const adjusted = send(60);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(registration.showNotification).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(30_000);
    await Promise.all([first, adjusted]);
    expect(registration.showNotification).toHaveBeenCalledTimes(1);
    const [title, options] = registration.showNotification.mock.calls[0];
    expect(title).toBe('Repos terminé');
    expect(options.silent).toBe(true);
    expect(options).not.toHaveProperty('vibrate');
    expect(options).not.toHaveProperty('renotify', true);
    expect(options.data).toMatchObject({ clientId: 'tab-a', sessionId: 's1' });
  });

  it('cancels only the originating tab, even before its alarm fires', async () => {
    const { send, registration, tab } = setup();
    const a = send(30);
    const b = send(30, { ...tab, id: 'tab-b' });
    await send(0);
    await vi.advanceTimersByTimeAsync(30_000);
    await Promise.all([a, b]);
    expect(registration.showNotification).toHaveBeenCalledTimes(1);
    expect(registration.showNotification.mock.calls[0][1].data.clientId).toBe('tab-b');
    expect(registration.getNotifications).toHaveBeenCalledWith({ tag: 'rest-timer-tab-a' });
  });

  it('leaves foreground feedback to the page and tolerates a revoked permission', async () => {
    const { send, tab, registration } = setup();
    const foreground = send(30);
    tab.visibilityState = 'visible';
    await vi.advanceTimersByTimeAsync(30_000);
    await foreground;
    expect(registration.showNotification).not.toHaveBeenCalled();

    tab.visibilityState = 'hidden';
    registration.showNotification.mockRejectedValueOnce(new Error('Permission denied'));
    const denied = send(30);
    await vi.advanceTimersByTimeAsync(30_000);
    await expect(denied).resolves.toBeUndefined();
  });

  it('discards a stale alert when the browser wakes long after the rest', async () => {
    const { send, registration } = setup();
    const done = send(30);
    vi.setSystemTime(Date.now() + 600_000);
    await vi.advanceTimersByTimeAsync(30_000);
    await done;
    expect(registration.showNotification).not.toHaveBeenCalled();
  });

  it('closes a notification if the rest was cancelled during delivery', async () => {
    const { send, registration } = setup();
    let delivered!: () => void;
    registration.showNotification.mockImplementationOnce(() => new Promise(resolve => { delivered = resolve; }));
    const done = send(1);
    await vi.advanceTimersByTimeAsync(1000);
    await send(0);
    const close = vi.fn();
    registration.getNotifications.mockResolvedValueOnce([{ data: registration.showNotification.mock.calls[0][1].data, close }]);
    delivered();
    await done;
    expect(close).toHaveBeenCalledOnce();
  });

  it('focuses the owning tab or reopens the originating workout', async () => {
    const { click, tab, clients } = setup();
    const data = { clientId: tab.id, sessionId: 's1' };
    await click(data);
    expect(tab.focus).toHaveBeenCalledOnce();
    clients.matchAll.mockResolvedValue([]);
    await click(data);
    expect(clients.openWindow).toHaveBeenCalledWith(origin + '/workout/active?id=s1');
  });
});
