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
 * Vide le stack d'overlays avant une navigation programmatique (router.push).
 *
 * Ne appelle PAS entry.close() — évite des re-renders inutiles juste avant
 * l'unmount. Ne touche PAS à history — évite d'annuler le router.push.
 *
 * Les entrées pushState des overlays restent dans l'historique du navigateur.
 * C'est bénin : au retour arrière l'utilisateur atterrit sur la même URL
 * (pushState ne change pas l'URL) et l'overlay ne se rouvre pas car
 * le composant a été unmonté.
 *
 * Au unmount, les cleanup effects appellent removeEntry() sur les entrées
 * qui avaient un entryRef. Comme le stack est vide, indexOf retourne -1
 * et removeEntry est un no-op — pas de history.back() parasite.
 */
export function dismissAllOverlays(): void {
  if (stack.length === 0) return;
  stack.length = 0;
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
