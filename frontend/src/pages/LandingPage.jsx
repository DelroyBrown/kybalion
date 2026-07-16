import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { Sigil } from '../components/common/Sigil'
import { Button } from '../components/common/Button'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { usePrefersReducedMotion } from '../hooks/useMediaQuery'
import { useLocalProgressStore } from '../stores/localProgressStore'
import { useAuthStore } from '../stores/authStore'
import { useReaderStore } from '../stores/readerStore'
import { EASE } from '../utils/motion'

const INTRO_KEY = 'kybalion-intro-seen'

/**
 * The threshold of the archive. On a first visit the seal draws itself and
 * the title emerges from darkness; on return visits (or with reduced motion)
 * the sequence is compressed to a quick fade and can be skipped entirely.
 */
export function LandingPage() {
  useDocumentTitle(null)
  const reducedMotion = usePrefersReducedMotion()
  const userReducedMotion = useReaderStore((state) => state.settings.reduceMotion)
  const [seen] = useState(() => localStorage.getItem(INTRO_KEY) === 'true')
  const [skipped, setSkipped] = useState(false)
  const quick = seen || reducedMotion || skipped
  // The seal keeps a quiet pulse even on return visits — unless motion is reduced.
  const ambient = !reducedMotion && !userReducedMotion

  const localProgress = useLocalProgressStore((state) => state.byChapter)
  const user = useAuthStore((state) => state.user)
  const continueChapter = useMemo(() => {
    const entries = Object.entries(localProgress)
    if (entries.length === 0) return null
    return entries.sort((a, b) => (b[1].percent || 0) - (a[1].percent || 0))[0][0]
  }, [localProgress])

  useEffect(() => {
    const timer = setTimeout(() => localStorage.setItem(INTRO_KEY, 'true'), quick ? 0 : 4000)
    return () => clearTimeout(timer)
  }, [quick])

  const at = (slow) => (quick ? Math.min(slow * 0.15, 0.3) : slow)

  return (
    <div className="relative min-h-dvh grain bg-ink-950 flex flex-col overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 38%, rgba(191,160,93,0.06), transparent 70%)',
        }}
      />

      {!quick && (
        <button
          type="button"
          onClick={() => setSkipped(true)}
          className="absolute top-5 right-5 z-10 font-sans text-xs tracking-caps uppercase text-parchment-500 hover:text-parchment-200 px-3 py-2"
        >
          Skip introduction
        </button>
      )}

      <div className="relative flex-1 flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: quick ? 0.4 : 1.2, ease: EASE }}
          className="relative text-gold-400"
        >
          {ambient && (
            <>
              <motion.div
                aria-hidden="true"
                className="absolute -inset-14 rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(191,160,93,0.12), transparent 65%)' }}
                animate={{ opacity: [0.35, 0.75, 0.35], scale: [1, 1.05, 1] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: quick ? 0.5 : 3 }}
              />
              <motion.div
                aria-hidden="true"
                className="absolute -inset-7 rounded-full border border-dashed border-gold-600/25"
                animate={{ rotate: 360 }}
                transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
              />
            </>
          )}
          <Sigil size={132} animated={!quick} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: at(2.2), duration: 0.9, ease: EASE }}
          className="mt-10 font-display font-light text-4xl sm:text-5xl md:text-6xl tracking-[0.28em] text-parchment-100 uppercase"
        >
          The Kybalion
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: at(3.0), duration: 0.9, ease: EASE }}
          className="mt-5 max-w-md font-serif italic text-parchment-400 text-lg leading-relaxed"
        >
          “The lips of wisdom are closed, except to the ears of Understanding.”
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: at(3.4), duration: 0.8, ease: EASE }}
          className="mt-3 caps-label text-parchment-500"
        >
          An interactive study edition · Seven principles · 1908
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: at(3.8), duration: 0.7, ease: EASE }}
          className="mt-12 flex flex-col sm:flex-row items-center gap-4"
        >
          <Link to={continueChapter ? `/read/${continueChapter}` : '/read'}>
            <Button>{continueChapter || user ? 'Continue Reading' : 'Enter the Text'}</Button>
          </Link>
          <Link to="/principles">
            <Button variant="outline">Explore the Seven Principles</Button>
          </Link>
        </motion.div>
      </div>

      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: at(4.2), duration: 0.8 }}
        className="relative px-6 py-6 text-center"
      >
        <p className="font-sans text-xs text-parchment-500 leading-relaxed max-w-xl mx-auto">
          Original text: <span className="italic">The Kybalion</span>, Three Initiates, Yogi
          Publication Society, 1908 — public domain. Commentary, definitions, and visualisations
          are modern editorial additions, always shown as such.{' '}
          <Link to="/about" className="underline decoration-dotted hover:text-parchment-300">
            About this edition
          </Link>
        </p>
      </motion.footer>
    </div>
  )
}
