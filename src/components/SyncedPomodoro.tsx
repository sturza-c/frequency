import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Play, Square, Users } from 'lucide-react'
import type { SyncedPomState } from '../hooks/useSyncedPomodoro'

interface SyncedPomProps {
  state: SyncedPomState
  accent: string
  onStart: (focusMin: number, breakMin: number) => void
  onStop: () => void
}

const PRESETS = [
  { label: '25 / 5', focus: 25, brk: 5 },
  { label: '50 / 10', focus: 50, brk: 10 },
  { label: '90 / 15', focus: 90, brk: 15 },
]

function fmt(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0')
  const s = (sec % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function SyncedPomodoro({ state, accent, onStart, onStop }: SyncedPomProps) {
  const [selected, setSelected] = useState(0)
  const pct = state.duration > 0 ? 1 - state.remaining / state.duration : 0
  const isFocus = state.phase === 'focus'
  const isBreak = state.phase === 'break'
  const isIdle = state.phase === 'idle'

  return (
    <div className="rounded-2xl bg-white/[0.03] px-4 py-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Users className="h-3 w-3 text-gray-500" />
          <span className="text-[10px] uppercase tracking-[0.18em] text-gray-500">Room session</span>
        </div>
        {!isIdle && (
          <span
            className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.12em]"
            style={{ backgroundColor: isFocus ? `${accent}22` : 'rgba(110,200,110,0.15)', color: isFocus ? accent : '#6ec86e' }}
          >
            {isFocus ? `🍅 Focus · round ${state.round}` : '🌿 Break'}
          </span>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isIdle ? (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="mb-3 text-xs text-gray-500">Start a synchronized session — everyone in the room counts down together.</p>
            <div className="mb-3 flex gap-2">
              {PRESETS.map((p, i) => (
                <button
                  key={p.label}
                  onClick={() => setSelected(i)}
                  className="rounded-xl border px-3 py-1.5 text-[11px] transition-colors"
                  style={{
                    borderColor: selected === i ? accent : 'rgba(255,255,255,0.08)',
                    color: selected === i ? accent : 'rgba(225,224,204,0.6)',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => onStart(PRESETS[selected].focus, PRESETS[selected].brk)}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ backgroundColor: accent, color: '#101010' }}
            >
              <Play className="h-4 w-4" fill="currentColor" />
              Start for everyone
            </button>
          </motion.div>
        ) : (
          <motion.div key="running" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Big countdown */}
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-4xl tabular-nums tracking-tight" style={{ color: isFocus ? '#E1E0CC' : '#6ec86e' }}>
                {fmt(state.remaining)}
              </span>
              <span className="text-sm text-gray-500">
                {isFocus ? 'until break' : 'until focus'}
              </span>
            </div>

            {/* Progress bar */}
            <div className="my-3 h-1 overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: isFocus ? accent : '#6ec86e', width: `${pct * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            {isBreak && (
              <p className="mb-2 text-[11px] text-gray-500">
                💬 Chat is open during the break — stretch, grab water, say hi.
              </p>
            )}
            {isFocus && (
              <div className="mb-2 flex items-center gap-1.5 text-[11px]" style={{ color: accent }}>
                <Lock className="h-3 w-3" />
                <span>Chat locked — stay in the zone.</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-[11px] text-gray-500">
              <span>Started by {state.startedBy}</span>
              <span>·</span>
              <button
                onClick={onStop}
                className="flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 text-gray-400 transition-colors hover:bg-white/10"
              >
                <Square className="h-3 w-3 fill-current" /> End session
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
