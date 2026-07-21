import { useEffect, useRef } from 'react'

import { usePrefersReducedMotion } from '../../hooks/useMediaQuery'
import { useAppStore } from '../../stores/appStore'
import { useReaderStore } from '../../stores/readerStore'

/**
 * The atmosphere layer: a quiet night sky — faint twinkling stars under
 * slow-drifting dust motes over dim pools of light, rendered on one fixed
 * canvas behind everything. It pauses when the tab is hidden, thins out on
 * small screens, and is disabled entirely for users who prefer reduced
 * motion or turn ambient effects off. Stars only appear in dark mode.
 */
export function AmbientBackground() {
  const canvasRef = useRef(null)
  const reducedMotion = usePrefersReducedMotion()
  const ambientEffects = useReaderStore((state) => state.settings.ambientEffects)
  const userReduceMotion = useReaderStore((state) => state.settings.reduceMotion)
  const activeBookSlug = useAppStore((state) => state.activeBookSlug)
  const colorMode = useAppStore((state) => state.colorMode)
  const enabled = ambientEffects && !reducedMotion && !userReduceMotion

  useEffect(() => {
    if (!enabled) return undefined
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    // Dust takes the book's accent tint (a palette variable on <html>).
    const accent =
      getComputedStyle(document.documentElement).getPropertyValue('--gold-300').trim() ||
      '211 184 120'
    let frame = 0
    let running = true
    let particles = []
    let stars = []
    const showStars = colorMode === 'dark'

    const resize = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio
      canvas.height = window.innerHeight * window.devicePixelRatio
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      const density = window.innerWidth < 768 ? 26 : 60
      particles = Array.from({ length: density }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: (0.4 + Math.random() * 1.1) * window.devicePixelRatio,
        speedY: (0.02 + Math.random() * 0.08) * window.devicePixelRatio,
        driftX: (Math.random() - 0.5) * 0.05 * window.devicePixelRatio,
        alpha: 0.04 + Math.random() * 0.1,
        phase: Math.random() * Math.PI * 2,
      }))
      const starCount = showStars ? (window.innerWidth < 768 ? 40 : 90) : 0
      stars = Array.from({ length: starCount }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: (0.3 + Math.random() * 0.8) * window.devicePixelRatio,
        alpha: 0.05 + Math.random() * 0.16,
        twinkleSpeed: 0.25 + Math.random() * 1.0,
        phase: Math.random() * Math.PI * 2,
      }))
    }

    const draw = () => {
      if (!running) return
      context.clearRect(0, 0, canvas.width, canvas.height)
      const time = performance.now() / 1000
      for (const star of stars) {
        const twinkle = 0.5 + 0.5 * Math.sin(time * star.twinkleSpeed + star.phase)
        context.beginPath()
        context.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
        context.fillStyle = `rgba(226, 228, 238, ${(star.alpha * twinkle).toFixed(3)})`
        context.fill()
      }
      for (const particle of particles) {
        particle.y -= particle.speedY
        particle.x += particle.driftX + Math.sin(time * 0.3 + particle.phase) * 0.04
        if (particle.y < -4) {
          particle.y = canvas.height + 4
          particle.x = Math.random() * canvas.width
        }
        context.beginPath()
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
        context.fillStyle = `rgba(${accent.split(' ').join(', ')}, ${particle.alpha})`
        context.fill()
      }
      frame = requestAnimationFrame(draw)
    }

    const onVisibility = () => {
      running = !document.hidden
      if (running) frame = requestAnimationFrame(draw)
      else cancelAnimationFrame(frame)
    }

    resize()
    frame = requestAnimationFrame(draw)
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [enabled, activeBookSlug, colorMode])

  return (
    <div aria-hidden="true" className="fixed inset-0 -z-10 overflow-hidden">
      {/* Dim pools of light */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 55% 45% at 30% 12%, rgb(var(--gold-400) / 0.05), transparent 70%),' +
            'radial-gradient(ellipse 45% 40% at 78% 80%, rgba(106,90,118,0.05), transparent 70%),' +
            'radial-gradient(ellipse 70% 55% at 50% 50%, rgb(var(--ink-850) / 0.4), transparent 100%)',
        }}
      />
      {enabled && <canvas ref={canvasRef} className="absolute inset-0" />}
    </div>
  )
}
