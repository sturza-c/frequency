export type RoomId = 'lofi' | 'jazz' | 'study' | 'beats' | 'space' | 'lush'

export interface Room {
  /** Public rooms use a RoomId; private rooms cast a `priv_…` id to RoomId. */
  id: RoomId
  name: string
  genre: string
  station: string
  /** SomaFM channel id — used to fetch now-playing metadata. */
  somaId: string
  stream: string
  blurb: string
  accent: string
  /** Premium-only rooms are locked for free users. */
  premium?: boolean
  /** True for user-created invite-only rooms. */
  isPrivate?: boolean
}

export const stream = (somaId: string) => `https://ice1.somafm.com/${somaId}-128-mp3`

// Live internet radio (SomaFM). A live broadcast is the same for every
// listener, so everyone tuned to a room hears the exact same music in sync.
export const ROOMS: Room[] = [
  {
    id: 'lofi',
    name: 'The Loft',
    genre: 'Lofi beats',
    station: 'Groove Salad',
    somaId: 'groovesalad',
    stream: stream('groovesalad'),
    blurb: 'Mellow downtempo to melt into the page.',
    accent: '#D8B68A',
  },
  {
    id: 'jazz',
    name: 'Stardrift',
    genre: 'Instrumental space',
    station: 'Synphaera',
    somaId: 'synphaera',
    stream: stream('synphaera'),
    blurb: 'Modern instrumental space music for deep, uninterrupted work.',
    accent: '#C28F6A',
    premium: true,
  },
  {
    id: 'study',
    name: 'Deep Focus',
    genre: 'Ambient study',
    station: 'Drone Zone',
    somaId: 'dronezone',
    stream: stream('dronezone'),
    blurb: 'Atmospheric drones that dissolve distraction.',
    accent: '#9DB0A6',
  },
  {
    id: 'beats',
    name: 'Beat Cellar',
    genre: 'Downtempo grooves',
    station: 'Beat Blender',
    somaId: 'beatblender',
    stream: stream('beatblender'),
    blurb: 'Late-night grooves to coast through a problem set.',
    accent: '#CE9197',
    premium: true,
  },
  {
    id: 'space',
    name: 'Deep Space',
    genre: 'Space ambient',
    station: 'Deep Space One',
    somaId: 'deepspaceone',
    stream: stream('deepspaceone'),
    blurb: 'Vast, weightless ambient for the 2am grind.',
    accent: '#8FA6BC',
  },
  {
    id: 'lush',
    name: 'Lo-Fi Library',
    genre: 'Instrumental beats',
    station: 'cliqhop idm',
    somaId: 'cliqhop',
    stream: stream('cliqhop'),
    blurb: 'Steady instrumental beats to lock into a problem set.',
    accent: '#A99CC4',
    premium: true,
  },
]

export const ROOM_BY_ID = Object.fromEntries(ROOMS.map((r) => [r.id, r])) as Record<
  RoomId,
  Room
>
