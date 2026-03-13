'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import {
  DARK_THEMES,
  THEME_FAMILIES,
  type ThemeFamilyId,
  type ThemeId,
} from '@/lib/theme-presets'

const FAMILY_KEY = 'workout-theme-family'
const MODE_KEY = 'workout-theme-mode'

export type ThemeMode = 'system' | 'light' | 'dark'

function getStored(key: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  return localStorage.getItem(key) || fallback
}

/**
 * Manages theme as family × mode.
 * - family: 'default' | 'navy' | 'gray' | 'cream'
 * - mode: 'system' | 'light' | 'dark'
 * Resolves the actual next-themes ThemeId from these two.
 */
export function useThemeFamily() {
  const { setTheme, resolvedTheme } = useTheme()
  const [family, setFamilyState] = useState<ThemeFamilyId>('default')
  const [mode, setModeState] = useState<ThemeMode>('system')
  const [mounted, setMounted] = useState(false)

  // Read stored prefs on mount
  useEffect(() => {
    const storedFamily = getStored(FAMILY_KEY, 'default') as ThemeFamilyId
    const storedMode = getStored(MODE_KEY, 'system') as ThemeMode
    setFamilyState(storedFamily)
    setModeState(storedMode)
    setMounted(true)
  }, [])

  // Resolve system preference
  const resolveMode = useCallback((m: ThemeMode): 'light' | 'dark' => {
    if (m !== 'system') return m
    if (typeof window === 'undefined') return 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }, [])

  // Apply theme whenever family or mode changes
  const applyTheme = useCallback((fam: ThemeFamilyId, m: ThemeMode) => {
    const def = THEME_FAMILIES[fam]
    if (!def) return
    const resolved = resolveMode(m)
    setTheme(def[resolved])
  }, [setTheme, resolveMode])

  // Listen for system preference changes when mode === 'system'
  useEffect(() => {
    if (!mounted || mode !== 'system') return
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme(family, 'system')
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [mounted, mode, family, applyTheme])

  // Apply on mount and when family/mode changes
  useEffect(() => {
    if (!mounted) return
    applyTheme(family, mode)
  }, [mounted, family, mode, applyTheme])

  const setFamily = useCallback((fam: ThemeFamilyId) => {
    localStorage.setItem(FAMILY_KEY, fam)
    setFamilyState(fam)
  }, [])

  const setMode = useCallback((m: ThemeMode) => {
    localStorage.setItem(MODE_KEY, m)
    setModeState(m)
  }, [])

  /** Toggle light↔dark within the current family (used by header toggle) */
  const toggleMode = useCallback(() => {
    const isDark = DARK_THEMES.has(resolvedTheme as ThemeId)
    setMode(isDark ? 'light' : 'dark')
  }, [resolvedTheme, setMode])

  // Derived values for design-token consumption
  const t = (resolvedTheme as ThemeId) || 'dark'
  const d = DARK_THEMES.has(t)

  return { family, mode, setFamily, setMode, toggleMode, t, d, mounted }
}
