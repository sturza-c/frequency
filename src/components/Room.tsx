import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, MessageSquare, PanelRightClose, User } from 'lucide-react'
import type { Room as RoomType, RoomId } from '../lib/rooms'
import type { ChatMessage } from '../hooks/useRadio'
import type { StudyTimer as StudyTimerType } from '../hooks/useStudyTimer'
import type { Countdown } from '../hooks/useCountdown'
import type { SceneId } from '../lib/themes'
import Player from './Player'
import Chat from './Chat'
import SceneBackground from './SceneBackground'
import RoomSwitcher from './RoomSwitcher'
import Customizer from './Customizer'

interface RoomProps {
  room: RoomType
  me: string
  messages: ChatMessage[]
  users: string[]
  counts: Record<RoomId, number>
  accent: string
  scene: SceneId
  timer: StudyTimerType
  countdown: Countdown
  track: string
  isPremium: boolean
  onSend: (text: string) => void
  onLeave: () => void
  onSwitch: (id: RoomId) => void
  onAccent: (accent: string) => void
  onScene: (scene: SceneId) => void
  onOpenProfile: () => void
  onUpgrade: () => void
}

const MIN_CHAT = 300
const MAX_CHAT = 620

export default function Room({
  room,
  me,
  messages,
  users,
  counts,
  accent,
  scene,
  timer,
  countdown,
  track,
  isPremium,
  onSend,
  onLeave,
  onSwitch,
  onAccent,
  onScene,
  onOpenProfile,
  onUpgrade,
}: RoomProps) {
  const [chatOpen, setChatOpen] = useState(
    () => localStorage.getItem('frequency.chatOpen') !== 'false',
  )
  const [chatWidth, setChatWidth] = useState(() => {
    const stored = Number(localStorage.getItem('frequency.chatWidth'))
    return stored >= MIN_CHAT && stored <= MAX_CHAT ? stored : 440
  })
  const dragging = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    localStorage.setItem('frequency.chatOpen', String(chatOpen))
  }, [chatOpen])
  useEffect(() => {
    localStorage.setItem('frequency.chatWidth', String(chatWidth))
  }, [chatWidth])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return
      const right = containerRef.current.getBoundingClientRect().right
      const next = Math.min(MAX_CHAT, Math.max(MIN_CHAT, right - e.clientX))
      setChatWidth(next)
    }
    const onUp = () => {
      dragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  const startDrag = () => {
    dragging.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  return (
    <div className="relative min-h-screen bg-black px-4 py-6 md:px-8 md:py-8">
      <SceneBackground scene={scene} accent={accent} />

      <div className="relative mx-auto max-w-[1500px]">
        <header className="mb-6 flex items-center gap-3">
          <button
            onClick={onLeave}
            className="flex shrink-0 items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-primary"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">All rooms</span>
          </button>

          <div className="mx-2 hidden min-w-0 flex-1 justify-center md:flex">
            <RoomSwitcher activeId={room.id} counts={counts} accent={accent} onSwitch={onSwitch} />
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Customizer accent={accent} scene={scene} onAccent={onAccent} onScene={onScene} />
            <button
              onClick={() => setChatOpen((o) => !o)}
              aria-label={chatOpen ? 'Hide chat' : 'Show chat'}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-gray-300 transition-colors hover:bg-white/10"
            >
              {chatOpen ? (
                <PanelRightClose className="h-4 w-4" />
              ) : (
                <MessageSquare className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={onOpenProfile}
              aria-label="Profile"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-gray-300 transition-colors hover:bg-white/10"
            >
              <User className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Mobile room switcher */}
        <div className="mb-4 flex justify-center md:hidden">
          <RoomSwitcher activeId={room.id} counts={counts} accent={accent} onSwitch={onSwitch} />
        </div>

        <div ref={containerRef} className="flex flex-col gap-4 lg:h-[82vh] lg:flex-row">
          <div className="min-w-0 flex-1">
            <Player
              room={room}
              listeners={users.length}
              accent={accent}
              timer={timer}
              countdown={countdown}
              track={track}
              isPremium={isPremium}
              onUpgrade={onUpgrade}
            />
          </div>

          {/* Resize handle */}
          {chatOpen && (
            <div
              onMouseDown={startDrag}
              className="group hidden w-1.5 shrink-0 cursor-col-resize items-center justify-center lg:flex"
            >
              <span className="h-12 w-1 rounded-full bg-white/10 transition-colors group-hover:bg-white/25" />
            </div>
          )}

          {chatOpen && (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="h-[70vh] w-full shrink-0 lg:h-full lg:w-[var(--chat-w)]"
              style={{ '--chat-w': `${chatWidth}px` } as React.CSSProperties}
            >
              <Chat messages={messages} users={users} me={me} accent={accent} onSend={onSend} />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
