'use client'

import { useTheme } from 'next-themes'
import { DARK_THEMES, type ThemeId } from '@/lib/theme-presets'

/** Returns the resolved ThemeId and a dark-mode boolean (single useTheme call) */
export function useThemeTokens(): { t: ThemeId; d: boolean } {
  const { resolvedTheme } = useTheme()
  const t = (resolvedTheme as ThemeId) || 'dark'
  return { t, d: DARK_THEMES.has(t) }
}
