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
  // Group chars into words so flex-wrap never breaks a word in the middle.
  // Each word is an inline-flex wrapper; spaces are separate flex items.
  const words = text.split(' ')
  let charIndex = 0
  return (
    <p ref={ref} className={`relative flex flex-wrap ${className}`}>
      {words.map((word, wi) => {
        const wordChars = word.split('')
        const wordStart = charIndex
        charIndex += wordChars.length + (wi < words.length - 1 ? 1 : 0) // +1 for the space
        return (
          <span key={wi} className="inline-flex whitespace-nowrap">
            {wordChars.map((char, ci) => {
              const idx = wordStart + ci
              const start = idx / chars.length
              const end = start + 1 / chars.length
              return (
                <Char key={ci} progress={scrollYProgress} range={[start, end]}>
                  {char}
                </Char>
              )
            })}
            {/* space after each word except the last */}
            {wi < words.length - 1 && (
              <Char
                progress={scrollYProgress}
                range={[
                  (wordStart + wordChars.length) / chars.length,
                  (wordStart + wordChars.length + 1) / chars.length,
                ]}
              >
                {' '}
              </Char>
            )}
          </span>
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
