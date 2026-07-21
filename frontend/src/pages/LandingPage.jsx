import { motion } from 'framer-motion'
import { useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

import { BookEmblem } from '../components/common/BookEmblem'
import { usePrefersReducedMotion } from '../hooks/useMediaQuery'
import { BOOKS, BOOK_ORDER, useAppStore } from '../stores/appStore'
import { useLocalProgressStore } from '../stores/localProgressStore'
import { EASE } from '../utils/motion'

/**
 * The threshold of the archive: a library of two books, each presented as
 * its own dark cover in its own colours. Choosing one opens it — the whole
 * interface takes on that book's palette and the reader resumes its place.
 */

// Fixed cover palettes: the covers keep their identity regardless of which
// book (and colour mode) the rest of the interface is currently wearing.
const COVERS = {
  'the-kybalion': {
    ground: '#0f0d0a',
    edge: 'rgba(191, 160, 93, 0.28)',
    edgeHover: 'rgba(191, 160, 93, 0.55)',
    accent: '#d3b878',
    accentDim: '#a3874a',
    text: '#ece2ce',
    muted: '#9a917d',
    glow: 'rgba(191, 160, 93, 0.09)',
    quote: '“The lips of wisdom are closed, except to the ears of Understanding.”',
    meta: 'Fifteen chapters · Seven principles · 1908',
    body:
      'The Hermetic philosophy of ancient Egypt and Greece — read the 1908 text with layered commentary, an interactive knowledge map, and a study companion for each principle.',
  },
  'ethiopian-bible': {
    ground: '#090b15',
    edge: 'rgba(154, 148, 200, 0.30)',
    edgeHover: 'rgba(154, 148, 200, 0.6)',
    accent: '#b8b4df',
    accentDim: '#7c76ac',
    text: '#e2e4ee',
    muted: '#8b90a8',
    glow: 'rgba(122, 118, 172, 0.10)',
    quote: '“In the beginning God created the heavens and the earth.”',
    meta: 'Ninety books · The broader canon · Tewahedo tradition',
    body:
      'The broadest biblical canon in Christendom, assembled in English from public-domain and freely licensed translations — Enoch, Jubilees, and the books of Meqabyan among them.',
  },
}

export function LandingPage() {
  const navigate = useNavigate()
  const reducedMotion = usePrefersReducedMotion()
  const setActiveBook = useAppStore((state) => state.setActiveBook)
  const localProgress = useLocalProgressStore((state) => state.byChapter)

  useEffect(() => {
    document.title = 'The Kybalion & The Ethiopian Bible — An Interactive Study Library'
  }, [])

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
    <div className="relative min-h-dvh grain bg-ink-950 flex flex-col overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 45% 40% at 28% 30%, rgba(191,160,93,0.05), transparent 70%),' +
            'radial-gradient(ellipse 45% 40% at 72% 30%, rgba(122,118,172,0.06), transparent 70%)',
        }}
      />

      <div className="relative flex-1 flex flex-col items-center justify-center px-5 py-14">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: at(0.1), duration: 0.8, ease: EASE }}
          className="caps-label text-parchment-500"
        >
          The archive is open
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: at(0.25), duration: 0.9, ease: EASE }}
          className="mt-4 font-display font-light text-3xl sm:text-4xl md:text-5xl tracking-[0.18em] text-parchment-100 uppercase text-center"
        >
          Choose your book
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: at(0.45), duration: 0.9, ease: EASE }}
          className="mt-4 max-w-lg text-center font-serif italic text-lg text-parchment-400 leading-relaxed"
        >
          Two traditions share one reading room. Each keeps its own colours, its own
          tools, and your own place in its pages.
        </motion.p>

        {/* The two covers */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 w-full max-w-4xl">
          {BOOK_ORDER.map((slug, index) => {
            const book = BOOKS[slug]
            const cover = COVERS[slug]
            return (
              <motion.button
                key={slug}
                type="button"
                onClick={() => open(slug)}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: at(0.55 + index * 0.15), duration: 0.9, ease: EASE }}
                whileHover={reducedMotion ? undefined : { y: -6 }}
                className="group relative text-left rounded-sm border p-8 sm:p-10 transition-colors duration-300 focus-visible:outline-offset-4"
                style={{ background: cover.ground, borderColor: cover.edge }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = cover.edgeHover)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = cover.edge)}
                aria-label={`Open ${book.title}`}
              >
                <div
                  aria-hidden="true"
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: `radial-gradient(ellipse 70% 55% at 50% 20%, ${cover.glow}, transparent 70%)` }}
                />

                <div className="relative">
                  <div style={{ color: cover.accentDim }}>
                    <BookEmblem bookSlug={slug} size={72} />
                  </div>

                  <p className="caps-label mt-7" style={{ color: cover.muted }}>
                    {book.tagline}
                  </p>
                  <h2
                    className="mt-2 font-display font-light text-2xl sm:text-[1.75rem]"
                    style={{ color: cover.text }}
                  >
                    {book.title}
                  </h2>

                  <p
                    className="mt-4 font-serif italic text-[0.9375rem] leading-relaxed"
                    style={{ color: cover.muted }}
                  >
                    {cover.quote}
                  </p>
                  <p
                    className="mt-4 font-sans text-sm leading-relaxed"
                    style={{ color: cover.muted }}
                  >
                    {cover.body}
                  </p>

                  <p className="mt-6 font-sans text-[0.6875rem] tracking-caps uppercase" style={{ color: cover.muted }}>
                    {cover.meta}
                  </p>

                  <span
                    className="mt-7 inline-flex items-center gap-2 font-sans text-sm border rounded-sm px-4 py-2.5 transition-colors"
                    style={{ color: cover.accent, borderColor: cover.edge }}
                  >
                    {started[slug] ? 'Continue reading' : 'Open the book'}
                    <ArrowRight
                      size={14}
                      aria-hidden="true"
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </span>
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>

      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: at(1.1), duration: 0.8 }}
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
