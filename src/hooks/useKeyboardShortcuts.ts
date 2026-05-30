import { useEffect } from 'react'

interface Shortcuts {
  onTogglePlay: () => void
  onMute: () => void
  onVolumeUp: () => void
  onVolumeDown: () => void
  onLeave: () => void
}

const SKIP_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

/** Global keyboard shortcuts for the room view. Skips when focus is on a text input. */
export function useKeyboardShortcuts({
  onTogglePlay,
  onMute,
  onVolumeUp,
  onVolumeDown,
  onLeave,
}: Shortcuts) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName ?? ''
      if (SKIP_TAGS.has(tag)) return

      switch (e.key) {
        case ' ':
          e.preventDefault()
          onTogglePlay()
          break
        case 'm':
        case 'M':
          onMute()
          break
        case 'ArrowUp':
          e.preventDefault()
          onVolumeUp()
          break
        case 'ArrowDown':
          e.preventDefault()
          onVolumeDown()
          break
        case 'Escape':
          onLeave()
          break
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onTogglePlay, onMute, onVolumeUp, onVolumeDown, onLeave])
}
