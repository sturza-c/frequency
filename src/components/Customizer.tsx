import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Palette } from 'lucide-react'
import { MOODS, SCENES, type SceneId } from '../lib/themes'

interface CustomizerProps {
  accent: string
  scene: SceneId
  onAccent: (accent: string) => void
  onScene: (scene: SceneId) => void
}

export default function Customizer({ accent, scene, onAccent, onScene }: CustomizerProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Customize room"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-gray-300 transition-colors hover:bg-white/10"
        style={open ? { color: accent } : undefined}
      >
        <Palette className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              className="absolute right-0 z-40 mt-2 w-64 rounded-2xl border border-white/10 bg-[#131313] p-4 shadow-2xl"
            >
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Mood</p>
              <div className="mt-3 flex flex-wrap gap-2.5">
                {MOODS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => onAccent(m.accent)}
                    aria-label={m.name}
                    title={m.name}
                    className="relative flex h-8 w-8 items-center justify-center rounded-full transition-transform hover:scale-110"
                    style={{ backgroundColor: m.accent }}
                  >
                    {accent.toLowerCase() === m.accent.toLowerCase() && (
                      <Check className="h-4 w-4 text-black/70" />
                    )}
                  </button>
                ))}
              </div>

              <p className="mt-4 text-[10px] uppercase tracking-[0.2em] text-gray-500">Scene</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {SCENES.map((s) => {
                  const selected = s.id === scene
                  return (
                    <button
                      key={s.id}
                      onClick={() => onScene(s.id)}
                      title={s.blurb}
                      className="rounded-xl border px-2 py-2 text-center transition-colors"
                      style={{
                        borderColor: selected ? accent : 'rgba(255,255,255,0.08)',
                        backgroundColor: selected ? `${accent}1f` : 'transparent',
                      }}
                    >
                      <span
                        className="block text-[11px]"
                        style={{ color: selected ? accent : 'rgba(225,224,204,0.7)' }}
                      >
                        {s.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
