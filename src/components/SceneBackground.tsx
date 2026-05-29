import type { SceneId } from '../lib/themes'
import { HERO_VIDEO } from '../lib/media'

interface SceneBackgroundProps {
  scene: SceneId
  accent: string
}

/** Ambient backdrop for a room. Three intensities driven by the user's scene choice. */
export default function SceneBackground({ scene, accent }: SceneBackgroundProps) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Cinematic looping video, dimmed far back so the player/chat stay legible */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover opacity-[0.22]"
      >
        <source src={HERO_VIDEO} type="video/mp4" />
      </video>
      {/* Dark scrim + accent tint over the video */}
      <div className="absolute inset-0 bg-black/55" />
      <div className="absolute inset-0 mix-blend-soft-light" style={{ backgroundColor: accent, opacity: 0.1 }} />

      <div className="bg-noise absolute inset-0 opacity-[0.10]" />

      {scene === 'glow' && (
        <div
          className="absolute left-1/2 top-1/3 h-[60vh] w-[60vh] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
          style={{ backgroundColor: accent, opacity: 0.16 }}
        />
      )}

      {scene === 'aurora' && (
        <>
          <div
            className="aurora-a absolute -left-1/4 top-0 h-[70vh] w-[70vh] rounded-full blur-[130px]"
            style={{ backgroundColor: accent, opacity: 0.18 }}
          />
          <div
            className="aurora-b absolute -right-1/4 bottom-0 h-[60vh] w-[60vh] rounded-full blur-[130px]"
            style={{ backgroundColor: accent, opacity: 0.12 }}
          />
        </>
      )}
    </div>
  )
}
