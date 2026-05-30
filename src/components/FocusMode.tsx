import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import type { SyncedPomState } from '../hooks/useSyncedPomodoro'

interface FocusModeProps {
  open: boolean
  onClose: () => void
  roomName: string
  track: string
  accent: string
  /** Synced room Pomodoro state (may be idle). */
  pomState: SyncedPomState
  /** Personal countdown (non-synced). remaining in seconds, 0 if not running. */
  personalRemaining?: number
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0')
  const s = (sec % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function FocusMode({
  open, onClose, roomName, track, accent, pomState, personalRemaining = 0,
}: FocusModeProps) {
  // F key toggles; Esc exits.
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'f' || e.key === 'F') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  // What to show: synced Pomodoro takes priority, then personal, then stopwatch.
  const hasSynced = pomState.phase !== 'idle'
  const hasPersonal = personalRemaining > 0
  const displaySec = hasSynced ? pomState.remaining : hasPersonal ? personalRemaining : 0
  const phase = hasSynced ? pomState.phase : 'focus'
  const isBreak = phase === 'break'
  const timerColor = isBreak ? '#6ec86e' : accent

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Ambient glow */}
          <motion.div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at 50% 40%, ${timerColor}18 0%, transparent 70%)`,
            }}
            animate={{ opacity: isBreak ? [0.6, 1, 0.6] : [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-gray-400 transition-colors hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
          <p className="absolute left-6 top-6 text-sm text-gray-600">Press F or Esc to exit focus mode</p>

          {/* Room name */}
          <p className="mb-8 text-[11px] uppercase tracking-[0.3em] text-gray-600">{roomName}</p>

          {/* Phase label */}
          {hasSynced && (
            <motion.p
              className="mb-4 text-sm uppercase tracking-[0.2em]"
              style={{ color: timerColor }}
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {isBreak ? '🌿 Break time' : `🍅 Focus · round ${pomState.round}`}
            </motion.p>
          )}

          {/* Giant timer */}
          {displaySec > 0 ? (
            <motion.p
              className="font-mono tabular-nums"
              style={{ fontSize: 'clamp(5rem, 18vw, 12rem)', color: timerColor, lineHeight: 1 }}
              key={Math.floor(displaySec / 60)} // re-animate on minute change
              initial={{ scale: 0.97 }}
              animate={{ scale: 1 }}
            >
              {fmt(displaySec)}
            </motion.p>
          ) : (
            <p className="font-mono text-9xl tabular-nums text-gray-700">
              Focus
            </p>
          )}

          {/* Now playing */}
          {track && (
            <p className="mt-10 max-w-sm text-center text-sm text-gray-500">{track}</p>
          )}

          {/* Synced session info */}
          {hasSynced && (
            <p className="mt-4 text-xs text-gray-600">
              Synced with everyone in the room · started by {pomState.startedBy}
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
