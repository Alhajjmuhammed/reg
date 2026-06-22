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
    initStore().finally(() => setReady(true))
  }, [])

  return (
    <StoreReadyContext.Provider value={ready}>
      {children}
    </StoreReadyContext.Provider>
  )
}
