import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Lock, Radio, Square, Timer, Users } from 'lucide-react'
import { ROOMS, type Room as RoomType, type RoomId } from '../lib/rooms'
import type { Account } from '../hooks/useAccount'
import type { StudyStats } from '../hooks/useStudySessions'
import { formatDuration } from '../hooks/useStudyTimer'
import { HERO_VIDEO } from '../lib/media'
import WordsPullUp from './WordsPullUp'
import ScrollReveal from './ScrollReveal'
import Turntable from './Turntable'
import Visualizer from './Visualizer'

interface LobbyProps {
  counts: Record<RoomId, number>
  connected: boolean
  account: Account | null
  stats: StudyStats
  isPremium: boolean
  playingRoom: RoomType | null
  nowPlayingTrack: string
  onJoin: (room: RoomId, name: string) => void
  onStopMusic: () => void
  onOpenProfile: () => void
  onUpgrade: () => void
}

const ease = [0.16, 1, 0.3, 1] as const

export default function Lobby({
  counts,
  connected,
  account,
  stats,
  isPremium,
  playingRoom,
  nowPlayingTrack,
  onJoin,
  onStopMusic,
  onOpenProfile,
  onUpgrade,
}: LobbyProps) {
  const [name, setName] = useState(() => account?.name ?? localStorage.getItem('frequency.name') ?? '')
  const [shake, setShake] = useState(false)
  const [nameError, setNameError] = useState(false)
  const [hovered, setHovered] = useState<RoomId>('lofi')
  const inputRef = useRef<HTMLInputElement>(null)

  const totalLive = ROOMS.reduce((sum, r) => sum + (counts[r.id] ?? 0), 0)
  const featured = ROOMS.find((r) => r.id === hovered) ?? ROOMS[0]

  const handleJoin = (room: RoomId, locked: boolean) => {
    if (locked) { onUpgrade(); return }
    const finalName = (account?.name ?? name).trim()
    if (!finalName) {
      setShake(true)
      setNameError(true)
      setTimeout(() => setShake(false), 500)
      inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setTimeout(() => inputRef.current?.focus(), 400)
      return
    }
    localStorage.setItem('frequency.name', finalName)
    onJoin(room, finalName)
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-primary">
      {/* Top: cinematic looping video, masked so its bottom dissolves into the aurora theme */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-screen overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover"
          style={{
            WebkitMaskImage: 'linear-gradient(to bottom, #000 48%, transparent 90%)',
            maskImage: 'linear-gradient(to bottom, #000 48%, transparent 90%)',
          }}
        >
          <source src={HERO_VIDEO} type="video/mp4" />
        </video>
        {/* top scrim for headline legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/15 to-transparent" />
      </div>

      {/* Aurora-blob theme background — rises through the video's fading edge and takes over below */}
      <div
        className="aurora-a pointer-events-none absolute left-[-8%] top-[55vh] z-0 h-[85vh] w-[85vh] rounded-full blur-[150px]"
        style={{ backgroundColor: featured.accent, opacity: 0.28 }}
      />
      <div
        className="aurora-b pointer-events-none absolute right-[-10%] top-[105vh] z-0 h-[70vh] w-[70vh] rounded-full blur-[150px]"
        style={{ backgroundColor: featured.accent, opacity: 0.2 }}
      />
      <div className="bg-noise pointer-events-none absolute inset-0 z-0 opacity-[0.08]" />

      {/* Top status bar */}
      <div className="relative z-10 flex items-center justify-center border-b border-white/[0.06] py-2.5">
        <span className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-gray-500">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: connected ? featured.accent : '#555', boxShadow: connected ? `0 0 6px ${featured.accent}` : 'none' }}
          />
          {connected ? `${totalLive} studying live` : 'connecting…'}
        </span>
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-5 py-8 md:px-10">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2" style={{ color: featured.accent }}>
            <Radio className="h-5 w-5" />
            <span className="text-sm font-bold tracking-[0.2em]">FREQUENCY</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden items-center gap-2 text-[11px] text-gray-500 sm:flex">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: connected ? featured.accent : '#6b6b6b' }}
              />
              {connected ? `${totalLive} studying now` : 'connecting…'}
            </span>
            {account && (
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-2 rounded-full bg-white/5 py-1 pl-1 pr-3 transition-colors hover:bg-white/10"
              >
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold"
                  style={{ backgroundColor: featured.accent, color: '#101010' }}
                >
                  {account.name.slice(0, 2).toUpperCase()}
                </span>
                <span className="text-xs" style={{ color: '#E1E0CC' }}>
                  {account.name}
                </span>
              </button>
            )}
          </div>
        </header>

        {/* Hero */}
        <div className="mt-12 grid items-center gap-10 md:mt-16 md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease }}
              className="text-[11px] uppercase tracking-[0.3em] text-gray-500"
            >
              Study radio · for students who need to lock in
            </motion.p>
            <h1
              className="mt-4 text-6xl font-semibold leading-[0.92] tracking-tight md:text-8xl"
              style={{ color: '#E1E0CC' }}
            >
              <WordsPullUp text="Find your" />
              <br />
              <span className="relative inline-block">
                <WordsPullUp text="frequency" delay={0.16} />
                <motion.span
                  className="absolute -bottom-1 left-0 h-[3px] rounded-full"
                  style={{ backgroundColor: featured.accent }}
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 0.9, delay: 0.7, ease }}
                />
              </span>
              <span className="mt-1 block font-serif text-3xl italic md:text-4xl" style={{ color: featured.accent }}>
                and lock in.
              </span>
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease }}
              className="mt-6 max-w-md text-sm text-gray-400 md:text-base"
              style={{ lineHeight: 1.55 }}
            >
              Pick a station, start a focus timer, and study alongside other students tuned to the
              exact same live broadcast. No playlists to manage — just press play and grind.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.52, ease }}
              className="mt-10 w-full max-w-sm"
            >
              {account ? (
                <div className="flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-4">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                    style={{ backgroundColor: featured.accent, color: '#101010' }}
                  >
                    {account.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Welcome back</span>
                    <p className="text-base font-medium" style={{ color: '#E1E0CC' }}>{account.name}</p>
                  </div>
                  <span className="ml-auto text-[11px] text-gray-500">↓ pick a room</span>
                </div>
              ) : (
                <div>
                  <p className="mb-2 text-sm" style={{ color: '#E1E0CC' }}>
                    First, what should we call you?
                  </p>
                  <div className="flex items-center gap-2">
                    <motion.input
                      ref={inputRef}
                      value={name}
                      onChange={(e) => { setName(e.target.value); setNameError(false) }}
                      maxLength={24}
                      placeholder="your name or alias…"
                      animate={shake ? { x: [0, -6, 6, -4, 4, 0] } : {}}
                      transition={{ duration: 0.4 }}
                      className="flex-1 rounded-xl bg-white/[0.06] px-4 py-3 text-base text-primary placeholder:text-gray-600 focus:outline-none"
                      style={{
                        boxShadow: nameError
                          ? '0 0 0 1.5px #f87171'
                          : `0 0 0 1px rgba(255,255,255,0.08)`,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-[11px]" style={{ color: nameError ? '#f87171' : 'rgba(107,114,128,0.8)' }}>
                    {nameError ? '↑ Enter a name, then pick a room below.' : 'Then choose a room below to start your session.'}
                  </p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Live preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.25, ease }}
            className="relative mx-auto w-full max-w-xs"
          >
            <Turntable
              playing
              accent={featured.accent}
              label={featured.name}
              sublabel={featured.station}
            />
            <div className="mt-6">
              <Visualizer active accent={featured.accent} mirror className="h-12 w-full" />
            </div>
          </motion.div>
        </div>

        {/* Scroll-reveal manifesto */}
        <div className="mx-auto mt-32 max-w-3xl md:mt-44">
          <p className="mb-4 text-[11px] uppercase tracking-[0.3em] text-gray-600">
            Why Frequency
          </p>
          <ScrollReveal
            text="The hardest part is starting. So make it one tap — pick a station and the timer runs while the live set carries you. Same broadcast, same minute, as every other student locked in beside you."
            className="text-2xl leading-snug tracking-tight md:text-4xl"
          />
        </div>

        {/* Stats strip for returning students */}
        {account && stats.count > 0 && (
          <div className="mt-16 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Day streak', value: `${stats.streak}` },
              { label: 'This week', value: formatDuration(stats.weekSec) },
              { label: 'All time', value: formatDuration(stats.totalSec) },
              { label: 'Sessions', value: `${stats.count}` },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-white/[0.03] px-4 py-3">
                <span className="font-mono text-2xl tabular-nums" style={{ color: '#E1E0CC' }}>
                  {s.value}
                </span>
                <span className="block text-[10px] uppercase tracking-[0.16em] text-gray-500">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Tuner / room cards */}
        <div className="mt-16 flex items-end justify-between">
          <h2 className="text-2xl tracking-tight md:text-3xl" style={{ color: '#E1E0CC' }}>
            Pick a room
          </h2>
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <Users className="h-3.5 w-3.5" />
            {totalLive} studying now
          </span>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ROOMS.map((room, i) => {
            const locked = !!room.premium && !isPremium
            return (
            <motion.button
              key={room.id}
              onClick={() => handleJoin(room.id, locked)}
              onMouseEnter={() => setHovered(room.id)}
              onFocus={() => setHovered(room.id)}
              initial={{ y: 24, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.55, delay: (i % 3) * 0.08, ease }}
              whileHover={{ y: -4 }}
              className="group relative overflow-hidden rounded-[1.75rem] border p-6 text-left transition-colors"
              style={{
                borderColor: hovered === room.id ? `${room.accent}66` : 'rgba(255,255,255,0.06)',
                backgroundColor: locked ? '#0c0c0c' : '#101010',
                opacity: locked ? 0.75 : 1,
              }}
            >
              {/* Locked overlay */}
              {locked && (
                <div className="pointer-events-none absolute inset-0 z-10 rounded-[1.75rem] bg-black/30 backdrop-blur-[1px]" />
              )}
              <div
                className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-50"
                style={{ backgroundColor: room.accent }}
              />
              <div className="relative z-20">
                <div className="flex items-center justify-between">
                  <span
                    className="text-[10px] uppercase tracking-[0.18em]"
                    style={{ color: room.accent }}
                  >
                    {room.genre}
                  </span>
                  {locked ? (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
                      style={{ backgroundColor: `${room.accent}22`, color: room.accent }}
                    >
                      <Lock className="h-2.5 w-2.5" /> Pro
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
                      <span className="relative flex h-1.5 w-1.5">
                        <span
                          className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                          style={{ backgroundColor: room.accent }}
                        />
                        <span
                          className="relative inline-flex h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: room.accent }}
                        />
                      </span>
                      {counts[room.id] ?? 0} live
                    </span>
                  )}
                </div>
                <h3 className="mt-6 text-2xl tracking-tight" style={{ color: '#E1E0CC' }}>
                  {room.name}
                </h3>
                <p className="mt-2 text-xs text-gray-400" style={{ lineHeight: 1.4 }}>
                  {room.blurb}
                </p>
                <span
                  className="mt-6 inline-flex items-center gap-1.5 text-sm"
                  style={{ color: room.accent }}
                >
                  {locked ? (
                    <><Lock className="h-3.5 w-3.5" /> Unlock to tune in</>
                  ) : (
                    <><Timer className="h-3.5 w-3.5" /> Tune in &amp; focus
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>
                  )}
                </span>
              </div>
            </motion.button>
          )
          })}
        </div>

        <footer className="mt-20 border-t border-white/5 py-8 text-center text-[11px] uppercase tracking-[0.2em] text-gray-600">
          Frequency · live study radio · powered by SomaFM
        </footer>
      </div>

      {/* Persistent mini player — visible while music is still playing in the background */}
      <AnimatePresence>
        {playingRoom && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2"
          >
            <div
              className="flex items-center gap-4 rounded-2xl border px-5 py-3 shadow-2xl backdrop-blur-xl"
              style={{
                backgroundColor: 'rgba(10,10,10,0.85)',
                borderColor: `${playingRoom.accent}44`,
                boxShadow: `0 8px 40px ${playingRoom.accent}22`,
              }}
            >
              {/* Animated live dot */}
              <span className="relative flex h-2 w-2 shrink-0">
                <span
                  className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                  style={{ backgroundColor: playingRoom.accent }}
                />
                <span
                  className="relative inline-flex h-2 w-2 rounded-full"
                  style={{ backgroundColor: playingRoom.accent }}
                />
              </span>

              {/* Room + track info */}
              <div className="min-w-0">
                <p className="text-xs font-medium" style={{ color: playingRoom.accent }}>
                  {playingRoom.name}
                </p>
                {nowPlayingTrack && (
                  <p className="max-w-[200px] truncate text-[11px] text-gray-400">
                    {nowPlayingTrack}
                  </p>
                )}
              </div>

              {/* Back to room */}
              <button
                onClick={() => onJoin(playingRoom.id, account?.name ?? '')}
                className="rounded-xl px-3 py-1.5 text-[11px] font-medium transition-colors hover:opacity-80"
                style={{ backgroundColor: `${playingRoom.accent}22`, color: playingRoom.accent }}
              >
                Back to room
              </button>

              {/* Stop */}
              <button
                onClick={onStopMusic}
                aria-label="Stop music"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/5 text-gray-400 transition-colors hover:bg-white/10 hover:text-red-400"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
