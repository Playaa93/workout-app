'use client';

import { useEffect, useRef } from 'react';

/**
 * Synchronise l'état open/close d'un overlay avec l'historique du navigateur.
 *
 * Architecture : stack centralisé module-level + un seul popstate listener.
 * Quand un overlay s'ouvre → pushState + push sur le stack.
 * Quand retour est pressé → pop le stack, ferme l'overlay du sommet uniquement.
 * Quand l'overlay se ferme via UI → history.back() silencieux.
 * Les entrées orphelines (fermeture non-LIFO) sont drainées automatiquement.
 */

type StackEntry = { key: string; close: () => void };

// Module-level — un seul état partagé par toutes les instances
const stack: StackEntry[] = [];
let ignoreCount = 0;
let orphanCount = 0;
let listenerAttached = false;

function ensureListener() {
  if (!listenerAttached) {
    window.addEventListener('popstate', handlePopState);
    listenerAttached = true;
  }
}

function cleanupListener() {
  if (stack.length === 0 && orphanCount === 0 && listenerAttached) {
    window.removeEventListener('popstate', handlePopState);
    listenerAttached = false;
  }
}

function drainOrphans() {
  if (orphanCount > 0) {
    orphanCount--;
    ignoreCount++;
    history.back();
  } else {
    cleanupListener();
  }
}

function handlePopState() {
  if (ignoreCount > 0) {
    ignoreCount--;
    drainOrphans();
    return;
  }
  if (stack.length > 0) {
    const top = stack.pop()!;
    top.close();
  }
  drainOrphans();
}

function removeEntry(entry: StackEntry) {
  const idx = stack.indexOf(entry);
  if (idx === -1) return;
  stack.splice(idx, 1);
  if (idx === stack.length) {
    // Était le sommet du stack → pop l'entrée historique correspondante
    ignoreCount++;
    history.back();
  } else {
    // Pas le sommet → l'entrée historique devient orpheline
    orphanCount++;
  }
  cleanupListener();
}

/**
 * Détache toutes les entrées du stack sans appeler history.back().
 * À appeler avant un router.push() programmatique pour éviter que
 * les cleanups au unmount n'annulent la navigation.
 */
export function dismissAllOverlays(): void {
  while (stack.length > 0) {
    const entry = stack.pop()!;
    entry.close();
  }
  // Les entrées historiques correspondantes deviennent orphelines
  // et seront drainées par le prochain popstate.
  orphanCount = 0;
  ignoreCount = 0;
  cleanupListener();
}

export function useBackHandler(
  open: boolean,
  onClose: () => void,
  key = 'overlay',
): void {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const entryRef = useRef<StackEntry | null>(null);

  useEffect(() => {
    if (open && !entryRef.current) {
      // Overlay s'ouvre → push sur le stack et dans l'historique
      const entry: StackEntry = {
        key,
        close() {
          entryRef.current = null;
          onCloseRef.current();
        },
      };
      entryRef.current = entry;
      ensureListener();
      stack.push(entry);
      history.pushState({ __overlay: key }, '');
    } else if (!open && entryRef.current) {
      // Overlay fermé via UI → retirer du stack et back silencieux
      const entry = entryRef.current;
      entryRef.current = null;
      removeEntry(entry);
    }
  }, [open, key]);

  // Cleanup au unmount
  useEffect(() => {
    return () => {
      if (entryRef.current) {
        const entry = entryRef.current;
        entryRef.current = null;
        removeEntry(entry);
      }
    };
  }, []);
}
