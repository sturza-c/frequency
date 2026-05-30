import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Copy, Link2, Lock, X } from 'lucide-react'
import { STATIONS } from '../lib/stations'
import { inviteLink, type PrivateRoomConfig } from '../lib/privateRoom'
import type { Room } from '../lib/rooms'

interface CreateRoomModalProps {
  open: boolean
  onClose: () => void
  /** Persist + return the built Room. */
  onCreate: (config: PrivateRoomConfig) => Room
  /** Jump straight into the freshly created room. */
  onEnter: (room: Room) => void
}

const SWATCHES = ['#D8B68A', '#C28F6A', '#9DB0A6', '#CE9197', '#8FA6BC', '#A99CC4', '#7FB3A3']

export default function CreateRoomModal({ open, onClose, onCreate, onEnter }: CreateRoomModalProps) {
  const [name, setName] = useState('')
  const [somaId, setSomaId] = useState(STATIONS[0].somaId)
  const [accent, setAccent] = useState(SWATCHES[0])
  const [created, setCreated] = useState<{ room: Room; link: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const reset = () => {
    setName('')
    setSomaId(STATIONS[0].somaId)
    setAccent(SWATCHES[0])
    setCreated(null)
    setCopied(false)
  }

  const close = () => {
    onClose()
    setTimeout(reset, 250)
  }

  const handleCreate = () => {
    const config: PrivateRoomConfig = { name: name.trim() || 'My study room', somaId, accent }
    const room = onCreate(config)
    setCreated({ room, link: inviteLink(config) })
  }

  const copy = async () => {
    if (!created) return
    try {
      await navigator.clipboard.writeText(created.link)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard blocked — user can select manually */
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
          <motion.div
            className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-md -translate-y-1/2 rounded-3xl border border-white/[0.08] bg-[#0e0e0e] p-7 sm:inset-x-auto sm:left-1/2 sm:w-[440px] sm:-translate-x-1/2"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: '-50%', opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            style={{ left: '50%' }}
          >
            <button
              onClick={close}
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-gray-400 hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>

            {!created ? (
              <>
                <div
                  className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.2em]"
                  style={{ backgroundColor: `${accent}22`, color: accent }}
                >
                  <Lock className="h-3 w-3" />
                  Private room
                </div>
                <h2 className="text-2xl font-semibold tracking-tight" style={{ color: '#E1E0CC' }}>
                  Create your room
                </h2>
                <p className="mt-1.5 text-sm text-gray-400">
                  Pick a station, share the link, study together.
                </p>

                {/* Name */}
                <label className="mt-6 block text-[11px] uppercase tracking-[0.18em] text-gray-500">
                  Room name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={28}
                  placeholder="e.g. Finals war room"
                  className="mt-2 w-full rounded-xl bg-white/[0.06] px-4 py-3 text-base text-primary placeholder:text-gray-600 focus:outline-none"
                  style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.08)' }}
                />

                {/* Station */}
                <label className="mt-4 block text-[11px] uppercase tracking-[0.18em] text-gray-500">
                  Station
                </label>
                <select
                  value={somaId}
                  onChange={(e) => setSomaId(e.target.value)}
                  className="mt-2 w-full rounded-xl bg-white/[0.06] px-4 py-3 text-sm text-primary focus:outline-none"
                  style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.08)' }}
                >
                  {STATIONS.map((s) => (
                    <option key={s.somaId} value={s.somaId} className="bg-[#161616]">
                      {s.station} — {s.genre}
                    </option>
                  ))}
                </select>

                {/* Accent */}
                <label className="mt-4 block text-[11px] uppercase tracking-[0.18em] text-gray-500">
                  Accent
                </label>
                <div className="mt-2 flex gap-2">
                  {SWATCHES.map((c) => (
                    <button
                      key={c}
                      onClick={() => setAccent(c)}
                      aria-label={`Accent ${c}`}
                      className="h-8 w-8 rounded-full transition-transform hover:scale-110"
                      style={{
                        backgroundColor: c,
                        boxShadow: accent === c ? `0 0 0 2px #0e0e0e, 0 0 0 4px ${c}` : 'none',
                      }}
                    />
                  ))}
                </div>

                <button
                  onClick={handleCreate}
                  className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold transition-opacity hover:opacity-90"
                  style={{ backgroundColor: accent, color: '#101010' }}
                >
                  <Link2 className="h-4 w-4" />
                  Create & get invite link
                </button>
              </>
            ) : (
              <>
                <div
                  className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.2em]"
                  style={{ backgroundColor: `${created.room.accent}22`, color: created.room.accent }}
                >
                  <Check className="h-3 w-3" />
                  Room ready
                </div>
                <h2 className="text-2xl font-semibold tracking-tight" style={{ color: '#E1E0CC' }}>
                  {created.room.name}
                </h2>
                <p className="mt-1.5 text-sm text-gray-400">
                  Anyone with this link joins your live room — no account needed.
                </p>

                {/* Invite link */}
                <div
                  className="mt-5 flex items-center gap-2 rounded-xl bg-white/[0.04] p-2 pl-4"
                  style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.08)' }}
                >
                  <span className="min-w-0 flex-1 truncate text-xs text-gray-400">{created.link}</span>
                  <button
                    onClick={copy}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-opacity hover:opacity-90"
                    style={{ backgroundColor: created.room.accent, color: '#101010' }}
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>

                <button
                  onClick={() => { onEnter(created.room); close() }}
                  className="mt-6 w-full rounded-2xl border border-white/10 py-3.5 text-sm font-semibold text-primary transition-colors hover:bg-white/5"
                >
                  Enter room now →
                </button>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
