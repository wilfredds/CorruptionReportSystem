import { animate } from 'framer-motion'
import { useEffect, useLayoutEffect, useRef } from 'react'

import { useReducedMotion } from '@/hooks/useReducedMotion'
import { DURATION, EASE } from '@/lib/motion'

/**
 * A number that counts up to itself when it first appears.
 *
 * Worth doing on a dashboard for one reason: it draws the eye to the figures
 * that changed since last time, which is the only reason anybody opens this
 * screen. It is not worth doing anywhere the number is being read *while* it
 * changes — never put this on the drill runner.
 *
 * The final value is what React renders, so the accessibility tree and any
 * frame before the animation starts are already correct; the count-up is
 * written straight into the DOM node from a layout effect, which also means
 * the whole thing costs zero React re-renders.
 */
export function CountUp({
  value,
  format = (n: number) => String(Math.round(n)),
  duration = DURATION.slow,
  className,
}: {
  value: number
  /** Turns the in-between values into text. Rounds by default. */
  format?: (value: number) => string
  duration?: number
  className?: string
}) {
  const reduced = useReducedMotion()
  const node = useRef<HTMLSpanElement>(null)
  const formatter = useRef(format)

  // Kept fresh without making the animation restart every render — callers
  // pass inline arrow functions and a new identity each time would retrigger.
  useEffect(() => {
    formatter.current = format
  })

  useLayoutEffect(() => {
    const element = node.current
    if (!element) return
    if (reduced) {
      element.textContent = formatter.current(value)
      return
    }
    const controls = animate(0, value, {
      duration,
      ease: [...EASE.out] as [number, number, number, number],
      onUpdate: (current) => {
        element.textContent = formatter.current(current)
      },
    })
    return () => controls.stop()
  }, [value, duration, reduced])

  return (
    <span ref={node} className={className}>
      {format(value)}
    </span>
  )
}
