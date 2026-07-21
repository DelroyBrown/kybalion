import { useEffect, useRef } from 'react'

import { usePrefersReducedMotion } from '../../hooks/useMediaQuery'

/**
 * A deep-space scene for the threshold of the archive: a twinkling starfield
 * with depth (nearer stars are brighter and drift faster), the occasional
 * shooting star, slow-breathing nebulae in the two books' hues, and a pair
 * of faint orbital rings counter-rotating behind everything.
 *
 * The starfield renders on one canvas that pauses when the tab is hidden.
 * Under reduced motion a single static frame is drawn and the CSS layers
 * stand still (the global reduced-motion rule freezes their keyframes).
 */
export function CosmicBackground({ className = '' }) {
  const canvasRef = useRef(null)
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const context = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    let frame = 0
    let running = true
    let stars = []
    let meteor = null
    let nextMeteorAt = performance.now() + 3000 + Math.random() * 5000

    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr
      canvas.height = canvas.offsetHeight * dpr
      const area = canvas.offsetWidth * canvas.offsetHeight
      const density = Math.round(area / (window.innerWidth < 768 ? 10000 : 6500))
      stars = Array.from({ length: density }, () => {
        const depth = Math.random() // 0 = far, 1 = near
        return {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: (0.3 + depth * 1.0) * dpr,
          baseAlpha: 0.2 + depth * 0.55,
          twinkleSpeed: 0.3 + Math.random() * 1.3,
          phase: Math.random() * Math.PI * 2,
          drift: (0.005 + depth * 0.02) * dpr,
          tint: Math.random(),
        }
      })
    }

    // Most stars are pale starlight; a few lean gold or violet — the two
    // books watching from the same sky.
    const starColor = (tint, alpha) => {
      if (tint < 0.12) return `rgba(211, 184, 120, ${alpha})`
      if (tint > 0.88) return `rgba(184, 180, 223, ${alpha})`
      return `rgba(226, 228, 238, ${alpha})`
    }

    const draw = () => {
      if (!running) return
      const now = performance.now()
      const time = now / 1000
      context.clearRect(0, 0, canvas.width, canvas.height)

      for (const star of stars) {
        if (!reducedMotion) {
          star.x -= star.drift
          if (star.x < -3) star.x = canvas.width + 3
        }
        const twinkle = reducedMotion
          ? 0.8
          : 0.55 + 0.45 * Math.sin(time * star.twinkleSpeed + star.phase)
        context.beginPath()
        context.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
        context.fillStyle = starColor(star.tint, (star.baseAlpha * twinkle).toFixed(3))
        context.fill()
      }

      if (!reducedMotion) {
        if (!meteor && now >= nextMeteorAt) {
          const fromLeft = Math.random() < 0.5
          meteor = {
            x: canvas.width * (fromLeft ? 0.05 + Math.random() * 0.35 : 0.6 + Math.random() * 0.35),
            y: canvas.height * (0.04 + Math.random() * 0.28),
            vx: (fromLeft ? 1 : -1) * (6 + Math.random() * 5) * dpr,
            vy: (2.5 + Math.random() * 2.5) * dpr,
            life: 1,
          }
        }
        if (meteor) {
          meteor.x += meteor.vx
          meteor.y += meteor.vy
          meteor.life -= 0.016
          const tailX = meteor.x - meteor.vx * 9
          const tailY = meteor.y - meteor.vy * 9
          const gradient = context.createLinearGradient(meteor.x, meteor.y, tailX, tailY)
          gradient.addColorStop(0, `rgba(232, 234, 246, ${Math.max(0, 0.7 * meteor.life)})`)
          gradient.addColorStop(1, 'rgba(232, 234, 246, 0)')
          context.strokeStyle = gradient
          context.lineWidth = 1.1 * dpr
          context.beginPath()
          context.moveTo(meteor.x, meteor.y)
          context.lineTo(tailX, tailY)
          context.stroke()
          if (meteor.life <= 0 || meteor.y > canvas.height + 30) {
            meteor = null
            nextMeteorAt = now + 5000 + Math.random() * 9000
          }
        }
        frame = requestAnimationFrame(draw)
      }
    }

    const onVisibility = () => {
      running = !document.hidden
      if (running) frame = requestAnimationFrame(draw)
      else cancelAnimationFrame(frame)
    }

    const onResize = () => {
      resize()
      if (reducedMotion) draw()
    }

    resize()
    draw()
    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [reducedMotion])

  // Tick marks around the outer orbital ring, like a slow astral clock.
  const ticks = Array.from({ length: 24 }, (_, i) => {
    const angle = (i * Math.PI) / 12
    const long = i % 6 === 0
    const r1 = 330
    const r2 = long ? 344 : 338
    return {
      x1: 400 + r1 * Math.cos(angle),
      y1: 400 + r1 * Math.sin(angle),
      x2: 400 + r2 * Math.cos(angle),
      y2: 400 + r2 * Math.sin(angle),
    }
  })

  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
    >
      {/* Breathing nebulae in each book's hue, and a deep field below */}
      <div className="cosmic-nebula cosmic-nebula-gold" />
      <div className="cosmic-nebula cosmic-nebula-violet" />
      <div className="cosmic-nebula cosmic-nebula-deep" />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Counter-rotating orbital rings behind the content */}
      <div className="cosmic-rings" style={{ color: '#9ba0ba' }}>
        <svg viewBox="0 0 800 800" className="w-[150vmin] h-[150vmin] opacity-[0.14]" fill="none">
          <circle cx="400" cy="400" r="330" stroke="currentColor" strokeWidth="0.6" />
          <circle cx="400" cy="400" r="252" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 9" />
          {ticks.map((tick, i) => (
            <line
              key={i}
              x1={tick.x1}
              y1={tick.y1}
              x2={tick.x2}
              y2={tick.y2}
              stroke="currentColor"
              strokeWidth="0.6"
            />
          ))}
          <circle cx="400" cy="70" r="3" fill="currentColor" />
          <circle cx="400" cy="148" r="1.8" fill="currentColor" opacity="0.7" />
        </svg>
      </div>
      <div className="cosmic-rings cosmic-rings-reverse" style={{ color: '#9ba0ba' }}>
        <svg viewBox="0 0 800 800" className="w-[112vmin] h-[112vmin] opacity-[0.1]" fill="none">
          <circle cx="400" cy="400" r="368" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 14" />
          <circle cx="400" cy="32" r="2.2" fill="currentColor" />
        </svg>
      </div>
    </div>
  )
}
