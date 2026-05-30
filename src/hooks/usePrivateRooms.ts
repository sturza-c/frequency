import { useCallback, useState } from 'react'
import { buildPrivateRoom, type PrivateRoomConfig } from '../lib/privateRoom'
import type { Room } from '../lib/rooms'

const KEY = 'frequency.privateRooms'

function load(): PrivateRoomConfig[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

export interface PrivateRoomsApi {
  rooms: Room[]
  /** Add (or de-dupe) a private room and return its Room object. */
  add: (config: PrivateRoomConfig) => Room
  remove: (id: string) => void
}

export function usePrivateRooms(): PrivateRoomsApi {
  const [configs, setConfigs] = useState<PrivateRoomConfig[]>(load)

  const persist = useCallback((next: PrivateRoomConfig[]) => {
    setConfigs(next)
    localStorage.setItem(KEY, JSON.stringify(next))
  }, [])

  const add = useCallback(
    (config: PrivateRoomConfig) => {
      const room = buildPrivateRoom(config)
      setConfigs((prev) => {
        // De-dupe by resolved room id.
        const exists = prev.some((c) => buildPrivateRoom(c).id === room.id)
        const next = exists ? prev : [config, ...prev]
        localStorage.setItem(KEY, JSON.stringify(next))
        return next
      })
      return room
    },
    [],
  )

  const remove = useCallback(
    (id: string) => {
      persist(configs.filter((c) => buildPrivateRoom(c).id !== id))
    },
    [configs, persist],
  )

  return { rooms: configs.map(buildPrivateRoom), add, remove }
}
