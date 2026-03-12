'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

export default function NavigationProgress() {
  const pathname = usePathname()
  const [active, setActive] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Navigation complete → hide bar
  useEffect(() => {
    setActive(false)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }, [pathname])

  // Intercept internal link clicks → show bar
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a[href]')
      if (!anchor) return
      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) return
      const url = new URL(href, location.origin)
      if (url.origin !== location.origin) return
      if (url.pathname === pathname && !url.search) return
      setActive(true)
      // Safety: hide after 8s if navigation hangs
      timeoutRef.current = setTimeout(() => setActive(false), 8000)
    }

    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [pathname])

  if (!active) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        zIndex: 9999,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: '100%',
          background: 'linear-gradient(90deg, transparent, #d4af37, transparent)',
          animation: 'graal-bar 1.2s ease-in-out infinite',
        }}
      />
    </div>
  )
}
