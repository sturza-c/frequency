import { useCallback, useEffect, useState } from 'react'

export interface StudySession {
  id: string
  ts: number
  durationSec: number
  roomId: string
  station: string
  mode: 'stopwatch' | 'countdown'
}

export interface StudyStats {
  totalSec: number
  todaySec: number
  weekSec: number
  count: number
  streak: number
}

const keyFor = (name: string) => `frequency.sessions.${name}`
const dayStamp = (ts: number) => new Date(ts).toISOString().slice(0, 10)

function load(name: string | null): StudySession[] {
  if (!name) return []
  try {
    const raw = localStorage.getItem(keyFor(name))
    return raw ? (JSON.parse(raw) as StudySession[]) : []
  } catch {
    return []
  }
}

function computeStreak(sessions: StudySession[]): number {
  if (sessions.length === 0) return 0
  const days = new Set(sessions.map((s) => dayStamp(s.ts)))
  let streak = 0
  const cursor = new Date()
  // Allow the streak to count from today or yesterday (today not yet logged).
  if (!days.has(dayStamp(cursor.getTime()))) cursor.setDate(cursor.getDate() - 1)
  while (days.has(dayStamp(cursor.getTime()))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export function useStudySessions(name: string | null) {
  const [sessions, setSessions] = useState<StudySession[]>(() => load(name))

  useEffect(() => {
    setSessions(load(name))
  }, [name])

  const addSession = useCallback(
    (entry: Omit<StudySession, 'id' | 'ts'>) => {
      if (!name || entry.durationSec < 1) return
      const session: StudySession = {
        ...entry,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ts: Date.now(),
      }
      setSessions((prev) => {
        const next = [session, ...prev].slice(0, 200)
        localStorage.setItem(keyFor(name), JSON.stringify(next))
        return next
      })
    },
    [name],
  )

  const now = Date.now()
  const today = dayStamp(now)
  const weekAgo = now - 7 * 24 * 3600 * 1000
  const stats: StudyStats = {
    totalSec: sessions.reduce((s, x) => s + x.durationSec, 0),
    todaySec: sessions.filter((x) => dayStamp(x.ts) === today).reduce((s, x) => s + x.durationSec, 0),
    weekSec: sessions.filter((x) => x.ts >= weekAgo).reduce((s, x) => s + x.durationSec, 0),
    count: sessions.length,
    streak: computeStreak(sessions),
  }

  return { sessions, addSession, stats }
}
