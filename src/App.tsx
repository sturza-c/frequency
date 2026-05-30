import { useEffect, useState } from 'react'
import { useRadio } from './hooks/useRadio'
import { useStudyTimer } from './hooks/useStudyTimer'
import { useCountdown } from './hooks/useCountdown'
import { useNowPlaying } from './hooks/useNowPlaying'
import { useAccount } from './hooks/useAccount'
import { useStudySessions } from './hooks/useStudySessions'
import { useSubscription } from './hooks/useSubscription'
import { usePrivateRooms } from './hooks/usePrivateRooms'
import { ROOM_BY_ID, type Room as RoomT, type RoomId } from './lib/rooms'
import { readInvite, clearInviteParam } from './lib/privateRoom'
import type { SceneId } from './lib/themes'
import Lobby from './components/Lobby'
import Room from './components/Room'
import Profile from './components/Profile'
import UpgradeModal from './components/UpgradeModal'
import CreateRoomModal from './components/CreateRoomModal'

interface Theme {
  accent: string
  scene: SceneId
}

function loadTheme(room: RoomT): Theme {
  const fallback: Theme = { accent: room.accent, scene: 'glow' }
  try {
    const raw = localStorage.getItem(`frequency.theme.${room.id}`)
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
  const privateRooms = usePrivateRooms()

  const [active, setActive] = useState<RoomT | null>(null)
  const [view, setView] = useState<'lobby' | 'room'>('lobby')
  const [me, setMe] = useState(account?.name ?? '')
  const [theme, setTheme] = useState<Theme>({ accent: ROOM_BY_ID.lofi.accent, scene: 'glow' })
  const [showProfile, setShowProfile] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [invite, setInvite] = useState<RoomT | null>(null)

  // Resolve an invite link on first load.
  useEffect(() => {
    const found = readInvite()
    if (found) {
      privateRooms.add(found.config)
      setInvite(found.room)
      clearInviteParam()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const timer = useStudyTimer(active !== null)
  const countdown = useCountdown((totalSec) => {
    if (!active) return
    addSession({ durationSec: totalSec, roomId: active.id, station: active.station, mode: 'countdown' })
  })

  const feed = useNowPlaying(active !== null)
  const track = active ? feed[active.somaId]?.track ?? '' : ''

  useEffect(() => {
    if (active) setTheme(loadTheme(active))
  }, [active])

  const updateTheme = (mut: (prev: Theme) => Theme) => {
    setTheme((prev) => {
      const next = mut(prev)
      if (active) localStorage.setItem(`frequency.theme.${active.id}`, JSON.stringify(next))
      return next
    })
  }

  const enterRoom = (room: RoomT, name: string) => {
    signIn(name)
    setMe(name)
    setActive(room)
    setView('room')
    join(room.id, name)
  }

  const handleJoin = (roomId: RoomId, name: string) => enterRoom(ROOM_BY_ID[roomId], name)
  const handleJoinRoom = (room: RoomT, name: string) => enterRoom(room, name)

  const handleSwitch = (roomId: RoomId) => {
    if (active && roomId === active.id) return
    const room = ROOM_BY_ID[roomId]
    setActive(room)
    setView('room')
    join(room.id, me)
  }

  const logStopwatch = () => {
    if (active && timer.seconds >= 60) {
      addSession({ durationSec: timer.seconds, roomId: active.id, station: active.station, mode: 'stopwatch' })
    }
    timer.reset()
  }

  // Go back to lobby but keep audio playing.
  const handleGoToLobby = () => setView('lobby')

  // Truly stop: log session, disconnect, kill audio.
  const handleStopMusic = () => {
    logStopwatch()
    leave()
    setActive(null)
    setView('lobby')
  }

  const handleSignOut = () => {
    handleStopMusic()
    signOut()
    setMe('')
    setShowProfile(false)
  }

  const handleCreateClick = () => {
    if (!isPremium) setShowUpgrade(true)
    else setShowCreate(true)
  }

  return (
    <main className="bg-black">
      {/* Room stays mounted while a room is active so audio never stops */}
      {active && (
        <div className={view === 'room' ? undefined : 'hidden'}>
          <Room
            room={active}
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
          privateRooms={privateRooms.rooms}
          invite={invite}
          playingRoom={active}
          nowPlayingTrack={track}
          onJoin={handleJoin}
          onJoinRoom={handleJoinRoom}
          onCreateRoom={handleCreateClick}
          onDismissInvite={() => setInvite(null)}
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

      <CreateRoomModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={privateRooms.add}
        onEnter={(room) => handleJoinRoom(room, (account?.name ?? me ?? '').trim() || 'anon')}
      />
    </main>
  )
}
