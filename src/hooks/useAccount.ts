import { useCallback, useState } from 'react'

export interface Account {
  name: string
  createdAt: number
}

const KEY = 'frequency.account'

function load(): Account | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return typeof parsed?.name === 'string' ? parsed : null
  } catch {
    return null
  }
}

/** A lightweight, device-local study identity. No password — your profile and
 *  study log live in this browser. */
export function useAccount() {
  const [account, setAccount] = useState<Account | null>(load)

  const signIn = useCallback((rawName: string) => {
    const name = rawName.trim().slice(0, 24)
    if (!name) return
    const existing = load()
    const next: Account =
      existing && existing.name === name ? existing : { name, createdAt: Date.now() }
    localStorage.setItem(KEY, JSON.stringify(next))
    setAccount(next)
  }, [])

  const signOut = useCallback(() => {
    localStorage.removeItem(KEY)
    setAccount(null)
  }, [])

  return { account, signIn, signOut }
}
