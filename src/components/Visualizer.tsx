import { useEffect, useRef } from 'react'

interface VisualizerProps {
  active: boolean
  accent: string
  bars?: number
  className?: string
  /** mirror bars up and down from a centre line */
  mirror?: boolean
}

function hexToRgb(hex: string) {
  const m = hex.replace('#', '')
  const n = parseInt(m.length === 3 ? m.replace(/(.)/g, '$1$1') : m, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

export default function Visualizer({
  active,
  accent,
  bars = 56,
  className = '',
  mirror = false,
}: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const activeRef = useRef(active)
  const accentRef = useRef(accent)
  activeRef.current = active
  accentRef.current = accent

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const amps = new Array(bars).fill(0.04)
    let raf = 0
    let t = 0
    let beat = 0
    let nextBeat = 0

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = Math.max(1, rect.width * dpr)
      canvas.height = Math.max(1, rect.height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const render = () => {
      const rect = canvas.getBoundingClientRect()
      const w = rect.width
      const h = rect.height
      ctx.clearRect(0, 0, w, h)
      t += 0.016

      const on = activeRef.current
      const { r, g, b } = hexToRgb(accentRef.current)

      // periodic "beat" pulse for a musical feel
      beat *= 0.9
      if (on && t > nextBeat) {
        beat = 1
        nextBeat = t + 0.45 + Math.random() * 0.5
      }

      const gap = 2
      const bw = (w - gap * (bars - 1)) / bars

      for (let i = 0; i < bars; i++) {
        const fi = i / bars
        let target: number
        if (on) {
          // layered sines, bass-weighted toward the centre
          const bass = Math.sin(t * 1.6 + i * 0.35) * 0.5 + 0.5
          const mid = Math.sin(t * 3.1 + fi * 9) * 0.5 + 0.5
          const shimmer = Math.sin(t * 6 + i) * 0.5 + 0.5
          const centreBias = 1 - Math.abs(fi - 0.5) * 1.2
          target =
            (bass * 0.55 + mid * 0.3 + shimmer * 0.15) *
            (0.5 + 0.5 * centreBias)
          target = target * 0.8 + beat * 0.35 * centreBias
          target = Math.min(1, Math.max(0.05, target))
        } else {
          target = 0.035 + Math.sin(t * 0.8 + i * 0.5) * 0.01
        }
        // smoothing — faster up, slower down (snappy like real meters)
        const speed = target > amps[i] ? 0.35 : 0.12
        amps[i] += (target - amps[i]) * speed

        const barH = amps[i] * h * (mirror ? 0.5 : 1)
        const x = i * (bw + gap)

        if (mirror) {
          const mid = h / 2
          const grad = ctx.createLinearGradient(0, mid - barH, 0, mid + barH)
          grad.addColorStop(0, `rgba(${r},${g},${b},0.85)`)
          grad.addColorStop(0.5, `rgba(${r},${g},${b},1)`)
          grad.addColorStop(1, `rgba(${r},${g},${b},0.85)`)
          ctx.fillStyle = grad
          roundRect(ctx, x, mid - barH, bw, barH * 2, bw / 2)
          ctx.fill()
        } else {
          const grad = ctx.createLinearGradient(0, h - barH, 0, h)
          grad.addColorStop(0, `rgba(${r},${g},${b},1)`)
          grad.addColorStop(1, `rgba(${r},${g},${b},0.25)`)
          ctx.fillStyle = grad
          roundRect(ctx, x, h - barH, bw, barH, bw / 2)
          ctx.fill()
        }
      }
      raf = requestAnimationFrame(render)
    }
    render()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [bars, mirror])

  return <canvas ref={canvasRef} className={className} />
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}
