'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { initStore } from '@/lib/store'

const StoreReadyContext = createContext(false)
export const useStoreReady = () => useContext(StoreReadyContext)

// Provided by AdminLayout after loadHeavyKeys() completes.
// Components that read participants/transactions/groups/notifications use this.
export const HeavyReadyContext = createContext(false)
export const useHeavyStoreReady = () => useContext(HeavyReadyContext)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Hard fallback: if initStore() somehow never resolves (e.g. fetch hangs
    // despite the AbortController), unblock the UI after 8 seconds.
    const fallback = setTimeout(() => setReady(true), 8000)
    initStore().finally(() => {
      clearTimeout(fallback)
      setReady(true)
    })
    return () => clearTimeout(fallback)
  }, [])

  return (
    <StoreReadyContext.Provider value={ready}>
      {children}
    </StoreReadyContext.Provider>
  )
}
