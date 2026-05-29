import { useEffect, useRef, useState } from 'react'

export interface Countdown {
  total: number
  remaining: number
  running: boolean
  setMinutes: (m: number) => void
  start: () => void
  pause: () => void
  reset: () => void
}

/** A Pomodoro-style countdown. Calls onComplete(totalSeconds) once when it hits 0. */
export function useCountdown(onComplete: (totalSec: number) => void): Countdown {
  const [total, setTotal] = useState(25 * 60)
  const [remaining, setRemaining] = useState(25 * 60)
  const [running, setRunning] = useState(false)

  const completeRef = useRef(onComplete)
  completeRef.current = onComplete
  const totalRef = useRef(total)
  totalRef.current = total

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id)
          setRunning(false)
          completeRef.current(totalRef.current)
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [running])

  return {
    total,
    remaining,
    running,
    setMinutes: (m) => {
      const secs = Math.max(1, Math.round(m)) * 60
      setTotal(secs)
      setRemaining(secs)
      setRunning(false)
    },
    start: () => {
      if (remaining > 0) setRunning(true)
    },
    pause: () => setRunning(false),
    reset: () => {
      setRunning(false)
      setRemaining(totalRef.current)
    },
  }
}
