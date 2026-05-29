import { useEffect, useState } from 'react'
import { useRadio } from './hooks/useRadio'
import { useStudyTimer } from './hooks/useStudyTimer'
import { useCountdown } from './hooks/useCountdown'
import { useNowPlaying } from './hooks/useNowPlaying'
import { useAccount } from './hooks/useAccount'
import { useStudySessions } from './hooks/useStudySessions'
import { useSubscription } from './hooks/useSubscription'
import { ROOM_BY_ID, type RoomId } from './lib/rooms'
import type { SceneId } from './lib/themes'
import Lobby from './components/Lobby'
import Room from './components/Room'
import Profile from './components/Profile'
import UpgradeModal from './components/UpgradeModal'

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
  const { isPremium, upgrade } = useSubscription()

  const [activeRoom, setActiveRoom] = useState<RoomId | null>(null)
  const [view, setView] = useState<'lobby' | 'room'>('lobby')
  const [me, setMe] = useState(account?.name ?? '')
  const [theme, setTheme] = useState<Theme>({ accent: ROOM_BY_ID.lofi.accent, scene: 'glow' })
  const [showProfile, setShowProfile] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)

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
    setView('room')
    join(room, name)
  }

  const handleSwitch = (room: RoomId) => {
    if (room === activeRoom) return
    setActiveRoom(room)
    setView('room')
    join(room, me)
  }

  const logStopwatch = () => {
    if (activeRoom && timer.seconds >= 60) {
      const r = ROOM_BY_ID[activeRoom]
      addSession({ durationSec: timer.seconds, roomId: r.id, station: r.station, mode: 'stopwatch' })
    }
    timer.reset()
  }

  // Go back to lobby but keep audio playing.
  const handleGoToLobby = () => setView('lobby')

  // Truly stop: log session, disconnect, kill audio.
  const handleStopMusic = () => {
    logStopwatch()
    leave()
    setActiveRoom(null)
    setView('lobby')
  }

  const handleSignOut = () => {
    handleStopMusic()
    signOut()
    setMe('')
    setShowProfile(false)
  }

  return (
    <main className="bg-black">
      {/* Room stays mounted while activeRoom is set so audio never stops */}
      {activeRoom && (
        <div className={view === 'room' ? undefined : 'hidden'}>
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
            isPremium={isPremium}
            onSend={sendChat}
            onLeave={handleGoToLobby}
            onSwitch={handleSwitch}
            onAccent={(accent) => updateTheme((prev) => ({ ...prev, accent }))}
            onScene={(scene) => updateTheme((prev) => ({ ...prev, scene }))}
            onOpenProfile={() => setShowProfile(true)}
            onUpgrade={() => setShowUpgrade(true)}
          />
        </div>
      )}

      {view === 'lobby' && (
        <Lobby
          counts={counts}
          connected={connected}
          account={account}
          stats={stats}
          isPremium={isPremium}
          playingRoom={activeRoom ? ROOM_BY_ID[activeRoom] : null}
          nowPlayingTrack={track}
          onJoin={handleJoin}
          onStopMusic={handleStopMusic}
          onOpenProfile={() => setShowProfile(true)}
          onUpgrade={() => setShowUpgrade(true)}
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

      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        onUpgrade={upgrade}
        accent={theme.accent}
      />
    </main>
  )
}
