import { motion } from 'framer-motion'

interface TurntableProps {
  playing: boolean
  accent: string
  label: string
  sublabel?: string
  className?: string
}

export default function Turntable({
  playing,
  accent,
  label,
  sublabel,
  className = '',
}: TurntableProps) {
  return (
    <div className={`relative ${className}`}>
      {/* Platter */}
      <div className="relative aspect-square w-full">
        {/* Record */}
        <div
          className="vinyl-spin absolute inset-0 rounded-full"
          style={{
            animationPlayState: playing ? 'running' : 'paused',
            background:
              'repeating-radial-gradient(circle at center, #0b0b0b 0px, #0b0b0b 1px, #161616 2px, #0b0b0b 3px)',
            boxShadow:
              'inset 0 0 60px rgba(0,0,0,0.9), 0 20px 60px rgba(0,0,0,0.6)',
          }}
        >
          {/* sheen */}
          <div
            className="absolute inset-0 rounded-full opacity-40"
            style={{
              background:
                'conic-gradient(from 0deg, rgba(255,255,255,0) 0deg, rgba(255,255,255,0.06) 60deg, rgba(255,255,255,0) 120deg, rgba(255,255,255,0) 240deg, rgba(255,255,255,0.05) 300deg, rgba(255,255,255,0) 360deg)',
            }}
          />
          {/* Centre label */}
          <div
            className="absolute left-1/2 top-1/2 flex aspect-square w-[42%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full text-center"
            style={{
              background: `radial-gradient(circle at 35% 30%, ${accent}, ${accent}cc 55%, ${accent}88)`,
              boxShadow: 'inset 0 0 12px rgba(0,0,0,0.35)',
            }}
          >
            <span className="px-2 text-[10px] font-bold uppercase leading-tight tracking-[0.14em] text-black/80">
              {label}
            </span>
            {sublabel && (
              <span className="mt-0.5 text-[8px] uppercase tracking-[0.2em] text-black/50">
                {sublabel}
              </span>
            )}
            {/* spindle */}
            <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/60" />
          </div>
        </div>

        {/* Glow under the disc */}
        <div
          className="pointer-events-none absolute inset-0 -z-10 rounded-full blur-2xl"
          style={{ backgroundColor: accent, opacity: playing ? 0.25 : 0.08 }}
        />
      </div>

      {/* Tonearm */}
      <motion.div
        className="absolute -right-1 top-2 origin-top-right"
        style={{ width: '46%' }}
        animate={{ rotate: playing ? 28 : 6 }}
        transition={{ type: 'spring', stiffness: 120, damping: 14 }}
      >
        <div className="relative h-1.5 w-full rounded-full bg-gradient-to-l from-[#cfcdbb] to-[#8d8b7d] shadow-md">
          {/* pivot */}
          <span className="absolute -right-2 -top-1.5 h-5 w-5 rounded-full bg-[#3a3a36] shadow" />
          {/* headshell */}
          <span className="absolute -left-1 -top-1 h-3 w-4 rounded-sm bg-[#d8d6c4]" />
        </div>
      </motion.div>
    </div>
  )
}
