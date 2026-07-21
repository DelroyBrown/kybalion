import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Check, ChevronsUpDown, LibraryBig } from 'lucide-react'

import { BOOKS, BOOK_ORDER, useAppStore } from '../../stores/appStore'
import { cn } from '../../utils/cn'
import { BookEmblem } from '../common/BookEmblem'

/**
 * The library switcher: shows the open book's emblem and title, and unfolds
 * a small panel to move between the Kybalion and the Ethiopian Bible.
 * `expanded` controls whether the title text is visible — pass 'group' to
 * follow the nav rail's reveal-on-hover behaviour.
 */
export function BookSwitcher({ expanded = true, onSwitched, className = '' }) {
  const activeBookSlug = useAppStore((state) => state.activeBookSlug)
  const setActiveBook = useAppStore((state) => state.setActiveBook)
  const active = BOOKS[activeBookSlug]
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const choose = (slug) => {
    setOpen(false)
    if (slug !== activeBookSlug) {
      setActiveBook(slug)
      navigate('/home')
    }
    onSwitched?.()
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Open book: ${active.title}. Switch book`}
        className="flex w-full items-center gap-3 px-4 h-20 text-gold-400 hover:text-gold-300 transition-colors"
      >
        <BookEmblem bookSlug={activeBookSlug} size={34} className="shrink-0" />
        <span
          className={cn(
            'min-w-0 flex-1 text-left transition-opacity duration-200',
            expanded === 'group'
              ? 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'
              : expanded
                ? 'opacity-100'
                : 'opacity-0'
          )}
        >
          <span className="caps-label block truncate">{active.title}</span>
          <span className="mt-0.5 flex items-center gap-1 font-sans text-[0.625rem] text-parchment-500">
            Switch book <ChevronsUpDown size={10} aria-hidden="true" />
          </span>
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            aria-label="Books"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="absolute left-2 right-2 top-[4.75rem] z-50 border hairline rounded-sm bg-ink-850 shadow-xl shadow-ink-950/60 overflow-hidden"
          >
            {BOOK_ORDER.map((slug) => {
              const book = BOOKS[slug]
              const isActive = slug === activeBookSlug
              return (
                <li key={slug}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => choose(slug)}
                    className={cn(
                      'flex w-full items-center gap-3 px-3 py-3 text-left transition-colors',
                      isActive ? 'bg-gold-500/[0.08] text-gold-200' : 'text-parchment-300 hover:bg-ink-700/60'
                    )}
                  >
                    <BookEmblem bookSlug={slug} size={26} className="shrink-0 opacity-80" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-sans text-sm truncate">{book.title}</span>
                      <span className="block font-sans text-[0.6875rem] text-parchment-500 truncate">
                        {book.tagline}
                      </span>
                    </span>
                    {isActive && <Check size={14} className="shrink-0 text-gold-400" aria-hidden="true" />}
                  </button>
                </li>
              )
            })}
            <li className="border-t hairline">
              <Link
                to="/"
                onClick={() => {
                  setOpen(false)
                  onSwitched?.()
                }}
                className="flex items-center gap-3 px-3 py-2.5 font-sans text-xs text-parchment-500 hover:text-parchment-200 hover:bg-ink-700/60 transition-colors"
              >
                <LibraryBig size={14} aria-hidden="true" />
                View the library
              </Link>
            </li>
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
