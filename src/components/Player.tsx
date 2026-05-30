import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Keyboard, Pause, Play, Volume1, Volume2, VolumeX } from 'lucide-react'
import type { Room } from '../lib/rooms'
import type { StudyTimer as StudyTimerType } from '../hooks/useStudyTimer'
import type { Countdown } from '../hooks/useCountdown'
import type { SyncedPomState } from '../hooks/useSyncedPomodoro'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import Visualizer from './Visualizer'
import Turntable from './Turntable'
import FocusTimer from './FocusTimer'
import NowPlaying from './NowPlaying'

interface PlayerProps {
  room: Room
  listeners: number
  accent: string
  timer: StudyTimerType
  countdown: Countdown
  track: string
  isPremium: boolean
  pomState: SyncedPomState
  onUpgrade: () => void
  onLeave: () => void
}

export default function Player({ room, listeners, accent, timer, countdown, track, isPremium, pomState, onUpgrade, onLeave }: PlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [volume, setVolume] = useState(0.7)
  const [muted, setMuted] = useState(false)
  const [error, setError] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    setError(false)
    setLoading(true)
    audio.load()
    audio.play()
      .then(() => setPlaying(true))
      .catch(() => setPlaying(false))
      .finally(() => setLoading(false))
  }, [room.id])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted
  }, [muted])

  const toggle = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      setLoading(true)
      setError(false)
      audio.play()
        .then(() => setPlaying(true))
        .catch(() => setError(true))
        .finally(() => setLoading(false))
    }
  }, [playing])

  const toggleMute = useCallback(() => setMuted((m) => !m), [])
  const volUp = useCallback(() => setVolume((v) => Math.min(1, Math.round((v + 0.1) * 10) / 10)), [])
  const volDown = useCallback(() => setVolume((v) => Math.max(0, Math.round((v - 0.1) * 10) / 10)), [])

  useKeyboardShortcuts({
    onTogglePlay: toggle,
    onMute: toggleMute,
    onVolumeUp: volUp,
    onVolumeDown: volDown,
    onLeave,
  })

  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2

  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-[#101010] p-6 md:p-8">
      <audio
        ref={audioRef}
        src={room.stream}
        preload="none"
        onPlaying={() => { setPlaying(true); setLoading(false) }}
        onWaiting={() => setLoading(true)}
        onPause={() => setPlaying(false)}
        onError={() => { setError(true); setLoading(false); setPlaying(false) }}
      />

      {/* Ambient glow */}
      <motion.div
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full blur-3xl"
        style={{ backgroundColor: accent }}
        animate={{ opacity: playing ? [0.12, 0.22, 0.12] : 0.06, scale: playing ? [1, 1.1, 1] : 1 }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Live badge + listeners */}
      <div className="relative mb-6 flex items-center justify-between">
        <span
          className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.18em]"
          style={{ color: accent, backgroundColor: 'rgba(255,255,255,0.04)' }}
        >
          <span className="relative flex h-1.5 w-1.5">
            {playing && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                style={{ backgroundColor: accent }} />
            )}
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent }} />
          </span>
          Live · {room.genre}
        </span>
        <span className="text-[11px] text-gray-500">
          {listeners} {listeners === 1 ? 'listener' : 'listeners'}
        </span>
      </div>

      {/* Turntable + now playing side by side */}
      <div className="relative flex items-center gap-6 md:gap-8">
        <div className="shrink-0">
          <Turntable
            playing={playing}
            accent={accent}
            label={room.name}
            sublabel={room.station}
            className="w-28 md:w-36"
          />
        </div>
        <div className="min-w-0 flex-1">
          <NowPlaying track={track} accent={accent} playing={playing} />
        </div>
      </div>

      {/* Equalizer */}
      <div className="relative mt-6">
        <Visualizer active={playing} accent={accent} mirror className="h-16 w-full" />
      </div>

      {/* Transport bar — Spotify style */}
      <div className="relative mt-4 flex items-center gap-4 rounded-2xl bg-white/[0.03] px-5 py-3">
        {/* Left: station label */}
        <div className="w-32 shrink-0 min-w-0">
          <p className="truncate text-[10px] uppercase tracking-[0.18em]" style={{ color: accent }}>
            {room.name}
          </p>
          <p className="truncate text-[11px] text-gray-500">{room.station}</p>
        </div>

        {/* Center: play/pause */}
        <div className="flex flex-1 justify-center">
          <button
            onClick={toggle}
            aria-label={playing ? 'Pause' : 'Play'}
            className="flex h-12 w-12 items-center justify-center rounded-full text-black transition-transform hover:scale-105 active:scale-95"
            style={{ backgroundColor: accent }}
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
            ) : playing ? (
              <Pause className="h-5 w-5" fill="currentColor" />
            ) : (
              <Play className="ml-0.5 h-5 w-5" fill="currentColor" />
            )}
          </button>
        </div>

        {/* Right: volume + shortcuts toggle */}
        <div className="flex w-32 shrink-0 items-center justify-end gap-2">
          <button onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'}>
            <VolumeIcon className="h-4 w-4 shrink-0 text-gray-500 hover:text-gray-300 transition-colors" />
          </button>
          <input
            type="range" min={0} max={1} step={0.01} value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            aria-label="Volume"
            className="radio-range h-1 w-16 cursor-pointer appearance-none rounded-full"
          />
          <button
            onClick={() => setShowShortcuts((s) => !s)}
            aria-label="Keyboard shortcuts"
            className="ml-1 text-gray-600 hover:text-gray-400 transition-colors"
          >
            <Keyboard className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Keyboard shortcuts overlay */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18 }}
            className="absolute bottom-full right-0 mb-2 rounded-2xl border border-white/[0.08] bg-[#111] p-4 shadow-2xl"
            style={{ minWidth: 220 }}
          >
            <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-gray-500">Keyboard shortcuts</p>
            {[
              ['Space', 'Play / Pause'],
              ['M', 'Mute / Unmute'],
              ['↑ / ↓', 'Volume'],
              ['Esc', 'Back to lobby'],
            ].map(([key, label]) => (
              <div key={key} className="flex items-center justify-between gap-6 py-1">
                <kbd className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[11px] text-gray-300">
                  {key}
                </kbd>
                <span className="text-[11px] text-gray-400">{label}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p className="relative mt-3 text-center text-xs text-red-300/80">
          Couldn't reach the stream. Press play to retry.
        </p>
      )}

      {/* Personal timer — hidden when a room session is running */}
      {pomState.phase === 'idle' && (
        <div className="relative mt-4">
          <FocusTimer timer={timer} countdown={countdown} accent={accent} isPremium={isPremium} onUpgrade={onUpgrade} />
        </div>
      )}
    </div>
  )
}
