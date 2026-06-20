'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { initStore } from '@/lib/store'

// Context so admin/trainer pages can gate on store being populated
const StoreReadyContext = createContext(false)
export const useStoreReady = () => useContext(StoreReadyContext)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    initStore().finally(() => setReady(true))
  }, [])

  // Never block rendering — public pages work fine with defaults.
  // Admin/trainer layouts use useStoreReady() to gate their own content.
  return (
    <StoreReadyContext.Provider value={ready}>
      {children}
    </StoreReadyContext.Provider>
  )
}
