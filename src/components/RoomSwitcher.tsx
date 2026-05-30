import { motion } from 'framer-motion'
import { ROOMS, type RoomId } from '../lib/rooms'
import { isHot } from '../lib/hot'

interface RoomSwitcherProps {
  activeId: RoomId
  counts: Record<RoomId, number>
  accent: string
  onSwitch: (id: RoomId) => void
}

export default function RoomSwitcher({ activeId, counts, accent, onSwitch }: RoomSwitcherProps) {
  return (
    <div className="no-scrollbar flex max-w-full items-center gap-1 overflow-x-auto rounded-full bg-white/5 p-1">
      {ROOMS.map((room) => {
        const active = room.id === activeId
        return (
          <button
            key={room.id}
            onClick={() => onSwitch(room.id)}
            className="relative flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors"
            style={{ color: active ? '#101010' : 'rgba(225,224,204,0.7)' }}
          >
            {active && (
              <motion.span
                layoutId="room-pill"
                className="absolute inset-0 rounded-full"
                style={{ backgroundColor: accent }}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative whitespace-nowrap font-medium">{room.name}</span>
            {isHot(counts[room.id] ?? 0) ? (
              <motion.span
                className="relative text-sm leading-none"
                animate={{ scale: [1, 1.25, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              >
                🔥
              </motion.span>
            ) : (
              <span
                className="relative rounded-full px-1.5 text-[10px] tabular-nums"
                style={{
                  backgroundColor: active ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.06)',
                  color: active ? '#101010' : 'rgba(225,224,204,0.55)',
                }}
              >
                {counts[room.id] ?? 0}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
