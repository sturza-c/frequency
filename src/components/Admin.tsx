import { useCallback, useEffect, useState } from 'react'
import { Activity, Eye, EyeOff, RefreshCw, Trash2, Users, UserX, Lock, ArrowUp, ArrowDown } from 'lucide-react'
import { ROOM_BY_ID } from '../lib/rooms'
import {
  loadStationConfig,
  saveStationConfig,
  orderedRooms,
  type StationConfig,
} from '../lib/stationConfig'
import { formatDuration } from '../hooks/useStudyTimer'

const API = import.meta.env.DEV ? `http://${location.hostname}:8080` : ''
const AUTH_KEY = 'frequency.admin.token'

interface RoomStat {
  id: string
  private: boolean
  count: number
  members: { id: string; name: string }[]
  messages: number
  lastTs: number | null
  recent: { name: string; text: string; ts: number; id: string }[]
}
interface Stats {
  rooms: RoomStat[]
  totalConnections: number
  privateCount: number
  uptimeSec: number
  now: number
}

function roomLabel(id: string) {
  return ROOM_BY_ID[id as keyof typeof ROOM_BY_ID]?.name ?? id
}

/** Aggregate study sessions stored locally on this device (all profiles). */
function localUsage() {
  let totalSec = 0
  let count = 0
  const names = new Set<string>()
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (!k || !k.startsWith('frequency.sessions.')) continue
    names.add(k.slice('frequency.sessions.'.length))
    try {
      const arr = JSON.parse(localStorage.getItem(k) || '[]')
      for (const s of arr) {
        totalSec += Number(s.durationSec) || 0
        count++
      }
    } catch {
      /* ignore */
    }
  }
  return { totalSec, count, profiles: names.size }
}

export default function Admin() {
  const [token, setToken] = useState(() => sessionStorage.getItem(AUTH_KEY) ?? '')
  const [input, setInput] = useState('')
  const [authed, setAuthed] = useState(false)
  const [error, setError] = useState('')
  const [stats, setStats] = useState<Stats | null>(null)
  const [cfg, setCfg] = useState<StationConfig>(loadStationConfig)
  const [expanded, setExpanded] = useState<string | null>(null)

  const fetchStats = useCallback(async (tok: string) => {
    const res = await fetch(`${API}/api/admin/stats?token=${encodeURIComponent(tok)}`)
    if (res.status === 401) throw new Error('Wrong password')
    if (!res.ok) throw new Error('Server error')
    return (await res.json()) as Stats
  }, [])

  // Validate token + start polling once authed.
  useEffect(() => {
    if (!token) return
    let alive = true
    const tick = async () => {
      try {
        const s = await fetchStats(token)
        if (!alive) return
        setStats(s)
        setAuthed(true)
        setError('')
      } catch (e) {
        if (!alive) return
        setAuthed(false)
        setError((e as Error).message)
        sessionStorage.removeItem(AUTH_KEY)
        setToken('')
      }
    }
    tick()
    const id = setInterval(tick, 3000)
    return () => { alive = false; clearInterval(id) }
  }, [token, fetchStats])

  const login = () => {
    const t = input.trim()
    if (!t) return
    sessionStorage.setItem(AUTH_KEY, t)
    setToken(t)
  }

  const clearRoom = async (room: string) => {
    await fetch(`${API}/api/admin/clear?token=${encodeURIComponent(token)}&room=${room}`, { method: 'POST' })
    setStats((s) => s && { ...s, rooms: s.rooms.map((r) => (r.id === room ? { ...r, recent: [], messages: 0 } : r)) })
  }

  const kick = async (clientId: string) => {
    await fetch(`${API}/api/admin/kick?token=${encodeURIComponent(token)}&client=${clientId}`, { method: 'POST' })
  }

  const persistCfg = (next: StationConfig) => { setCfg(next); saveStationConfig(next) }
  const toggleHidden = (id: string) => {
    const hidden = cfg.hidden.includes(id as any)
      ? cfg.hidden.filter((x) => x !== id)
      : [...cfg.hidden, id as any]
    persistCfg({ ...cfg, hidden })
  }
  const move = (id: string, dir: -1 | 1) => {
    const order = [...cfg.order]
    const i = order.indexOf(id as any)
    const j = i + dir
    if (i < 0 || j < 0 || j >= order.length) return
    ;[order[i], order[j]] = [order[j], order[i]]
    persistCfg({ ...cfg, order })
  }

  // --- Login screen ---
  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-4 text-primary">
        <div className="w-full max-w-sm rounded-3xl border border-white/[0.08] bg-[#0e0e0e] p-7">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-gray-400">
            <Lock className="h-3 w-3" /> Admin
          </div>
          <h1 className="text-2xl font-semibold" style={{ color: '#E1E0CC' }}>Dashboard access</h1>
          <p className="mt-1.5 text-sm text-gray-500">Enter the admin password to continue.</p>
          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && login()}
            placeholder="password"
            className="mt-5 w-full rounded-xl bg-white/[0.06] px-4 py-3 text-base focus:outline-none"
            style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.08)' }}
            autoFocus
          />
          {error && <p className="mt-2 text-[12px] text-red-400">{error}</p>}
          <button
            onClick={login}
            className="mt-5 w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90"
          >
            Sign in
          </button>
          <p className="mt-3 text-center text-[11px] text-gray-600">
            Demo password: <code className="text-gray-400">frequency-admin</code>
          </p>
        </div>
      </div>
    )
  }

  const usage = localUsage()
  const fmtUptime = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60)
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  const metrics = [
    { label: 'Connected now', value: stats?.totalConnections ?? 0, icon: Users },
    { label: 'Active rooms', value: stats?.rooms.filter((r) => r.count > 0).length ?? 0, icon: Activity },
    { label: 'Private rooms', value: stats?.privateCount ?? 0, icon: Lock },
    { label: 'Uptime', value: stats ? fmtUptime(stats.uptimeSec) : '—', icon: RefreshCw },
  ]

  return (
    <div className="min-h-screen bg-black px-5 py-8 text-primary md:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2" style={{ color: '#E1E0CC' }}>
            <Activity className="h-5 w-5" />
            <span className="text-sm font-bold tracking-[0.2em]">FREQUENCY · ADMIN</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" /> live
            </span>
            <a href="/" className="rounded-full bg-white/5 px-3 py-1.5 hover:bg-white/10">← app</a>
          </div>
        </header>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-2xl bg-white/[0.03] px-4 py-3.5">
              <m.icon className="mb-2 h-4 w-4 text-gray-500" />
              <p className="font-mono text-2xl tabular-nums" style={{ color: '#E1E0CC' }}>{m.value}</p>
              <p className="text-[10px] uppercase tracking-[0.16em] text-gray-500">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Live rooms + moderation */}
        <h2 className="mb-3 mt-10 text-lg" style={{ color: '#E1E0CC' }}>Live rooms & chat</h2>
        <div className="space-y-2">
          {stats?.rooms.filter((r) => r.count > 0 || r.messages > 0).map((r) => (
            <div key={r.id} className="rounded-2xl bg-white/[0.03] p-4">
              <div className="flex items-center gap-3">
                <span className="font-medium" style={{ color: '#E1E0CC' }}>
                  {r.private ? '🔒 ' : ''}{roomLabel(r.id)}
                </span>
                <span className="text-xs text-gray-500">{r.count} live · {r.messages} msgs</span>
                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                    className="rounded-lg bg-white/5 px-2.5 py-1 text-[11px] text-gray-400 hover:bg-white/10"
                  >
                    {expanded === r.id ? 'Hide' : 'Messages'}
                  </button>
                  <button
                    onClick={() => clearRoom(r.id)}
                    className="flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1 text-[11px] text-gray-400 hover:bg-red-500/15 hover:text-red-400"
                  >
                    <Trash2 className="h-3 w-3" /> Clear
                  </button>
                </div>
              </div>
              {/* Members with kick buttons */}
              {r.members.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {r.members.map((m) => (
                    <span key={m.id} className="group/mem flex items-center gap-1 rounded-full bg-white/5 py-0.5 pl-2.5 pr-1 text-[11px] text-gray-300">
                      {m.name}
                      <button
                        onClick={() => kick(m.id)}
                        title={`Kick ${m.name}`}
                        aria-label={`Kick ${m.name}`}
                        className="flex h-5 w-5 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-red-500/20 hover:text-red-400"
                      >
                        <UserX className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {expanded === r.id && (
                <div className="mt-3 space-y-1 border-t border-white/5 pt-3">
                  {r.recent.length === 0 ? (
                    <p className="text-[12px] text-gray-600">No messages.</p>
                  ) : r.recent.map((m) => (
                    <div key={m.id} className="flex gap-2 text-[12px]">
                      <span className="shrink-0 text-gray-500">{m.name}:</span>
                      <span className="text-gray-300">{m.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {stats && stats.rooms.every((r) => r.count === 0 && r.messages === 0) && (
            <p className="rounded-2xl bg-white/[0.03] p-6 text-center text-sm text-gray-600">
              No active rooms right now.
            </p>
          )}
        </div>

        {/* Station management */}
        <h2 className="mb-1 mt-10 text-lg" style={{ color: '#E1E0CC' }}>Stations</h2>
        <p className="mb-3 text-xs text-gray-500">Reorder or hide public rooms in the lobby (saved on this device).</p>
        <div className="space-y-2">
          {orderedRooms(cfg).map((room, i, arr) => {
            const hidden = cfg.hidden.includes(room.id)
            return (
              <div key={room.id} className="flex items-center gap-3 rounded-2xl bg-white/[0.03] px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: room.accent }} />
                <span className="font-medium" style={{ color: hidden ? '#6b7280' : '#E1E0CC' }}>{room.name}</span>
                <span className="text-xs text-gray-600">{room.station}</span>
                <div className="ml-auto flex items-center gap-1.5">
                  <button onClick={() => move(room.id, -1)} disabled={i === 0}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 disabled:opacity-30">
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => move(room.id, 1)} disabled={i === arr.length - 1}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 disabled:opacity-30">
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => toggleHidden(room.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-gray-400 hover:bg-white/10">
                    {hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Usage (local device) */}
        <h2 className="mb-1 mt-10 text-lg" style={{ color: '#E1E0CC' }}>Usage</h2>
        <p className="mb-3 text-xs text-gray-500">Study sessions logged on this device.</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total study time', value: formatDuration(usage.totalSec) },
            { label: 'Sessions logged', value: `${usage.count}` },
            { label: 'Profiles', value: `${usage.profiles}` },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-white/[0.03] px-4 py-3.5">
              <p className="font-mono text-2xl tabular-nums" style={{ color: '#E1E0CC' }}>{s.value}</p>
              <p className="text-[10px] uppercase tracking-[0.16em] text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>

        <footer className="mt-12 border-t border-white/5 py-6 text-center text-[11px] uppercase tracking-[0.2em] text-gray-600">
          Frequency admin · client-side gate (demo)
        </footer>
      </div>
    </div>
  )
}
