import { useState } from 'react'
import { Hourglass, Pause, Play, RotateCcw, Timer } from 'lucide-react'
import { formatDuration, type StudyTimer } from '../hooks/useStudyTimer'
import type { Countdown } from '../hooks/useCountdown'

interface FocusTimerProps {
  timer: StudyTimer
  countdown: Countdown
  accent: string
}

const PRESETS = [15, 25, 50]

export default function FocusTimer({ timer, countdown, accent }: FocusTimerProps) {
  const [mode, setMode] = useState<'stopwatch' | 'countdown'>('stopwatch')
  const pct = countdown.total > 0 ? 1 - countdown.remaining / countdown.total : 0
  const done = countdown.remaining === 0

  return (
    <div className="rounded-2xl bg-white/[0.03] px-4 py-3">
      {/* Mode toggle */}
      <div className="mb-3 flex items-center gap-1 text-[10px] uppercase tracking-[0.14em]">
        {(['stopwatch', 'countdown'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className="flex items-center gap-1 rounded-full px-2.5 py-1 transition-colors"
            style={{
              color: mode === m ? '#101010' : 'rgba(225,224,204,0.55)',
              backgroundColor: mode === m ? accent : 'transparent',
            }}
          >
            {m === 'stopwatch' ? <Timer className="h-3 w-3" /> : <Hourglass className="h-3 w-3" />}
            {m}
          </button>
        ))}
      </div>

      {mode === 'stopwatch' ? (
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span
                className="font-mono text-2xl tabular-nums tracking-tight"
                style={{ color: '#E1E0CC' }}
              >
                {formatDuration(timer.seconds)}
              </span>
              {!timer.running && (
                <span className="text-[10px] uppercase tracking-widest text-gray-500">paused</span>
              )}
            </div>
            <span className="text-[10px] uppercase tracking-[0.18em] text-gray-500">
              In rooms today · {formatDuration(timer.todayTotal)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={timer.toggle}
              aria-label={timer.running ? 'Pause timer' : 'Resume timer'}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-gray-300 transition-colors hover:bg-white/10"
            >
              {timer.running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={timer.reset}
              aria-label="Reset timer"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-gray-300 transition-colors hover:bg-white/10"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between">
            <div>
              <span
                className="font-mono text-2xl tabular-nums tracking-tight"
                style={{ color: done ? accent : '#E1E0CC' }}
              >
                {formatDuration(countdown.remaining)}
              </span>
              <span className="ml-2 text-[10px] uppercase tracking-[0.18em] text-gray-500">
                {done ? 'session complete' : `${Math.round(countdown.total / 60)} min focus`}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={countdown.running ? countdown.pause : countdown.start}
                aria-label={countdown.running ? 'Pause countdown' : 'Start countdown'}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-gray-300 transition-colors hover:bg-white/10"
              >
                {countdown.running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={countdown.reset}
                aria-label="Reset countdown"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-gray-300 transition-colors hover:bg-white/10"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* progress */}
          <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full transition-[width] duration-500 ease-linear"
              style={{ width: `${pct * 100}%`, backgroundColor: accent }}
            />
          </div>

          {/* presets */}
          <div className="mt-3 flex items-center gap-1.5">
            {PRESETS.map((m) => {
              const selected = Math.round(countdown.total / 60) === m && !countdown.running
              return (
                <button
                  key={m}
                  onClick={() => countdown.setMinutes(m)}
                  className="rounded-full border px-2.5 py-1 text-[11px] transition-colors"
                  style={{
                    borderColor: selected ? accent : 'rgba(255,255,255,0.08)',
                    color: selected ? accent : 'rgba(225,224,204,0.7)',
                  }}
                >
                  {m}m
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
