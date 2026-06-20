'use client'

import { useEffect, useRef } from 'react'
import { logoutAll } from '@/lib/store'

const IDLE_MS = 15 * 60 * 1000 // 15 minutes
const EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const

export function useIdleLogout(enabled = true) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!enabled) return

    const reset = () => {
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        logoutAll()
        window.location.href = '/login?reason=idle'
      }, IDLE_MS)
    }

    reset()
    EVENTS.forEach(e => window.addEventListener(e, reset, { passive: true }))

    return () => {
      if (timer.current) clearTimeout(timer.current)
      EVENTS.forEach(e => window.removeEventListener(e, reset))
    }
  }, [enabled])
}
