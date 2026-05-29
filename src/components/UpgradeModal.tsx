import { motion, AnimatePresence } from 'framer-motion'
import { Crown, Lock, Zap, X } from 'lucide-react'

interface UpgradeModalProps {
  open: boolean
  onClose: () => void
  onUpgrade: () => void
  /** Accent colour from the room that triggered the modal, for theming. */
  accent: string
}

const PERKS = [
  { icon: '🎵', label: '6 live rooms', sub: 'Unlock After Hours, Beat Cellar & Daydream' },
  { icon: '⏱', label: 'Pomodoro countdown', sub: '25 / 50 min focus sessions with auto-log' },
  { icon: '📈', label: 'Session history', sub: 'Streaks, weekly stats, all-time totals' },
  { icon: '🎨', label: 'Custom themes', sub: 'Accent colours & scene backgrounds' },
]

export default function UpgradeModal({ open, onClose, onUpgrade, accent }: UpgradeModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="fixed inset-x-4 bottom-0 z-50 mx-auto max-w-md rounded-t-3xl border border-white/[0.08] bg-[#0e0e0e] pb-10 pt-8 sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:w-[420px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:pb-8"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-gray-400 hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="px-7">
              <div
                className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.2em]"
                style={{ backgroundColor: `${accent}22`, color: accent }}
              >
                <Crown className="h-3 w-3" />
                Frequency Premium
              </div>
              <h2 className="text-2xl font-semibold tracking-tight" style={{ color: '#E1E0CC' }}>
                Unlock the full experience
              </h2>
              <p className="mt-1.5 text-sm text-gray-400">
                Everything you need to build a deep-work habit.
              </p>
            </div>

            {/* Perks */}
            <ul className="mt-6 space-y-1 px-7">
              {PERKS.map((p) => (
                <li key={p.label} className="flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-white/[0.03]">
                  <span className="mt-0.5 text-lg leading-none">{p.icon}</span>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#E1E0CC' }}>{p.label}</p>
                    <p className="text-[12px] text-gray-500">{p.sub}</p>
                  </div>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <div className="mt-6 px-7">
              <button
                onClick={() => { onUpgrade(); onClose() }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: accent, color: '#101010' }}
              >
                <Zap className="h-4 w-4" />
                Upgrade to Premium — $4 / month
              </button>
              <p className="mt-3 text-center text-[11px] text-gray-600">
                Demo mode: clicking above unlocks instantly (no real payment).
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/** Small inline lock badge for premium features inside a room. */
export function PremiumBadge({ accent }: { accent: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
      style={{ backgroundColor: `${accent}22`, color: accent }}
    >
      <Lock className="h-2.5 w-2.5" />
      Pro
    </span>
  )
}
