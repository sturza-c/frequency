import { ROOMS, type Room, type RoomId } from './rooms'

const KEY = 'frequency.stationConfig'

export interface StationConfig {
  /** Ordered list of room ids (controls display order). */
  order: RoomId[]
  /** Room ids hidden from the lobby. */
  hidden: RoomId[]
}

const DEFAULT: StationConfig = { order: ROOMS.map((r) => r.id), hidden: [] }

export function loadStationConfig(): StationConfig {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT
    const p = JSON.parse(raw)
    const order: RoomId[] = Array.isArray(p.order) ? p.order.filter((id: RoomId) => ROOMS.some((r) => r.id === id)) : []
    const hidden: RoomId[] = Array.isArray(p.hidden) ? p.hidden : []
    // Append any rooms missing from a stale config so new rooms still show.
    for (const r of ROOMS) if (!order.includes(r.id)) order.push(r.id)
    return { order, hidden }
  } catch {
    return DEFAULT
  }
}

export function saveStationConfig(cfg: StationConfig): void {
  localStorage.setItem(KEY, JSON.stringify(cfg))
}

/** All rooms in admin-defined order (for the admin list). */
export function orderedRooms(cfg = loadStationConfig()): Room[] {
  return [...ROOMS].sort((a, b) => cfg.order.indexOf(a.id) - cfg.order.indexOf(b.id))
}

/** Rooms shown in the lobby: ordered, minus hidden. */
export function visiblePublicRooms(): Room[] {
  const cfg = loadStationConfig()
  return orderedRooms(cfg).filter((r) => !cfg.hidden.includes(r.id))
}
