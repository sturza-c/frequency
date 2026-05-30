/** Curated SomaFM channels users can build a private room around. */
export interface Station {
  somaId: string
  station: string
  genre: string
}

export const STATIONS: Station[] = [
  { somaId: 'groovesalad', station: 'Groove Salad', genre: 'Lofi beats' },
  { somaId: 'dronezone', station: 'Drone Zone', genre: 'Ambient study' },
  { somaId: 'sonicuniverse', station: 'Sonic Universe', genre: 'Late-night jazz' },
  { somaId: 'beatblender', station: 'Beat Blender', genre: 'Downtempo grooves' },
  { somaId: 'deepspaceone', station: 'Deep Space One', genre: 'Space ambient' },
  { somaId: 'lush', station: 'Lush', genre: 'Dreamy vocals' },
  { somaId: 'fluid', station: 'Fluid', genre: 'Future soul' },
  { somaId: 'spacestation', station: 'Space Station', genre: 'Spaced-out electronica' },
  { somaId: 'thetrip', station: 'The Trip', genre: 'Progressive house' },
  { somaId: 'synphaera', station: 'Synphaera', genre: 'Modern space music' },
  { somaId: 'vaporwaves', station: 'Vaporwaves', genre: 'Vaporwave' },
  { somaId: 'poptron', station: 'PopTron', genre: 'Electro pop' },
]

export const STATION_BY_ID = Object.fromEntries(STATIONS.map((s) => [s.somaId, s])) as Record<
  string,
  Station
>
