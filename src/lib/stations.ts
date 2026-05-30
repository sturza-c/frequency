/** Curated SomaFM channels users can build a private room around. */
export interface Station {
  somaId: string
  station: string
  genre: string
}

export const STATIONS: Station[] = [
  // Study-first: instrumental, low-distraction channels up top.
  { somaId: 'groovesalad', station: 'Groove Salad', genre: 'Lofi & downtempo' },
  { somaId: 'dronezone', station: 'Drone Zone', genre: 'Atmospheric ambient' },
  { somaId: 'deepspaceone', station: 'Deep Space One', genre: 'Deep space ambient' },
  { somaId: 'synphaera', station: 'Synphaera', genre: 'Instrumental space' },
  { somaId: 'cliqhop', station: 'cliqhop idm', genre: 'Instrumental beats' },
  { somaId: 'beatblender', station: 'Beat Blender', genre: 'Downtempo grooves' },
  { somaId: 'spacestation', station: 'Space Station', genre: 'Spaced-out electronica' },
  { somaId: 'gsclassic', station: 'Groove Salad Classic', genre: 'Classic ambient' },
  { somaId: 'missioncontrol', station: 'Mission Control', genre: 'Ambient + NASA' },
  // Looser picks for variety.
  { somaId: 'sonicuniverse', station: 'Sonic Universe', genre: 'Experimental jazz' },
  { somaId: 'lush', station: 'Lush', genre: 'Dreamy vocals' },
  { somaId: 'thetrip', station: 'The Trip', genre: 'Progressive house' },
]

export const STATION_BY_ID = Object.fromEntries(STATIONS.map((s) => [s.somaId, s])) as Record<
  string,
  Station
>
