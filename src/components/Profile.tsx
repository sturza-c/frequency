import { motion } from 'framer-motion'
import { Flame, LogOut, X } from 'lucide-react'
import { formatDuration } from '../hooks/useStudyTimer'
import type { StudySession, StudyStats } from '../hooks/useStudySessions'

interface ProfileProps {
  name: string
  stats: StudyStats
  sessions: StudySession[]
  accent: string
  onClose: () => void
  onSignOut: () => void
}

function relativeDay(ts: number) {
  const d = new Date(ts)
  const today = new Date()
  const diff = Math.floor(
    (new Date(today.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 86400000,
  )
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return `${diff} days ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function Profile({
  name,
  stats,
  sessions,
  accent,
  onClose,
  onSignOut,
}: ProfileProps) {
  const cards = [
    { label: 'Day streak', value: `${stats.streak}`, flame: true },
    { label: 'Focused today', value: formatDuration(stats.todaySec) },
    { label: 'This week', value: formatDuration(stats.weekSec) },
    { label: 'All time', value: formatDuration(stats.totalSec) },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0e0e0e] p-6"
      >
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full blur-3xl"
          style={{ backgroundColor: accent, opacity: 0.18 }}
        />
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-gray-400 transition-colors hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative flex items-center gap-3">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold"
            style={{ backgroundColor: accent, color: '#101010' }}
          >
            {name.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <p className="text-lg" style={{ color: '#E1E0CC' }}>
              {name}
            </p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500">
              {stats.count} {stats.count === 1 ? 'session' : 'sessions'} logged
            </p>
          </div>
        </div>

        <div className="relative mt-5 grid grid-cols-2 gap-2.5">
          {cards.map((c) => (
            <div key={c.label} className="rounded-2xl bg-white/[0.03] px-4 py-3">
              <div className="flex items-center gap-1.5">
                {c.flame && <Flame className="h-3.5 w-3.5" style={{ color: accent }} />}
                <span className="font-mono text-2xl tabular-nums" style={{ color: '#E1E0CC' }}>
                  {c.value}
                </span>
              </div>
              <span className="text-[10px] uppercase tracking-[0.16em] text-gray-500">
                {c.label}
              </span>
            </div>
          ))}
        </div>

        <p className="relative mt-5 text-[11px] uppercase tracking-[0.18em] text-gray-500">
          Recent sessions
        </p>
        <div className="relative mt-2 max-h-48 space-y-1.5 overflow-y-auto">
          {sessions.length === 0 ? (
            <p className="py-6 text-center text-xs text-gray-600">
              No sessions yet — start a focus block and it'll show up here.
            </p>
          ) : (
            sessions.slice(0, 30).map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-xl bg-white/[0.02] px-3 py-2 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: accent }}
                  />
                  <span style={{ color: '#E1E0CC' }}>{s.station}</span>
                  <span className="text-gray-600">·</span>
                  <span className="text-gray-500">{s.mode}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono tabular-nums text-gray-400">
                    {formatDuration(s.durationSec)}
                  </span>
                  <span className="text-gray-600">{relativeDay(s.ts)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <button
          onClick={onSignOut}
          className="relative mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-white/5 py-2.5 text-sm text-gray-300 transition-colors hover:bg-white/10"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </motion.div>
    </motion.div>
  )
}
