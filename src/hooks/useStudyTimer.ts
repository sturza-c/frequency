import { useEffect, useRef, useState } from 'react'

function todayKey() {
  return `frequency.focus.${new Date().toISOString().slice(0, 10)}`
}

export interface StudyTimer {
  seconds: number
  todayTotal: number
  running: boolean
  toggle: () => void
  reset: () => void
}

/** Counts up while `active` and `running`. Persists a per-day focus total. */
export function useStudyTimer(active: boolean): StudyTimer {
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(true)
  const [todayTotal, setTodayTotal] = useState(() =>
    Number(localStorage.getItem(todayKey()) || 0),
  )
  const totalRef = useRef(todayTotal)
  totalRef.current = todayTotal

  useEffect(() => {
    if (!active || !running) return
    const id = setInterval(() => {
      setSeconds((s) => s + 1)
      const next = totalRef.current + 1
      localStorage.setItem(todayKey(), String(next))
      setTodayTotal(next)
    }, 1000)
    return () => clearInterval(id)
  }, [active, running])

  return {
    seconds,
    todayTotal,
    running,
    toggle: () => setRunning((r) => !r),
    reset: () => setSeconds(0),
  }
}

export function formatDuration(total: number) {
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}
