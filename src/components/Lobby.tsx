import { useRef, useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Crown, Lock, Plus, Radio, Square, Timer, Trash2, Users, X, Zap } from 'lucide-react'
import { ROOMS, type Room as RoomType, type RoomId } from '../lib/rooms'
import { isHot } from '../lib/hot'
import { visiblePublicRooms } from '../lib/stationConfig'
import type { Account } from '../hooks/useAccount'
import type { StudyStats } from '../hooks/useStudySessions'
import type { ActivityEntry } from '../hooks/useRadio'
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
  privateRooms: RoomType[]
  invite: RoomType | null
  playingRoom: RoomType | null
  nowPlayingTrack: string
  totalStudySec: number
  activity: ActivityEntry[]
  onJoin: (room: RoomId, name: string) => void
  onJoinRoom: (room: RoomType, name: string) => void
  onCreateRoom: () => void
  onDeleteRoom: (id: string) => void
  onDismissInvite: () => void
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
  privateRooms,
  invite,
  playingRoom,
  nowPlayingTrack,
  totalStudySec,
  activity,
  onJoin,
  onJoinRoom,
  onCreateRoom,
  onDeleteRoom,
  onDismissInvite,
  onStopMusic,
  onOpenProfile,
  onUpgrade,
}: LobbyProps) {
  const [name, setName] = useState(() => account?.name ?? localStorage.getItem('frequency.name') ?? '')
  const [shake, setShake] = useState(false)
  const [nameError, setNameError] = useState(false)
  const [nameConfirmed, setNameConfirmed] = useState(() => !!(account?.name ?? localStorage.getItem('frequency.name')))
  const [hovered, setHovered] = useState<RoomId>('lofi')
  const [showTooltip, setShowTooltip] = useState(false)
  const [toast, setToast] = useState<{ id: string; text: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const roomsRef = useRef<HTMLDivElement>(null)

  // Show welcome tooltip for brand-new visitors after 1.5s
  useEffect(() => {
    if (account || nameConfirmed) return
    const t = setTimeout(() => setShowTooltip(true), 1500)
    return () => clearTimeout(t)
  }, [account, nameConfirmed])

  // Show latest activity as a bottom-left toast, auto-dismiss after 4s
  useEffect(() => {
    if (activity.length === 0) return
    const latest = activity[0]
    setToast({ id: latest.id, text: latest.text })
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [activity[0]?.id]) // eslint-disable-line

  const confirmName = useCallback(() => {
    const n = name.trim()
    if (!n) { setShake(true); setNameError(true); setTimeout(() => setShake(false), 500); return }
    localStorage.setItem('frequency.name', n)
    setNameConfirmed(true)
    setTimeout(() => roomsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
  }, [name])

  const totalLive = ROOMS.reduce((sum, r) => sum + (counts[r.id] ?? 0), 0)
  const featured = ROOMS.find((r) => r.id === hovered) ?? ROOMS[0]
  const publicRooms = visiblePublicRooms()

  // Shared name guard: returns the trimmed name, or null after nudging the input.
  const ensureName = (): string | null => {
    const finalName = (account?.name ?? name).trim()
    if (!finalName) {
      setShake(true)
      setNameError(true)
      setTimeout(() => setShake(false), 500)
      inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setTimeout(() => inputRef.current?.focus(), 400)
      return null
    }
    localStorage.setItem('frequency.name', finalName)
    return finalName
  }

  const handleJoin = (room: RoomId, locked: boolean) => {
    if (locked) { onUpgrade(); return }
    const finalName = ensureName()
    if (finalName) onJoin(room, finalName)
  }

  const handleJoinPrivate = (room: RoomType) => {
    const finalName = ensureName()
    if (finalName) onJoinRoom(room, finalName)
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
            WebkitMaskImage: 'linear-gradient(to bottom, #000 50%, transparent 88%)',
            maskImage: 'linear-gradient(to bottom, #000 50%, transparent 88%)',
          }}
        >
          <source src={HERO_VIDEO} type="video/mp4" />
        </video>
        {/* Light top scrim only — let the video breathe */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent" />
        {/* Soft side vignettes to keep focus centered */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/20" />
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

            {/* Global hours counter */}
            {totalStudySec > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6, ease }}
                className="mt-5 flex items-center gap-2"
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: featured.accent }} />
                <span className="text-[12px] text-gray-500">
                  <span className="font-mono tabular-nums" style={{ color: featured.accent }}>
                    {Math.floor(totalStudySec / 3600).toLocaleString()}h
                  </span>
                  {' '}studied on Frequency
                </span>
              </motion.div>
            )}

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
              ) : nameConfirmed ? (
                /* Name confirmed — show it with an edit option */
                <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-4">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={{ backgroundColor: featured.accent, color: '#101010' }}
                  >
                    {name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium" style={{ color: '#E1E0CC' }}>{name}</p>
                    <p className="text-[11px] text-gray-500">↓ pick a room to start</p>
                  </div>
                  <button
                    onClick={() => setNameConfirmed(false)}
                    className="text-[11px] text-gray-500 hover:text-gray-300"
                  >
                    edit
                  </button>
                </div>
              ) : (
                <div className="relative">
                  {/* Welcome tooltip for new visitors */}
                  <AnimatePresence>
                    {showTooltip && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute -top-12 left-0 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2 backdrop-blur-sm"
                      >
                        <span className="text-xs text-gray-300">✦ Commence ici</span>
                        <span className="text-[10px] text-gray-500">↓</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <p className="mb-2 text-sm" style={{ color: '#E1E0CC' }}>
                    First, what should we call you?
                  </p>
                  <div className="flex items-center gap-2">
                    <motion.input
                      ref={inputRef}
                      value={name}
                      onChange={(e) => { setName(e.target.value); setNameError(false); setNameConfirmed(false); setShowTooltip(false) }}
                      onKeyDown={(e) => e.key === 'Enter' && confirmName()}
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
                    <button
                      onClick={confirmName}
                      className="shrink-0 rounded-xl px-4 py-3 text-sm font-semibold transition-opacity hover:opacity-80"
                      style={{ backgroundColor: featured.accent, color: '#101010' }}
                    >
                      Continue →
                    </button>
                  </div>
                  <p className="mt-2 text-[11px]" style={{ color: nameError ? '#f87171' : 'rgba(107,114,128,0.8)' }}>
                    {nameError ? '↑ Enter a name first.' : 'Press Enter or click Continue.'}
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

        {/* Activity toasts rendered outside content flow — see fixed overlay below */}

        {/* Pro section */}
        {!isPremium && (
          <div className="mx-auto mt-24 max-w-3xl">
            <div className="rounded-[2rem] border border-white/[0.07] bg-white/[0.02] p-8 md:p-10">
              <div className="flex flex-col gap-8 md:flex-row md:items-center">
                <div className="flex-1">
                  <div
                    className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.2em]"
                    style={{ backgroundColor: `${featured.accent}22`, color: featured.accent }}
                  >
                    <Crown className="h-3 w-3" /> Frequency Pro
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight md:text-3xl" style={{ color: '#E1E0CC' }}>
                    Go deeper with Pro
                  </h2>
                  <p className="mt-2 text-sm text-gray-400">
                    Everything you need to build a real study habit.
                  </p>
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    {[
                      { icon: '🎵', label: '6 live rooms', sub: 'Stardrift, Beat Cellar & Lo-Fi Library' },
                      { icon: '⏱', label: 'Pomodoro', sub: '25 / 50 / 90 min focus sessions' },
                      { icon: '📈', label: 'Session history', sub: 'Streaks, weekly stats, all-time' },
                      { icon: '🔒', label: 'Private rooms', sub: 'Invite-only with shareable link' },
                    ].map((p) => (
                      <div key={p.label} className="flex items-start gap-2.5">
                        <span className="text-base leading-none">{p.icon}</span>
                        <div>
                          <p className="text-[13px] font-medium" style={{ color: '#E1E0CC' }}>{p.label}</p>
                          <p className="text-[11px] text-gray-500">{p.sub}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="shrink-0">
                  <div className="mb-2 text-center">
                    <span className="text-3xl font-semibold" style={{ color: '#E1E0CC' }}>$4</span>
                    <span className="text-sm text-gray-500"> / month</span>
                  </div>
                  <button
                    onClick={onUpgrade}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl px-8 py-3.5 text-sm font-semibold transition-opacity hover:opacity-90"
                    style={{ backgroundColor: featured.accent, color: '#101010' }}
                  >
                    <Zap className="h-4 w-4" />
                    Upgrade to Pro
                  </button>
                  <p className="mt-2 text-center text-[11px] text-gray-600">Cancel anytime</p>
                </div>
              </div>
            </div>
          </div>
        )}

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

        {/* Invite banner — arrived via a private-room link */}
        <AnimatePresence>
          {invite && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-16 flex items-center gap-4 rounded-2xl border p-4 md:p-5"
              style={{ borderColor: `${invite.accent}55`, backgroundColor: `${invite.accent}12` }}
            >
              <span className="text-2xl">🔗</span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400">You've been invited to</p>
                <p className="truncate text-lg" style={{ color: '#E1E0CC' }}>{invite.name}</p>
                <p className="text-xs text-gray-500">{invite.station} · {invite.genre}</p>
              </div>
              <button
                onClick={() => handleJoinPrivate(invite)}
                className="shrink-0 rounded-full px-5 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: invite.accent, color: '#101010' }}
              >
                Join room
              </button>
              <button
                onClick={onDismissInvite}
                aria-label="Dismiss invite"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5 text-gray-400 hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Private rooms */}
        <div className="mt-16 flex items-end justify-between">
          <div>
            <h2 className="text-2xl tracking-tight md:text-3xl" style={{ color: '#E1E0CC' }}>
              Your rooms
            </h2>
            <p className="mt-1 text-xs text-gray-500">Invite-only spaces you've created or joined.</p>
          </div>
          <button
            onClick={onCreateRoom}
            className="flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors"
            style={{ backgroundColor: `${featured.accent}22`, color: featured.accent }}
          >
            {isPremium ? <Plus className="h-4 w-4" /> : <Lock className="h-3.5 w-3.5" />}
            Create private room
          </button>
        </div>
        <div className="mt-5">
          {privateRooms.length === 0 ? (
            <button
              onClick={onCreateRoom}
              className="flex w-full items-center justify-center gap-2 rounded-[1.75rem] border border-dashed border-white/10 py-10 text-sm text-gray-500 transition-colors hover:border-white/20 hover:text-gray-400"
            >
              <Plus className="h-4 w-4" />
              No private rooms yet — create one and share the link
            </button>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {privateRooms.map((room) => (
                <div
                  key={room.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleJoinPrivate(room)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleJoinPrivate(room)}
                  className="group relative cursor-pointer overflow-hidden rounded-[1.75rem] border p-6 text-left transition-colors"
                  style={{ borderColor: `${room.accent}33`, backgroundColor: '#101010' }}
                >
                  <div
                    className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-50"
                    style={{ backgroundColor: room.accent }}
                  />

                  {/* Delete — always visible, clear hit target */}
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteRoom(room.id) }}
                    aria-label={`Delete ${room.name}`}
                    title="Delete room"
                    className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-gray-300 transition-all hover:border-red-500/40 hover:bg-red-500/20 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <div className="relative">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
                      style={{ backgroundColor: `${room.accent}22`, color: room.accent }}
                    >
                      <Lock className="h-2.5 w-2.5" /> Private
                    </span>
                    <h3 className="mt-5 truncate text-2xl tracking-tight" style={{ color: '#E1E0CC' }}>
                      {room.name}
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">{room.station} · {room.genre}</p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm" style={{ color: room.accent }}>
                      <Timer className="h-3.5 w-3.5" /> Tune in
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tuner / room cards */}
        <div ref={roomsRef} className="mt-16 flex items-end justify-between">
          <h2 className="text-2xl tracking-tight md:text-3xl" style={{ color: '#E1E0CC' }}>
            Pick a room
          </h2>
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <Users className="h-3.5 w-3.5" />
            {totalLive} studying now
          </span>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {publicRooms.map((room, i) => {
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
                  ) : isHot(counts[room.id] ?? 0) ? (
                    <motion.span
                      className="flex items-center gap-1 text-[11px] font-medium"
                      style={{ color: room.accent }}
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      🔥 {counts[room.id]} live
                    </motion.span>
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

      {/* Activity toast — bottom left, one at a time */}
      <div className="fixed bottom-6 left-6 z-40">
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ type: 'spring', damping: 24, stiffness: 280 }}
              className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-[#111]/90 px-4 py-3 shadow-2xl backdrop-blur-xl"
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: featured.accent }}
              />
              <span className="text-[13px] text-gray-300">{toast.text}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Persistent now-playing bar — full width strip at bottom */}
      <AnimatePresence>
        {playingRoom && (
          <motion.div
            initial={{ y: 64 }}
            animate={{ y: 0 }}
            exit={{ y: 64 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 inset-x-0 z-50 border-t backdrop-blur-xl"
            style={{
              backgroundColor: 'rgba(8,8,8,0.92)',
              borderColor: `${playingRoom.accent}30`,
            }}
          >
            {/* Thin accent line at top */}
            <div className="absolute inset-x-0 top-0 h-px" style={{ backgroundColor: playingRoom.accent, opacity: 0.4 }} />

            <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-10">
              {/* Live dot */}
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                  style={{ backgroundColor: playingRoom.accent }} />
                <span className="relative inline-flex h-2 w-2 rounded-full"
                  style={{ backgroundColor: playingRoom.accent }} />
              </span>

              {/* Room name */}
              <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.16em]"
                style={{ color: playingRoom.accent }}>
                {playingRoom.name}
              </span>

              <span className="text-gray-700">·</span>

              {/* Track — grows to fill space */}
              <span className="min-w-0 flex-1 truncate text-[12px] text-gray-400">
                {nowPlayingTrack || 'Loading…'}
              </span>

              {/* Back to room */}
              <button
                onClick={() => onJoinRoom(playingRoom, (account?.name ?? name).trim() || 'anon')}
                className="shrink-0 rounded-full px-4 py-1.5 text-[11px] font-semibold transition-opacity hover:opacity-80"
                style={{ backgroundColor: playingRoom.accent, color: '#101010' }}
              >
                Back to room
              </button>

              {/* Stop */}
              <button
                onClick={onStopMusic}
                aria-label="Stop music"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5 text-gray-400 transition-colors hover:bg-white/10 hover:text-red-400"
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
