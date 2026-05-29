import { useEffect, useRef, useState } from 'react'
import { Music2 } from 'lucide-react'
import { formatDuration } from '../hooks/useStudyTimer'

interface NowPlayingProps {
  track: string
  accent: string
  playing: boolean
}

// Live radio has no song duration, so "progress" is the time elapsed since we
// detected this track, eased against a typical track length.
const TYPICAL_TRACK = 215

export default function NowPlaying({ track, accent, playing }: NowPlayingProps) {
  const [elapsed, setElapsed] = useState(0)
  const startRef = useRef(Date.now())
  const trackRef = useRef(track)

  if (track !== trackRef.current) {
    trackRef.current = track
    startRef.current = Date.now()
  }

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const pct = Math.min(100, (elapsed / TYPICAL_TRACK) * 100)
  const label = track || (playing ? 'Live broadcast' : 'Paused')

  return (
    <div className="rounded-2xl bg-white/[0.03] px-4 py-3">
      <div className="flex items-center gap-2.5">
        <Music2 className="h-3.5 w-3.5 shrink-0" style={{ color: accent }} />
        <span className="truncate text-sm" style={{ color: '#E1E0CC' }} title={label}>
          {label}
        </span>
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        <span className="font-mono text-[10px] tabular-nums text-gray-500">
          {formatDuration(elapsed)}
        </span>
        <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-1000 ease-linear"
            style={{ width: `${pct}%`, backgroundColor: accent }}
          />
        </div>
        <span className="text-[9px] uppercase tracking-[0.16em] text-gray-600">live</span>
      </div>
    </div>
  )
}
