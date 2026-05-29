import { useState } from 'react'

const KEY = 'frequency.premium'

export interface Subscription {
  isPremium: boolean
  /** Demo only — sets the flag in localStorage. Replace with real Stripe flow later. */
  upgrade: () => void
  downgrade: () => void
}

export function useSubscription(): Subscription {
  const [isPremium, setIsPremium] = useState(() => localStorage.getItem(KEY) === 'true')

  const upgrade = () => {
    localStorage.setItem(KEY, 'true')
    setIsPremium(true)
  }

  const downgrade = () => {
    localStorage.removeItem(KEY)
    setIsPremium(false)
  }

  return { isPremium, upgrade, downgrade }
}
