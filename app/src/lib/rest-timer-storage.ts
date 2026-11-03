export type SetRest = { setId: string; endTime: number; duration: number };

export function remainingSeconds(rest: SetRest | null, now = Date.now()) {
  return rest ? Math.max(0, Math.ceil((rest.endTime - now) / 1000)) : 0;
}

export function readSetRest(key: string): SetRest | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const rest = JSON.parse(raw);
    if (typeof rest?.setId !== 'string' || !rest.setId ||
        !Number.isSafeInteger(rest.endTime) || rest.endTime <= 0 ||
        !Number.isSafeInteger(rest.duration) || rest.duration <= 0) return null;
    return rest;
  } catch {
    return null;
  }
}

export function saveSetRest(key: string, rest: SetRest | null) {
  try {
    if (rest) sessionStorage.setItem(key, JSON.stringify(rest));
    else sessionStorage.removeItem(key);
  } catch { /* Keep the live timer usable when browser storage is unavailable. */ }
}
