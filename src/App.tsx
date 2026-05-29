import { useEffect, useState } from 'react'
import { useRadio } from './hooks/useRadio'
import { useStudyTimer } from './hooks/useStudyTimer'
import { useCountdown } from './hooks/useCountdown'
import { useNowPlaying } from './hooks/useNowPlaying'
import { useAccount } from './hooks/useAccount'
import { useStudySessions } from './hooks/useStudySessions'
import { ROOM_BY_ID, type RoomId } from './lib/rooms'
import type { SceneId } from './lib/themes'
import Lobby from './components/Lobby'
import Room from './components/Room'
import Profile from './components/Profile'

interface Theme {
  accent: string
  scene: SceneId
}

function loadTheme(roomId: RoomId): Theme {
  const fallback: Theme = { accent: ROOM_BY_ID[roomId].accent, scene: 'glow' }
  try {
    const raw = localStorage.getItem(`frequency.theme.${roomId}`)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return {
      accent: typeof parsed.accent === 'string' ? parsed.accent : fallback.accent,
      scene: ['minimal', 'glow', 'aurora'].includes(parsed.scene) ? parsed.scene : fallback.scene,
    }
  } catch {
    return fallback
  }
}

export default function App() {
  const { connected, counts, messages, users, join, leave, sendChat } = useRadio()
  const { account, signIn, signOut } = useAccount()
  const { sessions, addSession, stats } = useStudySessions(account?.name ?? null)

  const [activeRoom, setActiveRoom] = useState<RoomId | null>(null)
  const [me, setMe] = useState(account?.name ?? '')
  const [theme, setTheme] = useState<Theme>({ accent: ROOM_BY_ID.lofi.accent, scene: 'glow' })
  const [showProfile, setShowProfile] = useState(false)

  const timer = useStudyTimer(activeRoom !== null)
  const countdown = useCountdown((totalSec) => {
    if (!activeRoom) return
    const r = ROOM_BY_ID[activeRoom]
    addSession({ durationSec: totalSec, roomId: r.id, station: r.station, mode: 'countdown' })
  })

  const feed = useNowPlaying(activeRoom !== null)
  const track = activeRoom ? feed[ROOM_BY_ID[activeRoom].somaId]?.track ?? '' : ''

  useEffect(() => {
    if (activeRoom) setTheme(loadTheme(activeRoom))
  }, [activeRoom])

  const updateTheme = (mut: (prev: Theme) => Theme) => {
    setTheme((prev) => {
      const next = mut(prev)
      if (activeRoom) localStorage.setItem(`frequency.theme.${activeRoom}`, JSON.stringify(next))
      return next
    })
  }

  const handleJoin = (room: RoomId, name: string) => {
    signIn(name)
    setMe(name)
    setActiveRoom(room)
    join(room, name)
  }

  const handleSwitch = (room: RoomId) => {
    if (room === activeRoom) return
    setActiveRoom(room)
    join(room, me)
  }

  const logStopwatch = () => {
    if (activeRoom && timer.seconds >= 60) {
      const r = ROOM_BY_ID[activeRoom]
      addSession({ durationSec: timer.seconds, roomId: r.id, station: r.station, mode: 'stopwatch' })
    }
    timer.reset()
  }

  const handleLeave = () => {
    logStopwatch()
    leave()
    setActiveRoom(null)
  }

  const handleSignOut = () => {
    handleLeave()
    signOut()
    setMe('')
    setShowProfile(false)
  }

  return (
    <main className="bg-black">
      {activeRoom ? (
        <Room
          room={ROOM_BY_ID[activeRoom]}
          me={me}
          messages={messages}
          users={users}
          counts={counts}
          accent={theme.accent}
          scene={theme.scene}
          timer={timer}
          countdown={countdown}
          track={track}
          onSend={sendChat}
          onLeave={handleLeave}
          onSwitch={handleSwitch}
          onAccent={(accent) => updateTheme((prev) => ({ ...prev, accent }))}
          onScene={(scene) => updateTheme((prev) => ({ ...prev, scene }))}
          onOpenProfile={() => setShowProfile(true)}
        />
      ) : (
        <Lobby
          counts={counts}
          connected={connected}
          account={account}
          stats={stats}
          onJoin={handleJoin}
          onOpenProfile={() => setShowProfile(true)}
        />
      )}

      {showProfile && account && (
        <Profile
          name={account.name}
          stats={stats}
          sessions={sessions}
          accent={theme.accent}
          onClose={() => setShowProfile(false)}
          onSignOut={handleSignOut}
        />
      )}
    </main>
  )
}
