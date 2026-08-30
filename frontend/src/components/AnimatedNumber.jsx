import { useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from '../lib/hooks'

const formatUsd = (n) => `$${Math.round(n).toLocaleString('en-US')}`

export default function AnimatedNumber({ value, duration = 900, format = formatUsd, className }) {
  const reducedMotion = usePrefersReducedMotion()
  const [display, setDisplay] = useState(reducedMotion ? value : 0)
  const fromRef = useRef(0)

  useEffect(() => {
    if (reducedMotion) {
      setDisplay(value)
      fromRef.current = value
      return
    }

    const from = fromRef.current
    const delta = value - from
    const start = performance.now()
    let raf

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3) // ease-out cubic
      setDisplay(from + delta * eased)
      if (t < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        fromRef.current = value
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reducedMotion])

  return <span className={className}>{format(display)}</span>
}
