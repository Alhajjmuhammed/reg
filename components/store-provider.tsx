'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { initStore } from '@/lib/store'

const StoreReadyContext = createContext(false)
export const useStoreReady = () => useContext(StoreReadyContext)

// Provided by AdminLayout after loadHeavyKeys() completes.
// Components that read participants/transactions/groups/notifications use this.
export const HeavyReadyContext = createContext(false)
export const useHeavyStoreReady = () => useContext(HeavyReadyContext)

// Increments every time a background refetch completes (window focus).
// Use as a useEffect dependency alongside storeReady to pick up live changes.
const StoreVersionContext = createContext(0)
export const useStoreVersion = () => useContext(StoreVersionContext)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const [version, setVersion] = useState(0)
  const lastFetchAt = useRef(0)

  useEffect(() => {
    // Hard fallback: if initStore() somehow never resolves (e.g. fetch hangs
    // despite the AbortController), unblock the UI after 8 seconds.
    const fallback = setTimeout(() => setReady(true), 8000)
    initStore().finally(() => {
      clearTimeout(fallback)
      setReady(true)
      lastFetchAt.current = Date.now()
    })
    return () => clearTimeout(fallback)
  }, [])

  // On window focus: silently re-fetch the store and bump version so that
  // components depending on useStoreVersion() re-read the latest data.
  // Throttled to at most once every 10 seconds.
  useEffect(() => {
    if (!ready) return
    const onFocus = () => {
      if (Date.now() - lastFetchAt.current < 10_000) return
      lastFetchAt.current = Date.now()
      initStore().then(() => setVersion(v => v + 1))
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [ready])

  return (
    <StoreReadyContext.Provider value={ready}>
      <StoreVersionContext.Provider value={version}>
        {children}
      </StoreVersionContext.Provider>
    </StoreReadyContext.Provider>
  )
}
