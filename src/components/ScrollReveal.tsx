import { useRef } from 'react'
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion'

interface ScrollRevealProps {
  text: string
  className?: string
}

/** Brightens text character-by-character as it scrolls through the viewport. */
export default function ScrollReveal({ text, className = '' }: ScrollRevealProps) {
  const ref = useRef<HTMLParagraphElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.85', 'start 0.3'],
  })

  const chars = text.split('')
  return (
    <p ref={ref} className={`relative flex flex-wrap ${className}`}>
      {chars.map((char, i) => {
        const start = i / chars.length
        const end = start + 1 / chars.length
        return (
          <Char key={i} progress={scrollYProgress} range={[start, end]}>
            {char}
          </Char>
        )
      })}
    </p>
  )
}

function Char({
  children,
  progress,
  range,
}: {
  children: string
  progress: MotionValue<number>
  range: [number, number]
}) {
  const opacity = useTransform(progress, range, [0.15, 1])
  return (
    <motion.span style={{ opacity }} className="whitespace-pre">
      {children}
    </motion.span>
  )
}
