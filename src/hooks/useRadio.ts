import { useCallback, useEffect, useRef, useState } from 'react'
import { ROOMS, type RoomId } from '../lib/rooms'
import type { PomPhase, SyncedPomState } from './useSyncedPomodoro'

export interface ChatMessage {
  id: string
  kind: 'chat' | 'system'
  name?: string
  text: string
  ts: number
}

export interface SeatEntry { name: string; seat: string }
export interface ActivityEntry { id: string; text: string; ts: number }

type Counts = Record<RoomId, number>

const WS_URL = import.meta.env.DEV
  ? `ws://${window.location.hostname}:8080`
  : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`

const EMPTY_COUNTS: Counts = Object.fromEntries(ROOMS.map((r) => [r.id, 0])) as Counts
const IDLE_POM: SyncedPomState = { phase: 'idle', remaining: 0, duration: 0, round: 1, startedBy: '' }

export function useRadio() {
  const wsRef = useRef<WebSocket | null>(null)
  const roomRef = useRef<string | null>(null)
  const nameRef = useRef<string>('anon')
  const pomTickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [connected, setConnected] = useState(false)
  const [counts, setCounts] = useState<Counts>(EMPTY_COUNTS)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [users, setUsers] = useState<string[]>([])
  const [mySeat, setMySeat] = useState<string>('')
  const [seatMap, setSeatMap] = useState<SeatEntry[]>([])
  const [pomState, setPomState] = useState<SyncedPomState>(IDLE_POM)
  const [totalStudySec, setTotalStudySec] = useState(0)
  const [activity, setActivity] = useState<ActivityEntry[]>([])
  const pomRef = useRef<SyncedPomState>(IDLE_POM)

  const applyPom = useCallback((data: any) => {
    if (pomTickRef.current) clearInterval(pomTickRef.current)
    if (!data || data.phase === 'idle') {
      setPomState(IDLE_POM); pomRef.current = IDLE_POM; return
    }
    const s: SyncedPomState = {
      phase: data.phase as PomPhase,
      remaining: Math.max(0, data.remaining ?? 0),
      duration: data.duration ?? 0,
      round: data.round ?? 1,
      startedBy: data.startedBy ?? '',
    }
    pomRef.current = s
    setPomState(s)
    pomTickRef.current = setInterval(() => {
      pomRef.current = { ...pomRef.current, remaining: Math.max(0, pomRef.current.remaining - 1) }
      setPomState({ ...pomRef.current })
    }, 1000)
  }, [])

  useEffect(() => {
    let closed = false
    let retry: ReturnType<typeof setTimeout>

    const connect = () => {
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        setConnected(true)
        if (roomRef.current) {
          ws.send(JSON.stringify({ type: 'join', room: roomRef.current, name: nameRef.current }))
        }
      }

      ws.onmessage = (ev) => {
        let data: any
        try { data = JSON.parse(ev.data) } catch { return }
        switch (data.type) {
          case 'welcome':
            setCounts({ ...EMPTY_COUNTS, ...data.counts })
            if (data.totalSec) setTotalStudySec(data.totalSec)
            if (data.recentActivity) setActivity(data.recentActivity)
            break
          case 'counts':
            setCounts({ ...EMPTY_COUNTS, ...data.counts })
            break
          case 'total_stats':
            setTotalStudySec(data.totalSec)
            break
          case 'activity':
            setActivity((prev) => [{ id: data.id, text: data.text, ts: data.ts }, ...prev].slice(0, 10))
            break
          case 'history':
            setMessages((data.messages as any[]).map((m) => ({
              id: m.id, kind: 'chat' as const, name: m.name, text: m.text, ts: m.ts,
            })))
            break
          case 'presence':
            setUsers(data.users)
            break
          case 'chat':
            setMessages((prev) => [...prev, { id: data.id, kind: 'chat', name: data.name, text: data.text, ts: data.ts }])
            break
          case 'system':
            setMessages((prev) => [...prev, { id: data.id, kind: 'system', text: data.text, ts: data.ts }])
            break
          case 'kicked':
            roomRef.current = null
            setMessages((prev) => [...prev, { id: data.id, kind: 'system', text: data.text, ts: data.ts }])
            break
          case 'seat_assigned':
            setMySeat(data.seat)
            break
          case 'seat_map':
            setSeatMap(data.seats ?? [])
            break
          case 'pomodoro_state':
            applyPom(data)
            break
        }
      }

      ws.onclose = () => {
        setConnected(false)
        if (!closed) retry = setTimeout(connect, 1500)
      }
      ws.onerror = () => ws.close()
    }

    connect()
    return () => {
      closed = true
      clearTimeout(retry)
      if (pomTickRef.current) clearInterval(pomTickRef.current)
      wsRef.current?.close()
    }
  }, [applyPom])

  const join = useCallback((room: string, name: string) => {
    roomRef.current = room
    nameRef.current = name || 'anon'
    setMessages([])
    setUsers([])
    setSeatMap([])
    setMySeat('')
    setPomState(IDLE_POM)
    wsRef.current?.send(JSON.stringify({ type: 'join', room, name: nameRef.current }))
  }, [])

  const leave = useCallback(() => {
    roomRef.current = null
    wsRef.current?.send(JSON.stringify({ type: 'leave' }))
    setMessages([])
    setUsers([])
    setSeatMap([])
    setMySeat('')
    setPomState(IDLE_POM)
  }, [])

  const sendChat = useCallback((text: string) => {
    wsRef.current?.send(JSON.stringify({ type: 'chat', text }))
  }, [])

  const startRoomPom = useCallback((focusMin: number, breakMin: number) => {
    wsRef.current?.send(JSON.stringify({ type: 'pomodoro_start', focusSec: focusMin * 60, breakSec: breakMin * 60 }))
  }, [])

  const stopRoomPom = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: 'pomodoro_stop' }))
  }, [])

  return { connected, counts, messages, users, mySeat, seatMap, pomState, totalStudySec, activity, join, leave, sendChat, startRoomPom, stopRoomPom }
}
