import { useCallback, useEffect, useRef, useState } from 'react'
import { ROOMS, type RoomId } from '../lib/rooms'

export interface ChatMessage {
  id: string
  kind: 'chat' | 'system'
  name?: string
  text: string
  ts: number
}

type Counts = Record<RoomId, number>

const WS_URL = import.meta.env.DEV
  ? `ws://${window.location.hostname}:8080`
  : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`

const EMPTY_COUNTS: Counts = Object.fromEntries(ROOMS.map((r) => [r.id, 0])) as Counts

export function useRadio() {
  const wsRef = useRef<WebSocket | null>(null)
  const roomRef = useRef<string | null>(null)
  const nameRef = useRef<string>('anon')

  const [connected, setConnected] = useState(false)
  const [counts, setCounts] = useState<Counts>(EMPTY_COUNTS)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [users, setUsers] = useState<string[]>([])

  useEffect(() => {
    let closed = false
    let retry: ReturnType<typeof setTimeout>

    const connect = () => {
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        setConnected(true)
        // Re-join after a reconnect.
        if (roomRef.current) {
          ws.send(JSON.stringify({ type: 'join', room: roomRef.current, name: nameRef.current }))
        }
      }

      ws.onmessage = (ev) => {
        let data: any
        try {
          data = JSON.parse(ev.data)
        } catch {
          return
        }
        switch (data.type) {
          case 'welcome':
          case 'counts':
            setCounts({ ...EMPTY_COUNTS, ...data.counts })
            break
          case 'history':
            setMessages(
              (data.messages as any[]).map((m) => ({
                id: m.id,
                kind: 'chat',
                name: m.name,
                text: m.text,
                ts: m.ts,
              })),
            )
            break
          case 'presence':
            setUsers(data.users)
            break
          case 'chat':
            setMessages((prev) => [
              ...prev,
              { id: data.id, kind: 'chat', name: data.name, text: data.text, ts: data.ts },
            ])
            break
          case 'system':
            setMessages((prev) => [
              ...prev,
              { id: data.id, kind: 'system', text: data.text, ts: data.ts },
            ])
            break
          case 'kicked':
            // Stop auto-rejoin on the next (server-initiated) close.
            roomRef.current = null
            setMessages((prev) => [
              ...prev,
              { id: data.id, kind: 'system', text: data.text, ts: data.ts },
            ])
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
      wsRef.current?.close()
    }
  }, [])

  const join = useCallback((room: string, name: string) => {
    roomRef.current = room
    nameRef.current = name || 'anon'
    setMessages([])
    setUsers([])
    wsRef.current?.send(JSON.stringify({ type: 'join', room, name: nameRef.current }))
  }, [])

  const leave = useCallback(() => {
    roomRef.current = null
    wsRef.current?.send(JSON.stringify({ type: 'leave' }))
    setMessages([])
    setUsers([])
  }, [])

  const sendChat = useCallback((text: string) => {
    wsRef.current?.send(JSON.stringify({ type: 'chat', text }))
  }, [])

  return { connected, counts, messages, users, join, leave, sendChat }
}
