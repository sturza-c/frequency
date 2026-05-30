import { useCallback, useEffect, useRef, useState } from 'react'

export type PomPhase = 'idle' | 'focus' | 'break'

export interface SyncedPomState {
  phase: PomPhase
  remaining: number   // seconds
  duration: number    // seconds of current phase
  round: number
  startedBy: string
}

export interface SyncedPomodoro {
  state: SyncedPomState
  /** Start a room session. focusMin / breakMin in minutes. */
  start: (focusMin: number, breakMin: number) => void
  stop: () => void
}

const IDLE: SyncedPomState = { phase: 'idle', remaining: 0, duration: 0, round: 1, startedBy: '' }

/**
 * Manages synced Pomodoro state received from the WebSocket.
 * The server is the clock — we just render what it tells us.
 */
export function useSyncedPomodoro(
  wsRef: React.RefObject<WebSocket | null>,
): SyncedPomodoro {
  const [state, setState] = useState<SyncedPomState>(IDLE)
  // Client-side tick to count remaining down smoothly between server updates.
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stateRef = useRef<SyncedPomState>(IDLE)

  const applyServerState = useCallback((data: any) => {
    if (data.phase === 'idle') {
      setState(IDLE)
      stateRef.current = IDLE
      if (tickRef.current) clearInterval(tickRef.current)
      return
    }
    const s: SyncedPomState = {
      phase: data.phase,
      remaining: Math.max(0, data.remaining ?? 0),
      duration: data.duration ?? 0,
      round: data.round ?? 1,
      startedBy: data.startedBy ?? '',
    }
    setState(s)
    stateRef.current = s
    // Start a local tick to count down smoothly (server will correct us every ~4s).
    if (tickRef.current) clearInterval(tickRef.current)
    tickRef.current = setInterval(() => {
      stateRef.current = {
        ...stateRef.current,
        remaining: Math.max(0, stateRef.current.remaining - 1),
      }
      setState({ ...stateRef.current })
    }, 1000)
  }, [])

  // Expose applyServerState so useRadio can call it.
  ;(wsRef as any).__applyPom = applyServerState

  useEffect(() => {
    return () => { if (tickRef.current) clearInterval(tickRef.current) }
  }, [])

  const send = useCallback((data: object) => {
    const ws = wsRef.current
    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data))
  }, [wsRef])

  const start = useCallback((focusMin: number, breakMin: number) => {
    send({ type: 'pomodoro_start', focusSec: focusMin * 60, breakSec: breakMin * 60 })
  }, [send])

  const stop = useCallback(() => {
    send({ type: 'pomodoro_stop' })
  }, [send])

  return { state, start, stop }
}
