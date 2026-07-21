import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

import { BookEmblem } from '../components/common/BookEmblem'
import { CosmicBackground } from '../components/common/CosmicBackground'
import { PerennialMark } from '../components/common/PerennialMark'
import { usePrefersReducedMotion } from '../hooks/useMediaQuery'
import { BOOKS, BOOK_ORDER, useAppStore } from '../stores/appStore'
import { useLocalProgressStore } from '../stores/localProgressStore'
import { EASE } from '../utils/motion'

/**
 * The threshold of The Perennial: the library's own seal above its name,
 * a few words on what this place is, and the shelf itself — every book
 * presented as a cover in its own colours, with room left for the next.
 * The scene drifts with the pointer; covers tilt under it like held cards.
 */

// Fixed cover palettes: the covers keep their identity regardless of which
// book (and colour mode) the rest of the interface is currently wearing.
const COVERS = {
  'the-kybalion': {
    ground: 'rgba(15, 13, 10, 0.8)',
    edge: 'rgba(191, 160, 93, 0.28)',
    edgeHover: 'rgba(191, 160, 93, 0.55)',
    accent: '#d3b878',
    accentDim: '#a3874a',
    text: '#ece2ce',
    muted: '#9a917d',
    glow: 'rgba(191, 160, 93, 0.09)',
    halo: 'rgba(191, 160, 93, 0.2)',
    quote: '“The lips of wisdom are closed, except to the ears of Understanding.”',
    meta: 'Fifteen chapters · Seven principles · 1908',
    body:
      'The Hermetic philosophy of ancient Egypt and Greece — the 1908 text with layered commentary, an interactive knowledge map, and a study companion for each principle.',
  },
  'ethiopian-bible': {
    ground: 'rgba(9, 11, 21, 0.78)',
    edge: 'rgba(154, 148, 200, 0.30)',
    edgeHover: 'rgba(154, 148, 200, 0.6)',
    accent: '#b8b4df',
    accentDim: '#7c76ac',
    text: '#e2e4ee',
    muted: '#8b90a8',
    glow: 'rgba(122, 118, 172, 0.10)',
    halo: 'rgba(154, 148, 200, 0.22)',
    quote: '“In the beginning God created the heavens and the earth.”',
    meta: 'Ninety books · The broader canon · Tewahedo tradition',
    body:
      'The broadest biblical canon in Christendom, assembled in English from public-domain and freely licensed translations — Enoch, Jubilees, and the books of Meqabyan among them.',
  },
}

/** A book cover that tilts gently toward the pointer, like a card in hand. */
function CoverCard({ slug, index, started, reducedMotion, onOpen }) {
  const book = BOOKS[slug]
  const cover = COVERS[slug]
  const rotateX = useSpring(useMotionValue(0), { stiffness: 120, damping: 16 })
  const rotateY = useSpring(useMotionValue(0), { stiffness: 120, damping: 16 })

  const onMove = (event) => {
    if (reducedMotion) return
    const rect = event.currentTarget.getBoundingClientRect()
    const px = (event.clientX - rect.left) / rect.width - 0.5
    const py = (event.clientY - rect.top) / rect.height - 0.5
    rotateY.set(px * 7)
    rotateX.set(py * -7)
  }
  const onLeave = (event) => {
    rotateX.set(0)
    rotateY.set(0)
    event.currentTarget.style.borderColor = cover.edge
  }

  return (
    <div className={index % 2 === 0 ? 'float-slow' : 'float-slow-late'} style={{ perspective: 1100 }}>
      <motion.button
        type="button"
        onClick={() => onOpen(slug)}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reducedMotion ? 0 : 0.75 + index * 0.15, duration: 0.9, ease: EASE }}
        style={{ background: cover.ground, borderColor: cover.edge, rotateX, rotateY }}
        className="group relative w-full h-full text-left rounded-sm border p-8 sm:p-10 backdrop-blur-[2px] transition-colors duration-300 focus-visible:outline-offset-4 will-change-transform"
        onMouseMove={onMove}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = cover.edgeHover)}
        onMouseLeave={onLeave}
        aria-label={`Open ${book.title}`}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ background: `radial-gradient(ellipse 70% 55% at 50% 20%, ${cover.glow}, transparent 70%)` }}
        />

        <div className="relative">
          <div className="relative w-fit" style={{ color: cover.accentDim }}>
            <span
              aria-hidden="true"
              className="emblem-halo"
              style={{ background: `radial-gradient(circle, ${cover.halo}, transparent 70%)` }}
            />
            <div className="spin-slower">
              <BookEmblem bookSlug={slug} size={72} animated />
            </div>
          </div>

          <p className="caps-label mt-7" style={{ color: cover.muted }}>
            {book.tagline}
          </p>
          <h3 className="mt-2 font-display font-light text-2xl sm:text-[1.75rem]" style={{ color: cover.text }}>
            {book.title}
          </h3>

          <p className="mt-4 font-serif italic text-[0.9375rem] leading-relaxed" style={{ color: cover.muted }}>
            {cover.quote}
          </p>
          <p className="mt-4 font-sans text-sm leading-relaxed" style={{ color: cover.muted }}>
            {cover.body}
          </p>

          <p className="mt-6 font-sans text-[0.6875rem] tracking-caps uppercase" style={{ color: cover.muted }}>
            {cover.meta}
          </p>

          <span
            className="mt-7 inline-flex items-center gap-2 font-sans text-sm border rounded-sm px-4 py-2.5 transition-colors"
            style={{ color: cover.accent, borderColor: cover.edge }}
          >
            {started ? 'Continue reading' : 'Open the book'}
            <ArrowRight size={14} aria-hidden="true" className="transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </motion.button>
    </div>
  )
}

export function LandingPage() {
  const navigate = useNavigate()
  const reducedMotion = usePrefersReducedMotion()
  const setActiveBook = useAppStore((state) => state.setActiveBook)
  const localProgress = useLocalProgressStore((state) => state.byChapter)

  useEffect(() => {
    document.title = 'The Perennial — A Living Library of Sacred Texts'
  }, [])

  // The whole scene leans very slightly toward the pointer.
  const sceneX = useSpring(useMotionValue(0), { stiffness: 40, damping: 20 })
  const sceneY = useSpring(useMotionValue(0), { stiffness: 40, damping: 20 })
  const onScenePointer = (event) => {
    if (reducedMotion) return
    sceneX.set((event.clientX / window.innerWidth - 0.5) * -22)
    sceneY.set((event.clientY / window.innerHeight - 0.5) * -14)
  }

  // A quiet "continue reading" hint per book, from local progress.
  const started = useMemo(() => {
    const slugs = Object.keys(localProgress)
    return {
      'ethiopian-bible': slugs.some((slug) => slug.startsWith('eb-')),
      'the-kybalion': slugs.some((slug) => !slug.startsWith('eb-')),
    }
  }, [localProgress])

  const open = (slug) => {
    setActiveBook(slug)
    navigate('/home')
  }

  const at = (delay) => (reducedMotion ? 0 : delay)

  return (
    <div
      className="relative min-h-dvh grain flex flex-col overflow-hidden"
      style={{ background: '#07080f' }}
      onMouseMove={onScenePointer}
    >
      <motion.div aria-hidden="true" className="absolute -inset-8" style={{ x: sceneX, y: sceneY }}>
        <CosmicBackground />
      </motion.div>

      <div className="relative flex-1 flex flex-col items-center justify-center px-5 py-14">
        {/* The library's own seal and name */}
        <PerennialMark size={84} animated className="text-gold-500" />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: at(0.3), duration: 0.8, ease: EASE }}
          className="caps-label text-parchment-500 mt-7"
        >
          A living library
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 12, letterSpacing: '0.3em' }}
          animate={{ opacity: 1, y: 0, letterSpacing: '0.18em' }}
          transition={{ delay: at(0.4), duration: 1.2, ease: EASE }}
          className="mt-4 font-display font-light text-4xl sm:text-5xl md:text-6xl text-parchment-100 uppercase text-center"
        >
          The Perennial
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: at(0.6), duration: 0.9, ease: EASE }}
          className="mt-5 font-serif italic text-lg sm:text-xl text-parchment-300 text-center"
        >
          Wisdom that returns, season after season.
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: at(0.75), duration: 0.9, ease: EASE }}
          className="mt-5 max-w-xl text-center font-sans text-sm text-parchment-400 leading-relaxed"
        >
          One quiet reading room for the world's enduring texts — each presented verbatim from
          public-domain and freely licensed editions, with modern commentary always set apart from
          the original words. Open a book and it keeps your place, your notes, and its own colours.
        </motion.p>

        {/* The shelf */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: at(0.9), duration: 0.8, ease: EASE }}
          className="caps-label text-gold-400 mt-14"
        >
          Now on the shelf
        </motion.p>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 w-full max-w-4xl">
          {BOOK_ORDER.map((slug, index) => (
            <CoverCard
              key={slug}
              slug={slug}
              index={index}
              started={started[slug]}
              reducedMotion={reducedMotion}
              onOpen={open}
            />
          ))}
        </div>

        {/* Room for what comes next */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: at(1.25), duration: 1.0, ease: EASE }}
          className="mt-6 w-full max-w-4xl border border-dashed rounded-sm px-8 py-6 flex items-center gap-6"
          style={{ borderColor: 'rgba(154, 158, 186, 0.22)' }}
          aria-label="More books are being prepared"
        >
          <PerennialMark size={44} className="shrink-0 text-[#5c6078]" />
          <div>
            <p className="caps-label" style={{ color: '#8b90a8' }}>
              The shelf grows
            </p>
            <p className="mt-1.5 font-serif italic text-sm leading-relaxed" style={{ color: '#6f7488' }}>
              Further traditions are being prepared for the archive — each in its own colours, in
              its own time.
            </p>
          </div>
        </motion.div>
      </div>

      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: at(1.4), duration: 0.8 }}
        className="relative px-6 py-6 text-center"
      >
        <p className="font-sans text-xs text-parchment-500 leading-relaxed max-w-xl mx-auto">
          Every text is public domain or freely licensed, loaded verbatim and credited
          edition by edition. Commentary is always shown as a modern addition.{' '}
          <Link to="/about" className="underline decoration-dotted hover:text-parchment-300">
            About the editions
          </Link>
        </p>
      </motion.footer>
    </div>
  )
}
