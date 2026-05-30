import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { PomPhase } from '../hooks/useSyncedPomodoro'

interface PhaseOverlayProps {
  phase: PomPhase
  round: number
  accent: string
}

export default function PhaseOverlay({ phase, round, accent }: PhaseOverlayProps) {
  const prevRef = useRef<PomPhase>('idle')
  const [visible, setVisible] = useState(false)
  const [displayPhase, setDisplayPhase] = useState<PomPhase>('idle')

  useEffect(() => {
    const prev = prevRef.current
    prevRef.current = phase
    if (prev === phase || phase === 'idle') return
    setDisplayPhase(phase)
    setVisible(true)
    const t = setTimeout(() => setVisible(false), 3200)
    return () => clearTimeout(t)
  }, [phase])

  const isBreak = displayPhase === 'break'
  const color = isBreak ? '#6ec86e' : accent

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[90] flex flex-col items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="absolute inset-0 bg-black/80" />
          <motion.div
            className="absolute h-[60vh] w-[60vh] rounded-full blur-[120px]"
            style={{ backgroundColor: color }}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1.4, opacity: 0.18 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
          <motion.div
            className="relative text-center"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <p className="mb-2 text-6xl font-semibold md:text-8xl">
              {isBreak ? '🌿' : '🍅'}
            </p>
            <p className="text-3xl font-semibold tracking-tight md:text-5xl" style={{ color: '#E1E0CC' }}>
              {isBreak ? 'Break time' : 'Focus time'}
            </p>
            <p className="mt-3 text-base text-gray-400">
              {isBreak ? 'Breathe. Stretch. You earned it.' : `Round ${round} — lock in.`}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
