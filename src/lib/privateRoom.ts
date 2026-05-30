import { stream, type Room, type RoomId } from './rooms'
import { STATION_BY_ID } from './stations'

/** The shareable configuration that travels inside an invite link. */
export interface PrivateRoomConfig {
  name: string
  somaId: string
  accent: string
}

/** Small, fast, deterministic string hash (cyrb53) → base36. */
function hash(str: string): string {
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36)
}

/** URL-safe base64 encode/decode of the JSON config. */
function encodeConfig(config: PrivateRoomConfig): string {
  const json = JSON.stringify([config.name, config.somaId, config.accent])
  return btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function decodeConfig(token: string): PrivateRoomConfig | null {
  try {
    const b64 = token.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(escape(atob(b64)))
    const [name, somaId, accent] = JSON.parse(json)
    if (typeof name !== 'string' || typeof somaId !== 'string' || typeof accent !== 'string') {
      return null
    }
    if (!STATION_BY_ID[somaId]) return null
    return { name, somaId, accent }
  } catch {
    return null
  }
}

/**
 * Build a full Room from a config. The id is deterministic from the config
 * so the creator and everyone on the invite link join the SAME live room.
 */
export function buildPrivateRoom(config: PrivateRoomConfig): Room {
  const token = encodeConfig(config)
  const st = STATION_BY_ID[config.somaId]
  return {
    id: `priv_${hash(token)}` as RoomId,
    name: config.name.trim().slice(0, 28) || 'Private room',
    genre: st?.genre ?? 'Private',
    station: st?.station ?? config.somaId,
    somaId: config.somaId,
    stream: stream(config.somaId),
    blurb: 'Your invite-only study room.',
    accent: config.accent,
    isPrivate: true,
  }
}

/** Encoded token for a room (used to build invite links + persist). */
export function roomToToken(config: PrivateRoomConfig): string {
  return encodeConfig(config)
}

/** Full shareable invite URL. */
export function inviteLink(config: PrivateRoomConfig): string {
  const token = encodeConfig(config)
  const base = `${window.location.origin}${window.location.pathname}`
  return `${base}?r=${token}`
}

/** Read an invite token from the current URL (?r=…) and resolve it. */
export function readInvite(): { config: PrivateRoomConfig; room: Room } | null {
  const token = new URLSearchParams(window.location.search).get('r')
  if (!token) return null
  const config = decodeConfig(token)
  if (!config) return null
  return { config, room: buildPrivateRoom(config) }
}

/** Remove the ?r= param from the address bar after handling it. */
export function clearInviteParam(): void {
  const url = new URL(window.location.href)
  url.searchParams.delete('r')
  window.history.replaceState({}, '', url.toString())
}
