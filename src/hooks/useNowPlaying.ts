import { useEffect, useState } from 'react'

export interface NowPlaying {
  track: string
  listeners: number
}

type Feed = Record<string, NowPlaying>

const API_URL = import.meta.env.DEV
  ? `http://${window.location.hostname}:8080/api/nowplaying`
  : '/api/nowplaying'

/** Polls the SomaFM now-playing proxy. Returns a map of somaId -> current track. */
export function useNowPlaying(enabled: boolean): Feed {
  const [feed, setFeed] = useState<Feed>({})

  useEffect(() => {
    if (!enabled) return
    let alive = true

    const tick = async () => {
      try {
        const res = await fetch(API_URL)
        const data = (await res.json()) as Feed
        if (alive) setFeed(data)
      } catch {
        /* offline / server down — keep last feed */
      }
    }

    tick()
    const id = setInterval(tick, 15_000)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [enabled])

  return feed
}
