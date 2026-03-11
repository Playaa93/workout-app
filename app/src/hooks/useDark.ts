'use client'

import { useTheme } from 'next-themes'

export function useDark() {
  const { resolvedTheme } = useTheme()
  return resolvedTheme !== 'light'
}
