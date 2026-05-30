import { motion } from 'framer-motion'
import type { SeatEntry } from '../hooks/useRadio'

interface SeatMapProps {
  seats: SeatEntry[]
  mySeat: string
  accent: string
}

export default function SeatMap({ seats, mySeat, accent }: SeatMapProps) {
  if (seats.length === 0) return null

  return (
    <div className="rounded-2xl bg-white/[0.03] px-4 py-3">
      <p className="mb-2.5 text-[10px] uppercase tracking-[0.18em] text-gray-600">In the room</p>
      <div className="flex flex-wrap gap-2">
        {seats.map((s) => {
          const isMe = s.seat === mySeat
          return (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              className="flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5"
              style={{
                borderColor: isMe ? `${accent}66` : 'rgba(255,255,255,0.06)',
                backgroundColor: isMe ? `${accent}15` : 'rgba(255,255,255,0.02)',
              }}
            >
              {/* Seat emoji */}
              <span className="text-sm leading-none">{s.seat.split(' ')[0]}</span>
              <div className="min-w-0">
                <p
                  className="truncate text-[11px] font-medium leading-tight"
                  style={{ color: isMe ? accent : '#E1E0CC', maxWidth: '7rem' }}
                >
                  {s.name}{isMe ? ' (you)' : ''}
                </p>
                <p className="truncate text-[10px] leading-tight text-gray-600">
                  {s.seat.split(' ').slice(1).join(' ')}
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
