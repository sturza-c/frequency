import { WebSocketServer } from 'ws'
import { createServer } from 'node:http'
import { randomUUID } from 'node:crypto'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const DIST = join(__dirname, '..', 'dist')
const PROD = existsSync(join(DIST, 'index.html'))

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
}

// Railway provides PORT; fall back to WS_PORT for local override, then 8080.
const PORT = Number(process.env.PORT ?? process.env.WS_PORT ?? 8080)
const ROOMS = ['lofi', 'jazz', 'study', 'beats', 'space', 'lush']
const HISTORY_LIMIT = 50

// --- Chat moderation ---------------------------------------------------------
// Mask common profanity (EN + FR). Word-boundary, case-insensitive. This keeps
// the chat clean without dropping the whole message.
const BANNED = [
  'fuck', 'shit', 'bitch', 'asshole', 'cunt', 'dick', 'pussy', 'bastard',
  'nigger', 'nigga', 'faggot', 'retard', 'whore', 'slut',
  'merde', 'putain', 'connard', 'connasse', 'salope', 'enculé', 'encule',
  'pute', 'bite', 'couille', 'pédé', 'pede', 'nique', 'niquer', 'batard', 'bâtard',
]
const BANNED_RE = new RegExp(`\\b(${BANNED.join('|')})\\b`, 'gi')

// Links (http/https, www., or bare domain.tld) and social handles (@user) are
// stripped — keeps the chat on-topic and blocks self-promo / off-platform DMs.
const URL_RE = /\b(?:https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(?:com|net|org|io|co|gg|me|ly|app|xyz|fr|be|ch|uk|de|es|it|tv|link|site|store|info|biz)\b\S*/gi
const HANDLE_RE = /(^|[^a-z0-9_])@[a-z0-9._]{2,}/gi

/** Returns the moderated text (empty string if nothing meaningful remains). */
function sanitizeChat(text) {
  let out = text
    .replace(URL_RE, '[link removed]')
    .replace(HANDLE_RE, '$1[handle removed]')
    .replace(BANNED_RE, (w) => w[0] + '*'.repeat(Math.max(1, w.length - 1)))
  // Collapse a message that is now only removal markers / whitespace.
  const stripped = out.replace(/\[(?:link|handle) removed\]/g, '').trim()
  return stripped ? out.trim() : ''
}

// Per-connection rate limit: max RATE_MAX messages per RATE_WINDOW ms.
const RATE_WINDOW = 10_000
const RATE_MAX = 6

// --- Admin ------------------------------------------------------------------
const START = Date.now()
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'frequency-admin'

/** room -> Map<clientId, { name }> */
const members = new Map(ROOMS.map((r) => [r, new Map()]))
/** room -> recent chat messages */
const history = new Map(ROOMS.map((r) => [r, []]))

// Private rooms are created on demand via invite links. Their ids are
// prefixed `priv_`; we lazily allocate presence/chat maps for them so the
// invite flow gets real presence + chat without a fixed room list.
const MAX_PRIVATE_ROOMS = 500
function resolveRoom(id) {
  if (typeof id === 'string' && ROOMS.includes(id)) return id
  if (
    typeof id === 'string' &&
    id.startsWith('priv_') &&
    id.length <= 40 &&
    /^priv_[a-z0-9]+$/i.test(id)
  ) {
    if (!members.has(id)) {
      if (members.size - ROOMS.length >= MAX_PRIVATE_ROOMS) return 'lofi'
      members.set(id, new Map())
      history.set(id, [])
    }
    return id
  }
  return 'lofi'
}

// --- HTTP server (now-playing proxy) + WebSocket upgrade on the same port ---

let npCache = { at: 0, data: {} }

async function nowPlaying() {
  // SomaFM exposes the current track for every channel in one document.
  if (Date.now() - npCache.at < 10_000) return npCache.data
  try {
    const res = await fetch('https://api.somafm.com/channels.json', {
      headers: { 'User-Agent': 'frequency-study-radio/1.0' },
    })
    const json = await res.json()
    const data = {}
    for (const ch of json.channels ?? []) {
      data[ch.id] = { track: ch.lastPlaying ?? '', listeners: Number(ch.listeners) || 0 }
    }
    npCache = { at: Date.now(), data }
  } catch {
    // keep stale cache on failure
  }
  return npCache.data
}

const httpServer = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.url === '/api/nowplaying') {
    const data = await nowPlaying()
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(data))
    return
  }

  // --- Admin API (token-gated) ---
  if (req.url && req.url.startsWith('/api/admin')) {
    const u = new URL(req.url, 'http://localhost')
    if (u.searchParams.get('token') !== ADMIN_TOKEN) {
      res.statusCode = 401
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'unauthorized' }))
      return
    }

    // Clear a room's chat history.
    if (u.pathname === '/api/admin/clear' && req.method === 'POST') {
      const room = u.searchParams.get('room')
      if (room && history.has(room)) {
        history.set(room, [])
        broadcast(room, { type: 'system', text: 'Chat cleared by a moderator.', ts: Date.now(), id: randomUUID() })
      }
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ ok: true }))
      return
    }

    // Kick a user: disconnect their socket by client id. They can rejoin
    // (kick is not a permanent ban — see the dashboard note).
    if (u.pathname === '/api/admin/kick' && req.method === 'POST') {
      const clientId = u.searchParams.get('client')
      let kicked = false
      for (const client of wss.clients) {
        if (client.id === clientId) {
          const room = client.room
          send(client, { type: 'kicked', text: 'You were removed by a moderator.', ts: Date.now(), id: randomUUID() })
          if (room) broadcast(room, { type: 'system', text: `${client.name} was removed by a moderator`, ts: Date.now(), id: randomUUID() })
          try { client.close(4001, 'kicked') } catch { /* already closing */ }
          kicked = true
          break
        }
      }
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ ok: kicked }))
      return
    }

    // Live stats across every room (public + private).
    if (u.pathname === '/api/admin/stats') {
      const rooms = []
      for (const [id, mem] of members) {
        const msgs = history.get(id) || []
        rooms.push({
          id,
          private: id.startsWith('priv_'),
          count: mem.size,
          members: [...mem.entries()].map(([cid, m]) => ({ id: cid, name: m.name })),
          messages: msgs.length,
          lastTs: msgs.length ? msgs[msgs.length - 1].ts : null,
          recent: msgs.slice(-12).map((m) => ({ name: m.name, text: m.text, ts: m.ts, id: m.id })),
        })
      }
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({
        rooms,
        totalConnections: wss.clients.size,
        privateCount: rooms.filter((r) => r.private).length,
        uptimeSec: Math.floor((Date.now() - START) / 1000),
        now: Date.now(),
      }))
      return
    }

    res.statusCode = 404
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'not found' }))
    return
  }
  // Serve the Vite production build (static files + SPA fallback).
  if (PROD) {
    const urlPath = (req.url ?? '/').split('?')[0]
    let filePath = join(DIST, urlPath)
    try {
      const stat = statSync(filePath)
      if (!stat.isFile()) filePath = join(DIST, 'index.html')
    } catch {
      filePath = join(DIST, 'index.html')
    }
    res.setHeader('Content-Type', MIME[extname(filePath)] ?? 'application/octet-stream')
    createReadStream(filePath).pipe(res)
    return
  }

  res.statusCode = 404
  res.end('not found')
})

const wss = new WebSocketServer({ server: httpServer })

function counts() {
  return Object.fromEntries(ROOMS.map((r) => [r, members.get(r).size]))
}

function names(room) {
  return [...members.get(room).values()].map((m) => m.name)
}

function send(ws, data) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(data))
}

function broadcast(room, data) {
  const payload = JSON.stringify(data)
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN && client.room === room) {
      client.send(payload)
    }
  }
}

// Send room listener counts to every connected client (lobby + rooms).
function broadcastCounts() {
  const payload = JSON.stringify({ type: 'counts', counts: counts() })
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) client.send(payload)
  }
}

function leave(ws) {
  if (!ws.room || !members.has(ws.room)) return
  const room = ws.room
  members.get(room).delete(ws.id)
  ws.room = null
  broadcast(room, { type: 'presence', users: names(room), count: members.get(room).size })
  broadcast(room, { type: 'system', text: `${ws.name} left the room`, ts: Date.now(), id: randomUUID() })
  broadcastCounts()
}

wss.on('connection', (ws) => {
  ws.id = randomUUID()
  ws.room = null
  ws.name = 'anon'
  ws.msgTimes = []

  send(ws, { type: 'welcome', counts: counts() })

  ws.on('message', (raw) => {
    let msg
    try {
      msg = JSON.parse(raw.toString())
    } catch {
      return
    }

    if (msg.type === 'join') {
      const room = resolveRoom(msg.room)
      const name = String(msg.name || 'anon').trim().slice(0, 24) || 'anon'
      if (ws.room) leave(ws)
      ws.room = room
      ws.name = name
      members.get(room).set(ws.id, { name })
      send(ws, { type: 'history', messages: history.get(room) })
      broadcast(room, { type: 'presence', users: names(room), count: members.get(room).size })
      broadcast(room, { type: 'system', text: `${name} tuned in`, ts: Date.now(), id: randomUUID() })
      broadcastCounts()
    } else if (msg.type === 'leave') {
      leave(ws)
    } else if (msg.type === 'chat' && ws.room) {
      const raw = String(msg.text || '').trim().slice(0, 500)
      if (!raw) return

      // Rate limit: drop + privately warn if firing too fast.
      const now = Date.now()
      ws.msgTimes = ws.msgTimes.filter((t) => now - t < RATE_WINDOW)
      if (ws.msgTimes.length >= RATE_MAX) {
        send(ws, { type: 'system', text: 'Slow down a moment — too many messages.', ts: now, id: randomUUID() })
        return
      }
      ws.msgTimes.push(now)

      const text = sanitizeChat(raw)
      if (!text) {
        send(ws, { type: 'system', text: 'Links and @handles aren’t allowed here.', ts: now, id: randomUUID() })
        return
      }
      const m = { type: 'chat', name: ws.name, text, ts: now, id: randomUUID() }
      const arr = history.get(ws.room)
      arr.push(m)
      if (arr.length > HISTORY_LIMIT) arr.shift()
      broadcast(ws.room, m)
    }
  })

  ws.on('close', () => leave(ws))
  ws.on('error', () => leave(ws))
})

httpServer.listen(PORT, () => {
  console.log(`[frequency] server listening on http://localhost:${PORT} (ws + /api/nowplaying)`)
})
