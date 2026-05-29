import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Send, Users } from 'lucide-react'
import type { ChatMessage } from '../hooks/useRadio'

interface ChatProps {
  messages: ChatMessage[]
  users: string[]
  me: string
  accent: string
  onSend: (text: string) => void
}

function initials(name: string) {
  return name.trim().slice(0, 2).toUpperCase() || '??'
}

export default function Chat({ messages, users, me, accent, onSend }: ChatProps) {
  const [draft, setDraft] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    onSend(text)
    setDraft('')
  }

  return (
    <div className="flex h-[70vh] flex-col overflow-hidden rounded-[2rem] bg-[#101010] lg:h-auto lg:min-h-[400px] lg:max-h-[85vh]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
        <div>
          <p className="text-primary text-[11px] uppercase tracking-[0.2em]">Room chat</p>
          <p className="mt-0.5 text-xs text-gray-500">Say hi to your study companions</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Users className="h-3.5 w-3.5" />
          {users.length}
        </div>
      </div>

      {/* Presence row */}
      {users.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-6 py-3">
          {users.map((u, i) => (
            <span
              key={`${u}-${i}`}
              className="rounded-full px-2.5 py-1 text-[11px]"
              style={{
                color: u === me ? '#101010' : 'rgba(225,224,204,0.8)',
                backgroundColor: u === me ? accent : 'rgba(255,255,255,0.05)',
              }}
            >
              {u === me ? 'you' : u}
            </span>
          ))}
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-6 py-4">
        {messages.length === 0 && (
          <p className="mt-6 text-center text-xs text-gray-600">
            No messages yet — the room is quiet. Break the ice.
          </p>
        )}
        <AnimatePresence initial={false}>
          {messages.map((m) =>
            m.kind === 'system' ? (
              <motion.p
                key={m.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-[11px] italic text-gray-600"
              >
                {m.text}
              </motion.p>
            ) : (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex items-start gap-2.5 ${m.name === me ? 'flex-row-reverse' : ''}`}
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[9px] font-bold"
                  style={{
                    backgroundColor: m.name === me ? accent : 'rgba(255,255,255,0.06)',
                    color: m.name === me ? '#101010' : 'rgba(225,224,204,0.7)',
                  }}
                >
                  {initials(m.name ?? '?')}
                </span>
                <div className={`max-w-[78%] ${m.name === me ? 'items-end text-right' : ''} flex flex-col`}>
                  <span className="text-[10px] text-gray-500">{m.name === me ? 'you' : m.name}</span>
                  <span
                    className="mt-0.5 inline-block break-words rounded-2xl px-3 py-1.5 text-sm"
                    style={{
                      backgroundColor: m.name === me ? accent : 'rgba(255,255,255,0.05)',
                      color: m.name === me ? '#101010' : '#E1E0CC',
                    }}
                  >
                    {m.text}
                  </span>
                </div>
              </motion.div>
            ),
          )}
        </AnimatePresence>
      </div>

      {/* Composer */}
      <form onSubmit={submit} className="flex items-center gap-2 border-t border-white/5 p-4">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={500}
          placeholder="Message the room…"
          className="flex-1 rounded-full bg-white/5 px-4 py-2.5 text-sm text-primary placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-white/10"
        />
        <button
          type="submit"
          aria-label="Send"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-black transition-transform hover:scale-105 disabled:opacity-40"
          disabled={!draft.trim()}
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  )
}
